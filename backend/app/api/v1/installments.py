import uuid
from datetime import date, datetime, timedelta, timezone
from typing import Any, List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload, selectinload

from app.api.deps import get_current_user, require_roles
from app.core.database import get_db
from app.models.bank import (
    BankAccount,
    PaymentMethod as BankPaymentMethod,
    PaymentTransaction,
    TransactionType,
)
from app.models.car import Car
from app.models.customer import Customer
from app.models.installment import (
    InstallmentPayment,
    InstallmentPlan,
    InstallmentPlanStatus,
    PaymentStatus,
)
from app.models.sale import PaymentType, Sale
from app.models.user import User, UserRole
from app.schemas.installment import (
    InstallmentPaymentLog,
    InstallmentPaymentResponse,
    InstallmentPlanCreate,
    InstallmentPlanDetailResponse,
    InstallmentPlanResponse,
)

router = APIRouter()


@router.get(
    "/",
    response_model=List[InstallmentPlanDetailResponse],
    dependencies=[Depends(require_roles([UserRole.ADMIN, UserRole.MANAGER, UserRole.EMPLOYEE]))],
)
async def list_all_installment_plans(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """List all financing installment plans along with customer, vehicle, and monthly payment schedules."""
    stmt = (
        select(InstallmentPlan)
        .options(
            selectinload(InstallmentPlan.payments),
            joinedload(InstallmentPlan.sale).options(
                joinedload(Sale.car).options(joinedload(Car.seller), selectinload(Car.repairs)),
                joinedload(Sale.customer),
                joinedload(Sale.sold_by),
            ),
        )
        .order_by(InstallmentPlan.created_at.desc())
    )
    result = await db.execute(stmt)
    return result.scalars().all()


@router.post(
    "/plan",
    response_model=InstallmentPlanDetailResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_roles([UserRole.ADMIN, UserRole.MANAGER, UserRole.EMPLOYEE]))],
)
async def create_installment_plan(
    plan_in: InstallmentPlanCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Create a financing installment plan for a vehicle sale and auto-generate monthly payment schedules."""
    # 1. Verify sale exists
    sale_res = await db.execute(select(Sale).where(Sale.id == plan_in.sale_id))
    sale = sale_res.scalars().first()
    if not sale:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Sale transaction with ID '{plan_in.sale_id}' not found.",
        )

    # 2. Check if an installment plan already exists for this sale
    existing_plan_res = await db.execute(
        select(InstallmentPlan).where(InstallmentPlan.sale_id == plan_in.sale_id)
    )
    if existing_plan_res.scalars().first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An installment plan has already been created for this sale.",
        )

    # 3. Calculate financed amount & monthly payment
    total_amount = sale.final_sale_price
    if plan_in.down_payment >= total_amount:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Down payment cannot be equal to or greater than total sale price.",
        )

    financed_amount = total_amount - plan_in.down_payment
    monthly_installment_amount = round(financed_amount / plan_in.duration_months, 2)

    # 4. Create InstallmentPlan record
    plan = InstallmentPlan(
        sale_id=plan_in.sale_id,
        total_amount=total_amount,
        down_payment=plan_in.down_payment,
        financed_amount=financed_amount,
        duration_months=plan_in.duration_months,
        monthly_installment_amount=monthly_installment_amount,
        status=InstallmentPlanStatus.ACTIVE,
        created_by_id=current_user.id,
    )
    sale.payment_type = PaymentType.INSTALLMENT
    db.add(plan)
    await db.flush()  # Flush to get plan.id

    # 5. Auto-generate monthly installment schedule entries (spaced 30 days apart)
    base_date = sale.sale_date.date() if sale.sale_date else date.today()
    for month_idx in range(1, plan_in.duration_months + 1):
        due_date = base_date + timedelta(days=30 * month_idx)
        payment_entry = InstallmentPayment(
            plan_id=plan.id,
            installment_number=month_idx,
            due_date=due_date,
            amount_due=monthly_installment_amount,
            amount_paid=0.0,
            status=PaymentStatus.PENDING,
        )
        db.add(payment_entry)

    await db.commit()

    # Eagerly load plan with schedule, sale, car, seller, repairs & customer for response
    stmt = (
        select(InstallmentPlan)
        .options(
            selectinload(InstallmentPlan.payments),
            joinedload(InstallmentPlan.sale).options(
                joinedload(Sale.car).options(joinedload(Car.seller), selectinload(Car.repairs)),
                joinedload(Sale.customer),
                joinedload(Sale.sold_by),
            ),
        )
        .where(InstallmentPlan.id == plan.id)
    )
    result = await db.execute(stmt)
    return result.scalars().first()


@router.get(
    "/plan/{plan_id}",
    response_model=InstallmentPlanDetailResponse,
    dependencies=[Depends(require_roles([UserRole.ADMIN, UserRole.MANAGER, UserRole.EMPLOYEE]))],
)
async def get_installment_plan(
    plan_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Fetch complete installment plan details, remaining balance, and full monthly payment schedule."""
    stmt = (
        select(InstallmentPlan)
        .options(
            selectinload(InstallmentPlan.payments),
            joinedload(InstallmentPlan.sale).options(
                joinedload(Sale.car).options(joinedload(Car.seller), selectinload(Car.repairs)),
                joinedload(Sale.customer),
                joinedload(Sale.sold_by),
            ),
        )
        .where(InstallmentPlan.id == plan_id)
    )
    result = await db.execute(stmt)
    plan = result.scalars().first()
    if not plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Installment plan not found",
        )
    return plan


