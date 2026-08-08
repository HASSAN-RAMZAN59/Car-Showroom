import uuid
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.notification import Notification


class NotificationBase(BaseModel):
    title: str
    message: str
    type: str = "INFO"  # INFO, SUCCESS, WARNING, DANGER
    link: Optional[str] = None
    target_role: Optional[str] = None
    user_id: Optional[uuid.UUID] = None


class NotificationCreate(NotificationBase):
    pass


class NotificationOut(NotificationBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    is_read: bool
    created_at: datetime


class NotificationResponse(BaseModel):
    unread_count: int
    notifications: List[NotificationOut]


async def create_system_notification(
    db: AsyncSession,
    title: str,
    message: str,
    target_role: Optional[str] = None,
    user_id: Optional[uuid.UUID] = None,
    type: str = "INFO",
    link: Optional[str] = None,
) -> Notification:
    """Helper function to create and emit a system notification in the database."""
    notification = Notification(
        title=title,
        message=message,
        target_role=target_role,
        user_id=user_id,
        type=type,
        link=link,
    )
    db.add(notification)
    return notification
