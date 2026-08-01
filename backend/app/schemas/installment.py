import uuid
from datetime import date, datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field

from app.models.installment import InstallmentPlanStatus, PaymentStatus
from app.schemas.sale import SaleDetailResponse


class InstallmentPlanCreate(BaseModel):
    sale_id: uuid.UUID
    down_payment: float = Field(..., ge=0, description="Down payment amount paid at sale time")
    duration_months: int = Field(..., ge=1, le=10, description="Financing duration in months (1-10)")


class InstallmentPaymentLog(BaseModel):
    amount_paid: float = Field(..., gt=0, description="Payment amount received for this installment")
    payment_method: Optional[str] = Field(None, description="e.g. Cash, Bank Transfer, Cheque")
    transaction_reference: Optional[str] = Field(None, description="Bank transaction ref or receipt number")
    notes: Optional[str] = None


class InstallmentPaymentResponse(BaseModel):
    id: uuid.UUID
    plan_id: uuid.UUID
    installment_number: int
    due_date: date
    amount_due: float
    amount_paid: float
    payment_date: Optional[datetime] = None
    status: PaymentStatus
    payment_method: Optional[str] = None
    transaction_reference: Optional[str] = None
    notes: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class InstallmentPlanResponse(BaseModel):
    id: uuid.UUID
    sale_id: uuid.UUID
    total_amount: float
    down_payment: float
    financed_amount: float
    duration_months: int
    monthly_installment_amount: float
    status: InstallmentPlanStatus
    total_paid: float = 0.0
    remaining_balance: float = 0.0
    created_by_id: uuid.UUID
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class InstallmentPlanDetailResponse(InstallmentPlanResponse):
    payments: List[InstallmentPaymentResponse] = []
    sale: Optional[SaleDetailResponse] = None

    model_config = ConfigDict(from_attributes=True)
