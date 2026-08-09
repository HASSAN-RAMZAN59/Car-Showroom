import uuid
from datetime import date, datetime, timedelta
from typing import Any, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import StreamingResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload, selectinload

from app.api.deps import get_current_user, require_roles
from app.core.database import get_db
from app.core.pdf_generator import generate_sale_deed_pdf
from app.models.bank import BankAccount, PaymentMethod, PaymentTransaction, TransactionType
from app.models.car import Car, CarStatus
from app.models.consignment import CommissionType, ConsignmentAgreement, ConsignmentStatus
from app.models.customer import Customer
from app.models.installment import (
    InstallmentPayment,
    InstallmentPlan,
    InstallmentPlanStatus,
    PaymentStatus,
)
from app.models.investor import CarInvestment, InvestmentStatus, PayoutStatus
from app.models.sale import PaymentType, Sale
from app.models.seller import Seller
from app.models.token_booking import TokenBooking, TokenStatus
from app.schemas.notification import create_system_notification
from app.models.user import User, UserRole
from app.schemas.sale import SaleCreate, SaleDetailResponse, SaleResponse

router = APIRouter()


async def settle_car_investments(
    db: AsyncSession,
    car_id: uuid.UUID,
    final_sale_price: float,
    total_cost_basis: float,
) -> None:
    """Calculate vehicle net profit and automatically settle profit shares for all backing investors."""
    net_profit = max(0.0, final_sale_price - total_cost_basis)
    stmt = select(CarInvestment).where(
        CarInvestment.car_id == car_id,
        CarInvestment.status == InvestmentStatus.ACTIVE,
    )
    res = await db.execute(stmt)
    active_investments = res.scalars().all()

    for inv in active_investments:
        investor_profit = round(net_profit * (inv.agreed_profit_percentage / 100.0), 2)
        inv.profit_earned = investor_profit
        inv.status = InvestmentStatus.SETTLED
        inv.payout_status = PayoutStatus.PENDING


