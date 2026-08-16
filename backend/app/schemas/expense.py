import uuid
from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field

from app.models.bank import PaymentMethod
from app.schemas.bank import BankAccountResponse
from app.schemas.user import UserResponse


class ExpenseBase(BaseModel):
    expense_name: str = Field(..., description="e.g. Electricity Bill, Office Tea")
    category: str = Field(..., description="e.g. Utilities, Maintenance, Food/Tea, Fuel")
    amount: float = Field(..., gt=0, description="Expense amount in PKR")
    date: Optional[datetime] = Field(None, description="Transaction date (Defaults to current date/time)")
    reason: Optional[str] = Field(None, description="Detailed explanation or invoice notes")
    payment_method: PaymentMethod = PaymentMethod.CASH
    bank_account_id: Optional[uuid.UUID] = Field(None, description="Target bank account ID if paid via Bank Transfer")


class ExpenseCreate(ExpenseBase):
    pass


class ExpenseUpdate(BaseModel):
    expense_name: Optional[str] = None
    category: Optional[str] = None
    amount: Optional[float] = Field(None, gt=0)
    reason: Optional[str] = None
    payment_method: Optional[PaymentMethod] = None
    bank_account_id: Optional[uuid.UUID] = None


class ExpenseResponse(ExpenseBase):

    id: uuid.UUID
    receipt_url: Optional[str] = None
    created_by_id: uuid.UUID
    created_at: datetime
    bank_account: Optional[BankAccountResponse] = None
    created_by: Optional[UserResponse] = None

    model_config = ConfigDict(from_attributes=True)


class ExpenseListResponse(BaseModel):
    total_expense_amount: float = 0.0
    expenses: List[ExpenseResponse] = []

    model_config = ConfigDict(from_attributes=True)
