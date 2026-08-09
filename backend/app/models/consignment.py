import enum
import uuid
from datetime import datetime, timezone
from typing import TYPE_CHECKING, Optional

from sqlalchemy import DateTime, Enum, Float, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.car import Car
    from app.models.user import User


class CommissionType(str, enum.Enum):
    PERCENTAGE = "PERCENTAGE"
    FIXED_AMOUNT = "FIXED_AMOUNT"


class ConsignmentStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    SOLD = "SOLD"
    RETURNED_TO_OWNER = "RETURNED_TO_OWNER"


class ConsignmentAgreement(Base):
    """SQLAlchemy model for Third-Party Consignment Vehicle Agreements."""

    __tablename__ = "consignment_agreements"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        index=True,
    )
    owner_name: Mapped[str] = mapped_column(String(255), nullable=False)
    owner_cnic: Mapped[str] = mapped_column(String(50), index=True, nullable=False)
    owner_phone: Mapped[str] = mapped_column(String(50), nullable=False)
    owner_address: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    owner_cnic_front_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    owner_cnic_back_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)

    car_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("cars.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
        index=True,
    )

    commission_type: Mapped[CommissionType] = mapped_column(
        Enum(CommissionType, name="commission_type_enum", native_enum=False),
        nullable=False,
    )
    commission_value: Mapped[float] = mapped_column(Float, nullable=False)
    agreed_asking_price: Mapped[float] = mapped_column(Float, nullable=False)

    status: Mapped[ConsignmentStatus] = mapped_column(
        Enum(ConsignmentStatus, name="consignment_status_enum", native_enum=False),
        default=ConsignmentStatus.ACTIVE,
        nullable=False,
        index=True,
    )

    deposit_date: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    withdrawal_date: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
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
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationships
    car: Mapped["Car"] = relationship("Car", back_populates="consignment_agreement")
    created_by: Mapped["User"] = relationship("User")
