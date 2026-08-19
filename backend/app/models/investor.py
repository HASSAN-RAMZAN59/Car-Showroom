import enum
import uuid
from datetime import datetime, timezone
from typing import TYPE_CHECKING, List, Optional

from sqlalchemy import DateTime, Enum, Float, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.car import Car
    from app.models.user import User


class InvestmentStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    SETTLED = "SETTLED"
    CANCELLED = "CANCELLED"


class PayoutStatus(str, enum.Enum):
    PENDING = "PENDING"
    PAID = "PAID"


class Investor(Base):
    """SQLAlchemy model for Showroom Capital Investors."""

    __tablename__ = "investors"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        index=True,
    )
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    cnic: Mapped[str] = mapped_column(
        String(50), unique=True, index=True, nullable=False
    )
    phone: Mapped[str] = mapped_column(String(50), nullable=False)
    total_capital_invested: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

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
    investments: Mapped[List["CarInvestment"]] = relationship(
        "CarInvestment",
        back_populates="investor",
        cascade="all, delete-orphan",
        order_by="CarInvestment.created_at.desc()",
    )


class CarInvestment(Base):
    """SQLAlchemy model for Capital Investment mapped to specific Vehicle inventory."""

    __tablename__ = "car_investments"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        index=True,
    )
    investor_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("investors.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    car_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("cars.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    investment_amount: Mapped[float] = mapped_column(Float, nullable=False)
    agreed_profit_percentage: Mapped[float] = mapped_column(
        Float, nullable=False, comment="Percentage of net profit share (e.g. 40.0 for 40%)"
    )
    
    status: Mapped[InvestmentStatus] = mapped_column(
        Enum(InvestmentStatus, name="investment_status_enum", native_enum=False),
        default=InvestmentStatus.ACTIVE,
        nullable=False,
    )
    profit_earned: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    payout_status: Mapped[PayoutStatus] = mapped_column(
        Enum(PayoutStatus, name="payout_status_enum", native_enum=False),
        default=PayoutStatus.PENDING,
        nullable=False,
    )
    payout_date: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

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
    investor: Mapped["Investor"] = relationship("Investor", back_populates="investments")
    car: Mapped["Car"] = relationship("Car")
    created_by: Mapped["User"] = relationship("User")
