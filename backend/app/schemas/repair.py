import uuid
from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field


class RepairBase(BaseModel):
    repair_type: str = Field(..., description="e.g. Denting/Painting, Mechanical, Detailing, Tyres")
    vendor_name: Optional[str] = Field(None, description="Name of mechanic or workshop vendor")
    cost: float = Field(..., gt=0, description="Cost of repair in local currency")
    notes: Optional[str] = Field(None, description="Detailed repair notes or work performed")


class RepairCreate(RepairBase):
    car_id: uuid.UUID


class RepairResponse(RepairBase):
    id: uuid.UUID
    car_id: uuid.UUID
    receipt_url: Optional[str] = None
    created_by_id: uuid.UUID
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class CarRepairsListResponse(BaseModel):
    car_id: uuid.UUID
    total_repair_cost: float
    repairs: List[RepairResponse] = []

    model_config = ConfigDict(from_attributes=True)
