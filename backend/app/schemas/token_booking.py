import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field

from app.models.token_booking import TokenStatus
from app.schemas.car import CarResponse
from app.schemas.customer import CustomerResponse


class TokenBookingBase(BaseModel):
    car_id: uuid.UUID
    customer_id: uuid.UUID
    advance_amount: float = Field(..., gt=0, description="Advance payment amount in PKR")
    expiry_date: datetime = Field(..., description="Expiration date of token reservation")
    is_refundable: bool = False
    notes: Optional[str] = None


class TokenBookingCreate(TokenBookingBase):
    pass


class TokenBookingResponse(TokenBookingBase):
    id: uuid.UUID
    status: TokenStatus
    created_by_id: uuid.UUID
    created_at: datetime
    car: Optional[CarResponse] = None
    customer: Optional[CustomerResponse] = None

    model_config = ConfigDict(from_attributes=True)
