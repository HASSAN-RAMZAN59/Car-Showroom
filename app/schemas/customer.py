import uuid
from datetime import datetime
from typing import Any, List, Optional

from pydantic import BaseModel, ConfigDict


class CustomerBase(BaseModel):
    full_name: str
    cnic: str
    phone: str
    address: Optional[str] = None


class CustomerCreate(CustomerBase):
    pass


class CustomerUpdate(BaseModel):
    full_name: Optional[str] = None
    cnic: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None


class CustomerResponse(CustomerBase):
    id: uuid.UUID
    cnic_front_url: Optional[str] = None
    cnic_back_url: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class CustomerDetailResponse(CustomerResponse):
    token_bookings: List[Any] = []
    sales: List[Any] = []

    model_config = ConfigDict(from_attributes=True)