@router.post(
    "/",
    response_model=SaleResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_roles([UserRole.ADMIN, UserRole.MANAGER, UserRole.EMPLOYEE]))],
)
async def create_sale(
    sale_in: SaleCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Register a car sale, calculate net profit, settle investor profit shares, set vehicle status to SOLD, and complete active token bookings."""
    # 1. Verify target vehicle exists and is available
    stmt_car = (
        select(Car)
        .options(selectinload(Car.repairs))
        .where(Car.id == sale_in.car_id)
    )
    res_car = await db.execute(stmt_car)
    car = res_car.scalars().first()
    if not car:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Vehicle with ID '{sale_in.car_id}' not found.",
        )
    if car.status in [CarStatus.SOLD, CarStatus.CONSIGNED_SOLD, CarStatus.CONSIGNED_RETURNED]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Vehicle has already been sold or returned to owner.",
        )

    # 2. Verify customer exists
    res_cust = await db.execute(select(Customer).where(Customer.id == sale_in.customer_id))
    customer = res_cust.scalars().first()
    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Customer with ID '{sale_in.customer_id}' not found.",
        )

    # 3. Handle Consignment calculations vs Standard Inventory
    showroom_commission = 0.0
    owner_payout = 0.0
    consignment_agreement = None

    if car.is_consignment or car.status == CarStatus.CONSIGNED_AVAILABLE:
        stmt_cons = select(ConsignmentAgreement).where(
            ConsignmentAgreement.car_id == car.id,
            ConsignmentAgreement.status == ConsignmentStatus.ACTIVE,
        )
        res_cons = await db.execute(stmt_cons)
        consignment_agreement = res_cons.scalars().first()

        if consignment_agreement:
            if consignment_agreement.commission_type == CommissionType.PERCENTAGE:
                showroom_commission = round((sale_in.final_sale_price * consignment_agreement.commission_value) / 100.0, 2)
            else:
                showroom_commission = consignment_agreement.commission_value

            owner_payout = max(0.0, sale_in.final_sale_price - showroom_commission)
            consignment_agreement.status = ConsignmentStatus.SOLD
            car.status = CarStatus.CONSIGNED_SOLD
            total_cost_basis = 0.0
            net_profit = showroom_commission
        else:
            total_cost_basis = car.total_cost_basis
            net_profit = sale_in.final_sale_price - total_cost_basis
            car.status = CarStatus.SOLD
    else:
        total_cost_basis = car.total_cost_basis
        net_profit = sale_in.final_sale_price - total_cost_basis
        car.status = CarStatus.SOLD

    # 4. Check for active token booking and mark COMPLETED
    stmt_token = select(TokenBooking).where(
        TokenBooking.car_id == car.id, TokenBooking.status == TokenStatus.ACTIVE
    )
    res_token = await db.execute(stmt_token)
    active_token = res_token.scalars().first()
    if active_token:
        active_token.status = TokenStatus.COMPLETED

    # 5. Settle profit for any active capital investors backing this vehicle
    await settle_car_investments(
        db,
        car_id=car.id,
        final_sale_price=sale_in.final_sale_price,
        total_cost_basis=total_cost_basis,
    )

    # 6. Create Sale transaction record
    sale = Sale(
        car_id=sale_in.car_id,
        customer_id=sale_in.customer_id,
        sold_by_employee_id=current_user.id,
        final_sale_price=sale_in.final_sale_price,
        total_cost_basis=total_cost_basis,
        net_profit=net_profit,
        payment_type=sale_in.payment_type,
        notes=sale_in.notes,
    )
    db.add(sale)
    await db.flush()

    # 7. Auto-log Showroom Commission in payment_transactions if consignment vehicle
    if consignment_agreement and showroom_commission > 0:
        # Find active bank account if available to reflect balance
        bank_res = await db.execute(select(BankAccount).where(BankAccount.is_active == True).limit(1))
        bank_acc = bank_res.scalars().first()

        tx = PaymentTransaction(
            transaction_type=TransactionType.CONSIGNMENT_COMMISSION,
            payment_method=PaymentMethod.CASH if not bank_acc else PaymentMethod.BANK_TRANSFER,
            bank_account_id=bank_acc.id if bank_acc else None,
            amount=showroom_commission,
            reference_number=f"COMM-{str(sale.id)[:8].upper()}",
            car_id=car.id,
            sale_id=sale.id,
            notes=f"Consignment Commission for vehicle {car.car_number} ({car.make} {car.model}). Owner Payout: PKR {owner_payout:,.2f}",
            created_by_id=current_user.id,
        )
        db.add(tx)
        if bank_acc:
            bank_acc.current_balance += showroom_commission

    # 8. If INSTALLMENT payment type, automatically generate InstallmentPlan and schedule entries
    if sale_in.payment_type == PaymentType.INSTALLMENT:
        down_payment = (
            sale_in.down_payment
            if sale_in.down_payment is not None
            else round(sale_in.final_sale_price * 0.2, 2)
        )
        duration_months = (
            sale_in.duration_months
            if (sale_in.duration_months and sale_in.duration_months > 0)
            else 12
        )
        financed_amount = max(0.0, sale_in.final_sale_price - down_payment)
        monthly_amount = (
            round(financed_amount / duration_months, 2) if duration_months > 0 else 0.0
        )

        plan = InstallmentPlan(
            sale_id=sale.id,
            total_amount=sale_in.final_sale_price,
            down_payment=down_payment,
            financed_amount=financed_amount,
            duration_months=duration_months,
            monthly_installment_amount=monthly_amount,
            status=InstallmentPlanStatus.ACTIVE,
            created_by_id=current_user.id,
        )
        db.add(plan)
        await db.flush()

        base_date = sale.sale_date.date() if sale.sale_date else date.today()
        for month_idx in range(1, duration_months + 1):
            due_date = base_date + timedelta(days=30 * month_idx)
            payment_entry = InstallmentPayment(
                plan_id=plan.id,
                installment_number=month_idx,
                due_date=due_date,
                amount_due=monthly_amount,
                amount_paid=0.0,
                status=PaymentStatus.PENDING,
            )
            db.add(payment_entry)

    await create_system_notification(
        db,
        title="Vehicle Sale Completed",
        message=f"{car.year} {car.make} {car.model} sold for PKR {sale_in.final_sale_price:,.0f} by {current_user.full_name}",
        target_role="MANAGER",
        type="SUCCESS",
        link="/sales",
    )
    await create_system_notification(
        db,
        title="Vehicle Sale Completed",
        message=f"{car.year} {car.make} {car.model} sold for PKR {sale_in.final_sale_price:,.0f} by {current_user.full_name}",
        target_role="ADMIN",
        type="SUCCESS",
        link="/sales",
    )

    await db.commit()
    await db.refresh(sale)
    return sale


@router.get(
    "/",
    response_model=List[SaleResponse],
    dependencies=[Depends(require_roles([UserRole.ADMIN, UserRole.MANAGER, UserRole.EMPLOYEE]))],
)
async def list_sales(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    start_date: Optional[datetime] = Query(None, description="Filter sales on or after this date"),
    end_date: Optional[datetime] = Query(None, description="Filter sales on or before this date"),
    employee_id: Optional[uuid.UUID] = Query(None, description="Filter sales by selling employee"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """List sales transactions with optional date range and employee filters."""
    stmt = select(Sale)
    if start_date:
        stmt = stmt.where(Sale.sale_date >= start_date)
    if end_date:
        stmt = stmt.where(Sale.sale_date <= end_date)
    if employee_id:
        stmt = stmt.where(Sale.sold_by_employee_id == employee_id)

    stmt = stmt.offset(skip).limit(limit).order_by(Sale.sale_date.desc())
    result = await db.execute(stmt)
    sales = result.scalars().all()
    return sales


@router.get(
    "/{sale_id}",
    response_model=SaleDetailResponse,
    dependencies=[Depends(require_roles([UserRole.ADMIN, UserRole.MANAGER, UserRole.EMPLOYEE]))],
)
async def get_sale(
    sale_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Get detailed sale record with embedded car, customer, and employee info."""
    stmt = (
        select(Sale)
        .options(
            joinedload(Sale.car).options(joinedload(Car.seller), selectinload(Car.repairs)),
            joinedload(Sale.customer),
            joinedload(Sale.sold_by),
        )
        .where(Sale.id == sale_id)
    )
    result = await db.execute(stmt)
    sale = result.scalars().first()
    if not sale:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Sale record not found",
        )
    return sale


