import uuid
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import or_, select, update, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.notification import Notification
from app.models.user import User
from app.schemas.notification import NotificationOut, NotificationResponse

router = APIRouter()


@router.get("/", response_model=NotificationResponse)
async def get_notifications(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Fetch notifications relevant to the logged-in user or their role."""
    # Filter conditions: notification is specifically for current user ID,
    # OR notification target_role matches user's role (e.g. ADMIN, MANAGER, EMPLOYEE),
    # OR target_role is 'ALL'
    role_str = current_user.role.value if hasattr(current_user.role, 'value') else str(current_user.role)

    condition = or_(
        Notification.user_id == current_user.id,
        Notification.target_role == role_str,
        Notification.target_role == "ALL",
    )

    # 1. Query unread count
    count_stmt = select(func.count(Notification.id)).where(condition, Notification.is_read == False)
    count_result = await db.execute(count_stmt)
    unread_count = count_result.scalar_one_or_none() or 0

    # 2. Query top 20 recent notifications
    stmt = (
        select(Notification)
        .where(condition)
        .order_by(Notification.created_at.desc())
        .limit(20)
    )
    result = await db.execute(stmt)
    notifications_list = result.scalars().all()

    return NotificationResponse(
        unread_count=unread_count,
        notifications=notifications_list,
    )


@router.patch("/{notification_id}/read", response_model=NotificationOut)
async def mark_notification_as_read(
    notification_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Mark a specific notification as read."""
    role_str = current_user.role.value if hasattr(current_user.role, 'value') else str(current_user.role)

    stmt = select(Notification).where(
        Notification.id == notification_id,
        or_(
            Notification.user_id == current_user.id,
            Notification.target_role == role_str,
            Notification.target_role == "ALL",
        ),
    )
    result = await db.execute(stmt)
    notification = result.scalar_one_or_none()

    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found or access denied.",
        )

    notification.is_read = True
    await db.commit()
    await db.refresh(notification)
    return notification


@router.patch("/read-all", response_model=dict)
async def mark_all_notifications_as_read(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Mark all active notifications for the current user/role as read."""
    role_str = current_user.role.value if hasattr(current_user.role, 'value') else str(current_user.role)

    stmt = (
        update(Notification)
        .where(
            or_(
                Notification.user_id == current_user.id,
                Notification.target_role == role_str,
                Notification.target_role == "ALL",
            ),
            Notification.is_read == False,
        )
        .values(is_read=True)
    )
    await db.execute(stmt)
    await db.commit()
    return {"message": "All notifications marked as read."}
