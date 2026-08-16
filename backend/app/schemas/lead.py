import uuid
from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field

from app.models.lead import LeadStatus
from app.schemas.payroll import EmployeeResponse


class LeadBase(BaseModel):
    customer_name: str
    phone: str = Field(..., description="Customer primary contact phone number")
    email: Optional[str] = None
    budget_min: Optional[float] = Field(None, ge=0)
    budget_max: Optional[float] = Field(None, ge=0)
    preferred_make: Optional[str] = Field(None, description="e.g. Toyota, Honda")
    preferred_model: Optional[str] = Field(None, description="e.g. Civic, Corolla")
    assigned_employee_id: Optional[uuid.UUID] = Field(None, description="Assigned Sales Dealer/Employee ID")


class LeadCreate(LeadBase):
    status: LeadStatus = LeadStatus.HOT


class LeadUpdate(BaseModel):
    customer_name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    budget_min: Optional[float] = Field(None, ge=0)
    budget_max: Optional[float] = Field(None, ge=0)
    preferred_make: Optional[str] = None
    preferred_model: Optional[str] = None
    assigned_employee_id: Optional[uuid.UUID] = None
    status: Optional[LeadStatus] = None


class LeadStatusUpdate(BaseModel):

    status: LeadStatus = Field(..., description="HOT, WARM, COLD, CONVERTED, CLOSED")


class LeadFollowupCreate(BaseModel):
    note: str = Field(..., description="Follow-up call or meeting notes")
    next_followup_date: Optional[datetime] = Field(None, description="Scheduled next follow-up date/time")


class LeadFollowupResponse(BaseModel):
    id: uuid.UUID
    lead_id: uuid.UUID
    note: str
    next_followup_date: Optional[datetime] = None
    created_by_id: uuid.UUID
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class LeadResponse(LeadBase):
    id: uuid.UUID
    status: LeadStatus
    created_by_id: uuid.UUID
    created_at: datetime
    updated_at: datetime
    assigned_employee: Optional[EmployeeResponse] = None

    model_config = ConfigDict(from_attributes=True)


class LeadDetailResponse(LeadResponse):
    followups: List[LeadFollowupResponse] = []

    model_config = ConfigDict(from_attributes=True)
