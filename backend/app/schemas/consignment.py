import uuid
from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field

from app.models.consignment import CommissionType, ConsignmentStatus
from app.schemas.car import CarResponse


class ConsignmentCreate(BaseModel):
    # Owner Info
    owner_name: str = Field(..., description="Full Name of Vehicle Owner")
    owner_cnic: str = Field(..., description="CNIC Number of Owner")
    owner_phone: str = Field(..., description="Contact Phone Number")
    owner_address: Optional[str] = Field(None, description="Physical Address")

    # Car Info
    car_number: str = Field(..., description="License Plate / Car Number")
    make: str = Field(..., description="Vehicle Make e.g. Honda")
    model: str = Field(..., description="Vehicle Model e.g. Civic")
    year: int = Field(..., description="Manufacturing Year")
    color: Optional[str] = None
    engine_number: str = Field(..., description="Engine Number")
    chassis_number: str = Field(..., description="Chassis Number")
    mileage: Optional[int] = Field(None, description="Odometer Mileage")

    # Commission & Pricing
    commission_type: CommissionType = Field(CommissionType.PERCENTAGE, description="PERCENTAGE or FIXED_AMOUNT")
    commission_value: float = Field(..., gt=0, description="Commission percentage or fixed PKR amount")
    agreed_asking_price: float = Field(..., gt=0, description="Agreed asking price in PKR")
    notes: Optional[str] = None


class ConsignmentWithdraw(BaseModel):
    withdrawal_reason: Optional[str] = Field(None, description="Reason for vehicle withdrawal by owner")
    notes: Optional[str] = None


class ConsignmentSaleSettlement(BaseModel):
    consignment_id: uuid.UUID
    selling_price: float
    showroom_commission: float
    owner_payout: float
    sale_id: Optional[uuid.UUID] = None


class ConsignmentResponse(BaseModel):
    id: uuid.UUID
    owner_name: str
    owner_cnic: str
    owner_phone: str
    owner_address: Optional[str] = None
    owner_cnic_front_url: Optional[str] = None
    owner_cnic_back_url: Optional[str] = None

    car_id: uuid.UUID
    commission_type: CommissionType
    commission_value: float
    agreed_asking_price: float
    status: ConsignmentStatus
    deposit_date: datetime
    withdrawal_date: Optional[datetime] = None
    notes: Optional[str] = None

    created_by_id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    car: Optional[CarResponse] = None

    model_config = ConfigDict(from_attributes=True)