@router.get(
    "/sale/{sale_id}",
    response_model=InstallmentPlanDetailResponse,
    dependencies=[Depends(require_roles([UserRole.ADMIN, UserRole.MANAGER, UserRole.EMPLOYEE]))],
)
async def get_installment_plan_by_sale(
    sale_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Get the installment plan linked to a specific car sale."""
    stmt = (
        select(InstallmentPlan)
        .options(
            selectinload(InstallmentPlan.payments),
            joinedload(InstallmentPlan.sale).options(
                joinedload(Sale.car).options(joinedload(Car.seller), selectinload(Car.repairs)),
                joinedload(Sale.customer),
                joinedload(Sale.sold_by),
            ),
        )
        .where(InstallmentPlan.sale_id == sale_id)
    )
    result = await db.execute(stmt)
    plan = result.scalars().first()
    if not plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No installment plan found for sale ID '{sale_id}'.",
        )
    return plan


@router.post(
    "/pay/{payment_id}",
    response_model=InstallmentPaymentResponse,
    dependencies=[Depends(require_roles([UserRole.ADMIN, UserRole.MANAGER, UserRole.EMPLOYEE]))],
)
async def log_installment_payment(
    payment_id: uuid.UUID,
    pay_in: InstallmentPaymentLog,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Log a payment for a specific monthly installment entry and auto-complete plan when fully settled."""
    stmt = (
        select(InstallmentPayment)
        .options(joinedload(InstallmentPayment.plan))
        .where(InstallmentPayment.id == payment_id)
    )
    result = await db.execute(stmt)
    payment = result.scalars().first()
    if not payment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Installment payment entry not found",
        )
    if payment.status == PaymentStatus.PAID:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This installment entry has already been marked as PAID.",
        )

    # Log payment details
    payment.amount_paid = pay_in.amount_paid
    payment.payment_date = datetime.now(timezone.utc)
    payment.status = PaymentStatus.PAID
    payment.payment_method = pay_in.payment_method
    payment.transaction_reference = pay_in.transaction_reference
    payment.notes = pay_in.notes

    # Credit bank account balance and log financial transaction if bank_account_id is provided
    if pay_in.bank_account_id:
        bank_res = await db.execute(select(BankAccount).where(BankAccount.id == pay_in.bank_account_id))
        bank_acc = bank_res.scalars().first()
        if bank_acc:
            bank_acc.current_balance += pay_in.amount_paid
            pm_enum = (
                BankPaymentMethod.BANK_TRANSFER
                if (pay_in.payment_method and "BANK" in pay_in.payment_method.upper())
                else BankPaymentMethod.CASH
            )
            tx = PaymentTransaction(
                transaction_type=TransactionType.INSTALLMENT_PAYMENT,
                payment_method=pm_enum,
                bank_account_id=bank_acc.id,
                amount=pay_in.amount_paid,
                reference_number=pay_in.transaction_reference,
                installment_payment_id=payment.id,
                sale_id=payment.plan.sale_id if payment.plan else None,
                notes=f"EMI Payment #{payment.installment_number} collection for plan",
                created_by_id=current_user.id,
            )
            db.add(tx)

    await db.flush()

    # Check if all payments in the parent plan are completed
    stmt_all = select(InstallmentPayment).where(InstallmentPayment.plan_id == payment.plan_id)
    res_all = await db.execute(stmt_all)
    all_payments = res_all.scalars().all()

    if all(p.status == PaymentStatus.PAID for p in all_payments):
        plan_stmt = select(InstallmentPlan).where(InstallmentPlan.id == payment.plan_id)
        res_plan = await db.execute(plan_stmt)
        plan = res_plan.scalars().first()
        if plan:
            plan.status = InstallmentPlanStatus.COMPLETED

    await db.commit()
    await db.refresh(payment)
    return payment


