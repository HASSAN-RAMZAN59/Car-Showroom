import uuid
from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field

from app.models.bank import PaymentMethod, TransactionType


class BankAccountBase(BaseModel):
    account_title: str = Field(..., description="e.g. Meezan Showroom Main Account")
    bank_name: str = Field(..., description="e.g. Meezan Bank")
    account_number: str = Field(..., description="Unique Bank Account / IBAN Number")
    current_balance: float = Field(0.0, ge=0, description="Current cleared balance")
    is_active: bool = True


class BankAccountCreate(BaseModel):
    account_title: str
    bank_name: str
    account_number: str
    current_balance: float = 0.0


class BankAccountUpdate(BaseModel):
    account_title: Optional[str] = None
    bank_name: Optional[str] = None
    account_number: Optional[str] = None
    current_balance: Optional[float] = Field(None, ge=0)
    is_active: Optional[bool] = None


class BankAccountResponse(BankAccountBase):

    id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class PaymentTransactionBase(BaseModel):
    transaction_type: TransactionType
    payment_method: PaymentMethod
    bank_account_id: Optional[uuid.UUID] = None
    amount: float = Field(..., gt=0, description="Transaction amount in PKR")
    reference_number: Optional[str] = Field(None, description="Bank Txn ID, Cheque No, or Ref")
    car_id: Optional[uuid.UUID] = None
    sale_id: Optional[uuid.UUID] = None
    purchase_id: Optional[uuid.UUID] = None
    installment_payment_id: Optional[uuid.UUID] = None
    notes: Optional[str] = None


class PaymentTransactionCreate(PaymentTransactionBase):
    pass


class PaymentTransactionResponse(PaymentTransactionBase):
    id: uuid.UUID
    created_by_id: uuid.UUID
    created_at: datetime
    bank_account: Optional[BankAccountResponse] = None

    model_config = ConfigDict(from_attributes=True)


class SplitPaymentItem(BaseModel):
    amount: float = Field(..., gt=0, description="Split payment amount in PKR")
    payment_method: PaymentMethod
    bank_account_id: Optional[uuid.UUID] = None
    reference_number: Optional[str] = None
    notes: Optional[str] = None


class SplitSalePaymentCreate(BaseModel):
    sale_id: uuid.UUID
    payments: List[SplitPaymentItem] = Field(..., min_length=1)
