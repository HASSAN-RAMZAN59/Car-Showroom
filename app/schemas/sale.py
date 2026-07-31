import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field

from app.models.sale import PaymentType
from app.schemas.car import CarDetailResponse
from app.schemas.customer import CustomerResponse
from app.schemas.user import UserResponse


class SaleBase(BaseModel):
    car_id: uuid.UUID
    customer_id: uuid.UUID
    final_sale_price: float = Field(..., gt=0, description="Agreed final selling price")
    payment_type: PaymentType = PaymentType.FULL_PAYMENT
    notes: Optional[str] = None


class SaleCreate(SaleBase):
    pass


class SaleResponse(SaleBase):
    id: uuid.UUID
    sold_by_employee_id: uuid.UUID
    sale_date: datetime
    total_cost_basis: float
    net_profit: float
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class SaleDetailResponse(SaleResponse):
    car: Optional[CarDetailResponse] = None
    customer: Optional[CustomerResponse] = None
    sold_by: Optional[UserResponse] = None

    model_config = ConfigDict(from_attributes=True)