@router.get(
    "/overdue",
    response_model=List[InstallmentPaymentResponse],
    dependencies=[Depends(require_roles([UserRole.ADMIN, UserRole.MANAGER, UserRole.EMPLOYEE]))],
)
async def list_overdue_payments(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """List all overdue installment payments across all customers."""
    today = date.today()
    stmt = (
        select(InstallmentPayment)
        .where(
            InstallmentPayment.due_date < today,
            InstallmentPayment.status != PaymentStatus.PAID,
        )
        .order_by(InstallmentPayment.due_date.asc())
    )

    # Automatically mark matching items as OVERDUE
    result = await db.execute(stmt)
    overdue_payments = result.scalars().all()
    
    modified = False
    for p in overdue_payments:
        if p.status != PaymentStatus.OVERDUE:
            p.status = PaymentStatus.OVERDUE
            modified = True

    if modified:
        await db.commit()

    return overdue_payments


@router.delete(
    "/payments/{payment_id}",
    status_code=status.HTTP_200_OK,
    dependencies=[Depends(require_roles([UserRole.ADMIN, UserRole.MANAGER]))],
)
async def delete_installment_payment(
    payment_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Delete an installment payment collection (Admin/Manager only), reverting bank balance and reset status to PENDING."""
    res = await db.execute(select(InstallmentPayment).where(InstallmentPayment.id == payment_id))
    payment = res.scalars().first()
    if not payment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Installment payment record not found",
        )

    # Revert payment transaction & bank balance if present
    tx_res = await db.execute(select(PaymentTransaction).where(PaymentTransaction.installment_payment_id == payment_id))
    transactions = tx_res.scalars().all()
    for tx in transactions:
        if tx.bank_account_id:
            bank_res = await db.execute(select(BankAccount).where(BankAccount.id == tx.bank_account_id))
            bank_acc = bank_res.scalars().first()
            if bank_acc:
                bank_acc.current_balance -= tx.amount
        await db.delete(tx)

    # Reset payment record to pending
    payment.status = PaymentStatus.PENDING
    payment.amount_paid = 0.0
    payment.payment_date = None
    payment.payment_method = None
    payment.transaction_reference = None

    await db.commit()
    return {"message": "Installment payment reverted to pending successfully", "payment_id": str(payment_id)}


@router.delete(
    "/plan/{plan_id}",
    status_code=status.HTTP_200_OK,
    dependencies=[Depends(require_roles([UserRole.ADMIN, UserRole.MANAGER]))],
)
async def delete_installment_plan(
    plan_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Delete an entire installment financing plan contract and all its payment schedules."""
    res = await db.execute(select(InstallmentPlan).where(InstallmentPlan.id == plan_id))
    plan = res.scalars().first()
    if not plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Installment plan not found",
        )

    await db.delete(plan)
    await db.commit()
    return {"message": "Installment financing contract deleted successfully", "plan_id": str(plan_id)}


