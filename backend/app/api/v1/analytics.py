from datetime import datetime, timezone
from typing import Any, Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, require_roles
from app.core.database import get_db
from app.models.car import Car, CarStatus
from app.models.expense import Expense
from app.models.payroll import Payroll, PayrollPaymentStatus
from app.models.sale import Sale
from app.models.user import User, UserRole
from app.schemas.analytics import (
    FinancialSummaryResponse,
    InventoryAgingCarItem,
    InventoryAgingResponse,
)

router = APIRouter()


@router.get(
    "/financial-summary",
    response_model=FinancialSummaryResponse,
    dependencies=[Depends(require_roles([UserRole.ADMIN, UserRole.MANAGER]))],
)
async def get_financial_summary(
    start_date: Optional[datetime] = Query(None, description="Filter financial analysis start date"),
    end_date: Optional[datetime] = Query(None, description="Filter financial analysis end date"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Executive financial dashboard aggregating total revenue, gross profit, expenses, payroll, and net showroom profit."""
    # 1. Total Sales Revenue & Total Cost Basis (Gross Profit)
    sales_stmt = select(
        func.coalesce(func.sum(Sale.final_sale_price), 0.0).label("total_revenue"),
        func.coalesce(func.sum(Sale.total_cost_basis), 0.0).label("total_cost"),
    )
    if start_date:
        sales_stmt = sales_stmt.where(Sale.sale_date >= start_date)
    if end_date:
        sales_stmt = sales_stmt.where(Sale.sale_date <= end_date)

    sales_res = await db.execute(sales_stmt)
    sales_row = sales_res.first()
    total_sales_revenue = float(sales_row[0]) if sales_row else 0.0
    total_car_purchase_cost = float(sales_row[1]) if sales_row else 0.0
    total_gross_profit = total_sales_revenue - total_car_purchase_cost

    # 2. Total Daily Operational Expenses
    exp_stmt = select(func.coalesce(func.sum(Expense.amount), 0.0))
    if start_date:
        exp_stmt = exp_stmt.where(Expense.date >= start_date)
    if end_date:
        exp_stmt = exp_stmt.where(Expense.date <= end_date)

    exp_res = await db.execute(exp_stmt)
    total_operational_expenses = float(exp_res.scalar() or 0.0)

    # 3. Total Paid Payroll Expenses
    payroll_stmt = select(func.coalesce(func.sum(Payroll.net_salary), 0.0)).where(
        Payroll.payment_status == PayrollPaymentStatus.PAID
    )
    if start_date:
        payroll_stmt = payroll_stmt.where(Payroll.payment_date >= start_date)
    if end_date:
        payroll_stmt = payroll_stmt.where(Payroll.payment_date <= end_date)

    payroll_res = await db.execute(payroll_stmt)
    total_payroll_expenses = float(payroll_res.scalar() or 0.0)

    # 4. Total Net Showroom Profit
    total_net_showroom_profit = (
        total_gross_profit - total_operational_expenses - total_payroll_expenses
    )

    return FinancialSummaryResponse(
        total_sales_revenue=total_sales_revenue,
        total_car_purchase_cost=total_car_purchase_cost,
        total_gross_profit=total_gross_profit,
        total_operational_expenses=total_operational_expenses,
        total_payroll_expenses=total_payroll_expenses,
        total_net_showroom_profit=total_net_showroom_profit,
        start_date=start_date,
        end_date=end_date,
    )


@router.get(
    "/inventory-aging",
    response_model=InventoryAgingResponse,
    dependencies=[Depends(require_roles([UserRole.ADMIN, UserRole.MANAGER]))],
)
async def get_inventory_aging(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Analyze unsold inventory aging, highlighting slow-moving vehicles parked for over 30 and 60 days."""
    stmt = select(Car).where(Car.status != CarStatus.SOLD).order_by(Car.created_at.asc())
    result = await db.execute(stmt)
    unsold_cars = result.scalars().all()

    now = datetime.now(timezone.utc)
    total_capital_locked = 0.0
    slow_30_count = 0
    slow_60_count = 0
    car_items = []

    for car in unsold_cars:
        total_capital_locked += car.purchase_price
        
        # Calculate days in stock
        car_created = car.created_at
        if car_created.tzinfo is None:
            car_created = car_created.replace(tzinfo=timezone.utc)
        
        days_in_stock = (now - car_created).days

        if days_in_stock >= 60:
            slow_60_count += 1
            slow_30_count += 1
        elif days_in_stock >= 30:
            slow_30_count += 1

        car_items.append(
            InventoryAgingCarItem(
                id=car.id,
                car_number=car.car_number,
                make=car.make,
                model=car.model,
                year=car.year,
                color=car.color,
                purchase_price=car.purchase_price,
                status=car.status.value if hasattr(car.status, "value") else str(car.status),
                days_in_stock=days_in_stock,
                created_at=car.created_at,
            )
        )

    return InventoryAgingResponse(
        total_unsold_vehicles=len(unsold_cars),
        total_capital_locked=total_capital_locked,
        slow_moving_30_days_count=slow_30_count,
        slow_moving_60_days_count=slow_60_count,
        vehicles=car_items,
    )
