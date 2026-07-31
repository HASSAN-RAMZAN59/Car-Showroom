import enum
import uuid
from datetime import date, datetime, timezone
from typing import TYPE_CHECKING, List, Optional

from sqlalchemy import Date, DateTime, Enum, Float, ForeignKey, Integer, String, Text, inspect
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.sale import Sale
    from app.models.user import User


class InstallmentPlanStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    COMPLETED = "COMPLETED"
    DEFAULTED = "DEFAULTED"


class PaymentStatus(str, enum.Enum):
    PENDING = "PENDING"
    PAID = "PAID"
    OVERDUE = "OVERDUE"


class InstallmentPlan(Base):
    """SQLAlchemy model for Flexible Installment (EMI) Financing Plans."""

    __tablename__ = "installment_plans"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        index=True,
    )
    sale_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("sales.id", ondelete="RESTRICT"),
        unique=True,
        nullable=False,
        index=True,
    )
    total_amount: Mapped[float] = mapped_column(Float, nullable=False)
    down_payment: Mapped[float] = mapped_column(Float, nullable=False)
    financed_amount: Mapped[float] = mapped_column(Float, nullable=False)
    duration_months: Mapped[int] = mapped_column(Integer, nullable=False)
    monthly_installment_amount: Mapped[float] = mapped_column(Float, nullable=False)
    
    status: Mapped[InstallmentPlanStatus] = mapped_column(
        Enum(InstallmentPlanStatus, name="installment_plan_status_enum", native_enum=False),
        default=InstallmentPlanStatus.ACTIVE,
        nullable=False,
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

    # Relationships
    sale: Mapped["Sale"] = relationship("Sale")
    created_by: Mapped["User"] = relationship("User")
    payments: Mapped[List["InstallmentPayment"]] = relationship(
        "InstallmentPayment",
        back_populates="plan",
        cascade="all, delete-orphan",
        order_by="InstallmentPayment.installment_number",
    )

    @property
    def total_paid(self) -> float:
        """Calculate total amount paid to date (Down Payment + All Paid Installments)."""
        state = inspect(self)
        if "payments" in state.unloaded:
            return self.down_payment if self.down_payment else 0.0
        paid_installments = sum(
            p.amount_paid for p in self.payments if p and p.amount_paid
        )
        return (self.down_payment or 0.0) + paid_installments

    @property
    def remaining_balance(self) -> float:
        """Calculate remaining unpaid balance."""
        tot = self.total_amount if self.total_amount else 0.0
        return max(0.0, tot - self.total_paid)


class InstallmentPayment(Base):
    """SQLAlchemy model for Individual Monthly Installment Payments / Receipts."""

    __tablename__ = "installment_payments"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        index=True,
    )
    plan_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("installment_plans.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    installment_number: Mapped[int] = mapped_column(Integer, nullable=False)
    due_date: Mapped[date] = mapped_column(Date, nullable=False)
    amount_due: Mapped[float] = mapped_column(Float, nullable=False)
    amount_paid: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    payment_date: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    status: Mapped[PaymentStatus] = mapped_column(
        Enum(PaymentStatus, name="payment_status_enum", native_enum=False),
        default=PaymentStatus.PENDING,
        nullable=False,
    )
    payment_method: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    transaction_reference: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Relationships
    plan: Mapped["InstallmentPlan"] = relationship("InstallmentPlan", back_populates="payments")
