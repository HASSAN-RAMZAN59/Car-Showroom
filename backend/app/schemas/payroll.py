import uuid
from datetime import date, datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field

from app.models.expense import PaymentMethod
from app.models.payroll import PayrollPaymentStatus


class EmployeeBase(BaseModel):
    full_name: str
    cnic: str = Field(..., description="Unique CNIC number e.g. 35201-1234567-1")
    phone: str
    designation: str = Field(..., description="e.g. Sales Dealer, Showroom Manager, Mechanic")
    base_salary: float = Field(0.0, ge=0, description="Contract base monthly salary in PKR")
    joining_date: date
    is_active: bool = True


class EmployeeCreate(EmployeeBase):
    user_id: Optional[uuid.UUID] = Field(None, description="Optional link to system user account")


class EmployeeUpdate(BaseModel):
    full_name: Optional[str] = None
    cnic: Optional[str] = None
    phone: Optional[str] = None
    designation: Optional[str] = None
    base_salary: Optional[float] = Field(None, ge=0)
    is_active: Optional[bool] = None


class EmployeeResponse(EmployeeBase):

    id: uuid.UUID
    user_id: Optional[uuid.UUID] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class PayrollGenerateCreate(BaseModel):
    employee_id: uuid.UUID
    pay_period_month: int = Field(..., ge=1, le=12, description="Month number 1-12")
    pay_period_year: int = Field(..., ge=2020, le=2100, description="Four digit year e.g. 2026")
    allowances: float = Field(0.0, ge=0, description="Bonuses, commissions, or allowances")
    deductions: float = Field(0.0, ge=0, description="Advances, taxes, or penalties")
    notes: Optional[str] = None


class PayrollPaymentExecute(BaseModel):
    payment_method: PaymentMethod = PaymentMethod.CASH
    notes: Optional[str] = None


class PayrollResponse(BaseModel):
    id: uuid.UUID
    employee_id: uuid.UUID
    pay_period_month: int
    pay_period_year: int
    base_salary: float
    allowances: float
    deductions: float
    net_salary: float
    payment_status: PayrollPaymentStatus
    payment_date: Optional[datetime] = None
    payment_method: Optional[PaymentMethod] = None
    notes: Optional[str] = None
    created_by_id: uuid.UUID
    created_at: datetime
    employee: Optional[EmployeeResponse] = None

    model_config = ConfigDict(from_attributes=True)


class EmployeeDetailResponse(EmployeeResponse):
    payrolls: List[PayrollResponse] = []

    model_config = ConfigDict(from_attributes=True)
