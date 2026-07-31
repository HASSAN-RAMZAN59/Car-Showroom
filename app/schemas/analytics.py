import uuid
from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict


class FinancialSummaryResponse(BaseModel):
    total_sales_revenue: float = 0.0
    total_car_purchase_cost: float = 0.0
    total_gross_profit: float = 0.0
    total_operational_expenses: float = 0.0
    total_payroll_expenses: float = 0.0
    total_net_showroom_profit: float = 0.0
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class InventoryAgingCarItem(BaseModel):
    id: uuid.UUID
    car_number: str
    make: str
    model: str
    year: int
    color: Optional[str] = None
    purchase_price: float
    status: str
    days_in_stock: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class InventoryAgingResponse(BaseModel):
    total_unsold_vehicles: int = 0
    total_capital_locked: float = 0.0
    slow_moving_30_days_count: int = 0
    slow_moving_60_days_count: int = 0
    vehicles: List[InventoryAgingCarItem] = []

    model_config = ConfigDict(from_attributes=True)