@router.get(
    "/{sale_id}/pdf",
    dependencies=[Depends(require_roles([UserRole.ADMIN, UserRole.MANAGER, UserRole.EMPLOYEE]))],
)
async def export_sale_deed_pdf(
    sale_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Generate and stream an official PDF Sale Deed / Agreement document."""
    stmt = (
        select(Sale)
        .options(
            joinedload(Sale.car).options(joinedload(Car.seller), selectinload(Car.repairs)),
            joinedload(Sale.customer),
            joinedload(Sale.sold_by),
        )
        .where(Sale.id == sale_id)
    )
    result = await db.execute(stmt)
    sale = result.scalars().first()
    if not sale:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Sale record not found",
        )

    # Construct sale_data dictionary for PDF generator
    sale_data = {
        "sale_id": str(sale.id)[:8].upper(),
        "sale_date": sale.sale_date.strftime("%Y-%m-%d %H:%M UTC"),
        "car_number": sale.car.car_number if sale.car else "N/A",
        "make": sale.car.make if sale.car else "",
        "model": sale.car.model if sale.car else "",
        "year": sale.car.year if sale.car else 0,
        "color": sale.car.color or "N/A" if sale.car else "N/A",
        "engine_number": sale.car.engine_number if sale.car else "N/A",
        "chassis_number": sale.car.chassis_number if sale.car else "N/A",
        "seller_name": sale.car.seller.full_name if (sale.car and sale.car.seller) else "Car Showroom ERP",
        "seller_cnic": sale.car.seller.cnic if (sale.car and sale.car.seller) else "N/A",
        "seller_phone": sale.car.seller.phone if (sale.car and sale.car.seller) else "N/A",
        "buyer_name": sale.customer.full_name if sale.customer else "N/A",
        "buyer_cnic": sale.customer.cnic if sale.customer else "N/A",
        "buyer_phone": sale.customer.phone if sale.customer else "N/A",
        "buyer_address": sale.customer.address or "N/A" if sale.customer else "N/A",
        "purchase_price": sale.car.purchase_price if sale.car else 0.0,
        "total_repair_cost": sale.car.total_repair_cost if sale.car else 0.0,
        "total_cost_basis": sale.total_cost_basis,
        "final_sale_price": sale.final_sale_price,
        "net_profit": sale.net_profit,
        "payment_type": sale.payment_type.value,
        "employee_name": sale.sold_by.full_name if sale.sold_by else "Authorized Officer",
    }

    pdf_buffer = generate_sale_deed_pdf(sale_data)
    filename = f"Sale_Deed_{sale.car.car_number if sale.car else 'Vehicle'}.pdf"

    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"inline; filename={filename}"},
    )
