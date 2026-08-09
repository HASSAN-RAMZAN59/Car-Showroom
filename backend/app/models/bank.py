import enum
import uuid
from datetime import datetime, timezone
from typing import TYPE_CHECKING, List, Optional

from sqlalchemy import Boolean, DateTime, Enum, Float, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.car import Car
    from app.models.installment import InstallmentPayment
    from app.models.sale import Sale
    from app.models.user import User


class TransactionType(str, enum.Enum):
    SALE_PAYMENT = "SALE_PAYMENT"
    PURCHASE_PAYMENT = "PURCHASE_PAYMENT"
    EXPENSE_PAYMENT = "EXPENSE_PAYMENT"
    INSTALLMENT_PAYMENT = "INSTALLMENT_PAYMENT"
    DEPOSIT = "DEPOSIT"
    WITHDRAWAL = "WITHDRAWAL"
    CONSIGNMENT_COMMISSION = "CONSIGNMENT_COMMISSION"


class PaymentMethod(str, enum.Enum):
    BANK_TRANSFER = "BANK_TRANSFER"
    CASH = "CASH"
    CHEQUE = "CHEQUE"


class BankAccount(Base):
    """SQLAlchemy model for Showroom Bank Accounts."""

    __tablename__ = "bank_accounts"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        index=True,
    )
    account_title: Mapped[str] = mapped_column(String(255), nullable=False)
    bank_name: Mapped[str] = mapped_column(String(255), nullable=False)
    account_number: Mapped[str] = mapped_column(
        String(100), unique=True, index=True, nullable=False
    )
    current_balance: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
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
    transactions: Mapped[List["PaymentTransaction"]] = relationship(
        "PaymentTransaction",
        back_populates="bank_account",
        cascade="all, delete-orphan",
        order_by="PaymentTransaction.created_at.desc()",
    )


class PaymentTransaction(Base):
    """SQLAlchemy model for Financial Payment Ledger Transactions (Bank & Cash)."""

    __tablename__ = "payment_transactions"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        index=True,
    )
    transaction_type: Mapped[TransactionType] = mapped_column(
        Enum(TransactionType, name="transaction_type_enum", native_enum=False),
        nullable=False,
    )
    payment_method: Mapped[PaymentMethod] = mapped_column(
        Enum(PaymentMethod, name="payment_method_enum", native_enum=False),
        nullable=False,
    )
    bank_account_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("bank_accounts.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    amount: Mapped[float] = mapped_column(Float, nullable=False)
    reference_number: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    # Foreign key references for auditing
    car_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("cars.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    sale_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("sales.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    purchase_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("cars.id", ondelete="SET NULL"),
        nullable=True,
    )
    installment_payment_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("installment_payments.id", ondelete="SET NULL"),
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
    bank_account: Mapped[Optional["BankAccount"]] = relationship(
        "BankAccount", back_populates="transactions"
    )
    car: Mapped[Optional["Car"]] = relationship(
        "Car", foreign_keys=[car_id]
    )
    sale: Mapped[Optional["Sale"]] = relationship("Sale")
    created_by: Mapped["User"] = relationship("User")
