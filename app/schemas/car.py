import uuid
from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field

from app.models.car import CarStatus
from app.schemas.seller import SellerResponse
from app.schemas.user import UserResponse


class CarBase(BaseModel):
    car_number: str = Field(..., description="Unique license plate number e.g. LEB-1234")
    make: str = Field(..., description="Vehicle make e.g. Toyota")
    model: str = Field(..., description="Vehicle model e.g. Corolla")
    year: int = Field(..., description="Manufacturing year")
    color: Optional[str] = None
    engine_number: str = Field(..., description="Unique engine number")
    chassis_number: str = Field(..., description="Unique chassis number")
    mileage: Optional[int] = Field(None, description="Odometer mileage in km")
    status: CarStatus = CarStatus.IN_MAINTENANCE
    purchase_price: float = Field(..., gt=0, description="Purchase price paid to seller")
    asking_price: Optional[float] = Field(None, gt=0, description="Target selling price")
    seller_id: uuid.UUID


class CarPurchaseCreate(CarBase):
    pass


class CarUpdate(BaseModel):
    car_number: Optional[str] = None
    make: Optional[str] = None
    model: Optional[str] = None
    year: Optional[int] = None
    color: Optional[str] = None
    engine_number: Optional[str] = None
    chassis_number: Optional[str] = None
    mileage: Optional[int] = None
    status: Optional[CarStatus] = None
    purchase_price: Optional[float] = None
    asking_price: Optional[float] = None
    seller_id: Optional[uuid.UUID] = None


class CarStatusUpdate(BaseModel):
    status: CarStatus
    asking_price: Optional[float] = Field(None, gt=0, description="Updated asking price when vehicle becomes available")


class CarResponse(CarBase):
    id: uuid.UUID
    created_by_id: uuid.UUID
    purchase_date: datetime
    car_photos_urls: List[str] = []
    registration_docs_urls: List[str] = []
    total_repair_cost: float = 0.0
    total_cost_basis: float = 0.0
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class CarDetailResponse(CarResponse):
    seller: Optional[SellerResponse] = None
    created_by: Optional[UserResponse] = None

    model_config = ConfigDict(from_attributes=True)


class CarAutoCompleteResponse(BaseModel):
    id: uuid.UUID
    car_number: str
    make: str
    model: str
    year: int
    engine_number: str
    chassis_number: str
    status: CarStatus
    purchase_price: float
    asking_price: Optional[float] = None
    total_repair_cost: float = 0.0
    total_cost_basis: float = 0.0
    seller: Optional[SellerResponse] = None

    model_config = ConfigDict(from_attributes=True)
