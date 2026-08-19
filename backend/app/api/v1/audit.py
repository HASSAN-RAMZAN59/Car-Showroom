import uuid
from datetime import datetime
from typing import Any, List, Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.api.deps import get_current_user, require_roles
from app.core.database import get_db
from app.models.audit import AuditLog
from app.models.user import User, UserRole
from app.schemas.audit import AuditLogResponse

router = APIRouter()


@router.get(
    "/",
    response_model=List[AuditLogResponse],
    dependencies=[Depends(require_roles([UserRole.ADMIN, UserRole.MANAGER]))],
)
@router.get(
    "/logs",
    response_model=List[AuditLogResponse],
    dependencies=[Depends(require_roles([UserRole.ADMIN, UserRole.MANAGER]))],
)
async def list_audit_logs(
    action: Optional[str] = Query(None, description="Filter by action name e.g. CREATE_CAR, SELL_CAR"),
    user_id: Optional[uuid.UUID] = Query(None, description="Filter by user ID"),
    start_date: Optional[datetime] = Query(None, description="Filter logs on or after this date"),
    end_date: Optional[datetime] = Query(None, description="Filter logs on or before this date"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Retrieve system audit logs & operational history with date range and user filters."""
    stmt = select(AuditLog).options(joinedload(AuditLog.user))

    if action:
        stmt = stmt.where(AuditLog.action.ilike(f"%{action}%"))
    if user_id:
        stmt = stmt.where(AuditLog.user_id == user_id)
    if start_date:
        stmt = stmt.where(AuditLog.created_at >= start_date)
    if end_date:
        stmt = stmt.where(AuditLog.created_at <= end_date)

    stmt = stmt.offset(skip).limit(limit).order_by(AuditLog.created_at.desc())
    result = await db.execute(stmt)
    return result.scalars().all()
