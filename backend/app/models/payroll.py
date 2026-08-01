import enum
import uuid
from datetime import date, datetime, timezone
from typing import TYPE_CHECKING, List, Optional

from sqlalchemy import Boolean, Date, DateTime, Enum, Float, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.bank import PaymentMethod

if TYPE_CHECKING:
    from app.models.bank import BankAccount
    from app.models.user import User


class PayrollPaymentStatus(str, enum.Enum):
    PENDING = "PENDING"
    PAID = "PAID"


class Employee(Base):
    """SQLAlchemy model for Showroom Employees and Sales Dealers."""

    __tablename__ = "employees"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        index=True,
    )
    user_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    cnic: Mapped[str] = mapped_column(
        String(50), unique=True, index=True, nullable=False
    )
    phone: Mapped[str] = mapped_column(String(50), nullable=False)
    designation: Mapped[str] = mapped_column(String(100), nullable=False)
    base_salary: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    joining_date: Mapped[date] = mapped_column(Date, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

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
    user: Mapped[Optional["User"]] = relationship("User")
    payrolls: Mapped[List["Payroll"]] = relationship(
        "Payroll",
        back_populates="employee",
        cascade="all, delete-orphan",
        order_by="Payroll.created_at.desc()",
    )


class Payroll(Base):
    """SQLAlchemy model for Monthly Employee Payroll and Salary Payouts."""

    __tablename__ = "payrolls"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        index=True,
    )
    employee_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("employees.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    pay_period_month: Mapped[int] = mapped_column(Integer, nullable=False)
    pay_period_year: Mapped[int] = mapped_column(Integer, nullable=False)
    
    base_salary: Mapped[float] = mapped_column(Float, nullable=False)
    allowances: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    deductions: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    net_salary: Mapped[float] = mapped_column(Float, nullable=False)

    payment_status: Mapped[PayrollPaymentStatus] = mapped_column(
        Enum(PayrollPaymentStatus, name="payroll_payment_status_enum", native_enum=False),
        default=PayrollPaymentStatus.PENDING,
        nullable=False,
    )
    payment_date: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    payment_method: Mapped[Optional[PaymentMethod]] = mapped_column(
        Enum(PaymentMethod, name="payment_method_enum", native_enum=False),
        nullable=True,
    )
    bank_account_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("bank_accounts.id", ondelete="SET NULL"),
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

    # Relationships
    employee: Mapped["Employee"] = relationship("Employee", back_populates="payrolls")
    bank_account: Mapped[Optional["BankAccount"]] = relationship("BankAccount")
    created_by: Mapped["User"] = relationship("User")
