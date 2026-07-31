import uuid
from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field

from app.models.investor import InvestmentStatus, PayoutStatus
from app.schemas.bank import BankAccountResponse
from app.schemas.car import CarResponse


class InvestorBase(BaseModel):
    full_name: str
    cnic: str = Field(..., description="Unique CNIC number e.g. 42101-1234567-1")
    phone: str
    notes: Optional[str] = None


class InvestorCreate(InvestorBase):
    pass


class InvestorResponse(InvestorBase):
    id: uuid.UUID
    total_capital_invested: float = 0.0
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class CarInvestmentCreate(BaseModel):
    investor_id: uuid.UUID
    car_id: uuid.UUID
    investment_amount: float = Field(..., gt=0, description="Capital invested amount in PKR")
    agreed_profit_percentage: float = Field(
        ..., gt=0, le=100, description="Agreed share of vehicle Net Profit e.g. 40.0"
    )


class CarInvestmentResponse(BaseModel):
    id: uuid.UUID
    investor_id: uuid.UUID
    car_id: uuid.UUID
    investment_amount: float
    agreed_profit_percentage: float
    status: InvestmentStatus
    profit_earned: float = 0.0
    payout_status: PayoutStatus
    payout_date: Optional[datetime] = None
    bank_account_id: Optional[uuid.UUID] = None
    created_by_id: uuid.UUID
    created_at: datetime
    updated_at: datetime
    car: Optional[CarResponse] = None
    bank_account: Optional[BankAccountResponse] = None

    model_config = ConfigDict(from_attributes=True)


class InvestorPayoutCreate(BaseModel):
    bank_account_id: Optional[uuid.UUID] = Field(None, description="Bank Account ID if paid out via Bank; NULL if Cash")
    transaction_reference: Optional[str] = Field(None, description="Bank Txn Ref or Cheque No")
    notes: Optional[str] = None


class InvestorDetailResponse(InvestorResponse):
    investments: List[CarInvestmentResponse] = []
    total_profit_earned: float = 0.0

    model_config = ConfigDict(from_attributes=True)
