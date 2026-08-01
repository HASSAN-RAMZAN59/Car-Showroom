import enum
import uuid
from datetime import datetime, timezone
from typing import TYPE_CHECKING, Optional

from sqlalchemy import Boolean, DateTime, Enum, Float, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.car import Car
    from app.models.customer import Customer
    from app.models.user import User


class TokenStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"
    EXPIRED = "EXPIRED"


class TokenBooking(Base):
    """SQLAlchemy model for Advance Token Bookings / Vehicle Reservations."""

    __tablename__ = "token_bookings"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        index=True,
    )
    car_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("cars.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    customer_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("customers.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    advance_amount: Mapped[float] = mapped_column(Float, nullable=False)
    expiry_date: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
    is_refundable: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=False
    )
    status: Mapped[TokenStatus] = mapped_column(
        Enum(TokenStatus, name="token_status_enum", native_enum=False),
        default=TokenStatus.ACTIVE,
        nullable=False,
    )
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    created_by_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationships
    car: Mapped["Car"] = relationship("Car")
    customer: Mapped["Customer"] = relationship(
        "Customer", back_populates="token_bookings"
    )
    created_by: Mapped["User"] = relationship("User")
