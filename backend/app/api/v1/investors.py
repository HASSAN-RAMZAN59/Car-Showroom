import uuid
from datetime import datetime, timezone
from typing import Any, List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload, selectinload

from app.api.deps import get_current_user, require_roles
from app.core.database import get_db
from app.models.bank import BankAccount, PaymentMethod, PaymentTransaction, TransactionType
from app.models.car import Car, CarStatus
from app.models.investor import CarInvestment, InvestmentStatus, Investor, PayoutStatus
from app.models.user import User, UserRole
from app.schemas.investor import (
    CarInvestmentCreate,
    CarInvestmentResponse,
    InvestorCreate,
    InvestorDetailResponse,
    InvestorPayoutCreate,
    InvestorResponse,
)

router = APIRouter()


@router.post(
    "/",
    response_model=InvestorResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_roles([UserRole.ADMIN, UserRole.MANAGER]))],
)
async def create_investor(
    investor_in: InvestorCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Register a new showroom capital investor profile."""
    # Check for duplicate CNIC
    res = await db.execute(select(Investor).where(Investor.cnic == investor_in.cnic))
    if res.scalars().first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"An investor with CNIC '{investor_in.cnic}' already exists.",
        )

    investor = Investor(
        full_name=investor_in.full_name,
        cnic=investor_in.cnic,
        phone=investor_in.phone,
        notes=investor_in.notes,
        total_capital_invested=0.0,
    )
    db.add(investor)
    await db.commit()
    await db.refresh(investor)
    return investor


@router.get(
    "/",
    response_model=List[InvestorResponse],
    dependencies=[Depends(require_roles([UserRole.ADMIN, UserRole.MANAGER]))],
)
async def list_investors(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """List all registered capital investors."""
    stmt = select(Investor).order_by(Investor.created_at.desc())
    result = await db.execute(stmt)
    investors = result.scalars().all()
    return investors


@router.get(
    "/{investor_id}",
    response_model=InvestorDetailResponse,
    dependencies=[Depends(require_roles([UserRole.ADMIN, UserRole.MANAGER]))],
)
async def get_investor(
    investor_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Get detailed investor profile with active vehicle portfolio and settled payouts."""
    stmt = (
        select(Investor)
        .options(
            selectinload(Investor.investments).options(
                joinedload(CarInvestment.car),
                joinedload(CarInvestment.bank_account),
            )
        )
        .where(Investor.id == investor_id)
    )
    result = await db.execute(stmt)
    investor = result.scalars().first()
    if not investor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Investor not found",
        )

    total_profit = sum(inv.profit_earned for inv in investor.investments if inv and inv.profit_earned)
    
    return InvestorDetailResponse(
        id=investor.id,
        full_name=investor.full_name,
        cnic=investor.cnic,
        phone=investor.phone,
        notes=investor.notes,
        total_capital_invested=investor.total_capital_invested,
        created_at=investor.created_at,
        updated_at=investor.updated_at,
        investments=investor.investments,
        total_profit_earned=total_profit,
    )


@router.post(
    "/investment",
    response_model=CarInvestmentResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_roles([UserRole.ADMIN, UserRole.MANAGER]))],
)
async def create_car_investment(
    investment_in: CarInvestmentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Map a capital investment to a specific vehicle inventory item."""
    # 1. Verify investor exists
    investor_res = await db.execute(
        select(Investor).where(Investor.id == investment_in.investor_id)
    )
    investor = investor_res.scalars().first()
    if not investor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Investor with ID '{investment_in.investor_id}' not found.",
        )

    # 2. Verify car exists and is not sold
    car_res = await db.execute(select(Car).where(Car.id == investment_in.car_id))
    car = car_res.scalars().first()
    if not car:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Vehicle with ID '{investment_in.car_id}' not found.",
        )
    if car.status == CarStatus.SOLD:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot map investment to a vehicle that has already been sold.",
        )

    # 3. Update total capital invested
    investor.total_capital_invested += investment_in.investment_amount

    # 4. Create CarInvestment record
    car_inv = CarInvestment(
        investor_id=investment_in.investor_id,
        car_id=investment_in.car_id,
        investment_amount=investment_in.investment_amount,
        agreed_profit_percentage=investment_in.agreed_profit_percentage,
        status=InvestmentStatus.ACTIVE,
        payout_status=PayoutStatus.PENDING,
        created_by_id=current_user.id,
    )
    db.add(car_inv)
    await db.commit()

    # Eagerly load car & bank_account for response
    stmt = (
        select(CarInvestment)
        .options(
            joinedload(CarInvestment.car),
            joinedload(CarInvestment.bank_account),
        )
        .where(CarInvestment.id == car_inv.id)
    )
    res = await db.execute(stmt)
    return res.scalars().first()


@router.get(
    "/car/{car_id}",
    response_model=List[CarInvestmentResponse],
    dependencies=[Depends(require_roles([UserRole.ADMIN, UserRole.MANAGER]))],
)
async def list_investments_for_car(
    car_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """List all investor capital backing for a specific vehicle."""
    stmt = (
        select(CarInvestment)
        .options(
            joinedload(CarInvestment.car),
            joinedload(CarInvestment.bank_account),
        )
        .where(CarInvestment.car_id == car_id)
        .order_by(CarInvestment.created_at.desc())
    )
    result = await db.execute(stmt)
    return result.scalars().all()


@router.post(
    "/payout/{investment_id}",
    response_model=CarInvestmentResponse,
    dependencies=[Depends(require_roles([UserRole.ADMIN, UserRole.MANAGER]))],
)
async def process_investor_payout(
    investment_id: uuid.UUID,
    payout_in: InvestorPayoutCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Log payout payment (principal capital + earned profit share) to the investor and deduct from bank balance."""
    stmt = (
        select(CarInvestment)
        .options(
            joinedload(CarInvestment.car),
            joinedload(CarInvestment.investor),
        )
        .where(CarInvestment.id == investment_id)
    )
    result = await db.execute(stmt)
    investment = result.scalars().first()
    if not investment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Car investment record '{investment_id}' not found.",
        )
    if investment.status != InvestmentStatus.SETTLED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Investment must be in SETTLED status (vehicle sold & profit settled) before processing payout.",
        )
    if investment.payout_status == PayoutStatus.PAID:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Payout has already been executed and marked as PAID.",
        )

    # Compute total payout (Principal + Profit)
    total_payout = investment.investment_amount + investment.profit_earned

    # Deduct from bank account if specified
    bank_account = None
    if payout_in.bank_account_id:
        bank_res = await db.execute(
            select(BankAccount).where(BankAccount.id == payout_in.bank_account_id)
        )
        bank_account = bank_res.scalars().first()
        if not bank_account:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Bank Account with ID '{payout_in.bank_account_id}' not found.",
            )
        if bank_account.current_balance < total_payout:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Insufficient bank balance for payout. Current balance: PKR {bank_account.current_balance:,.2f}, Required: PKR {total_payout:,.2f}",
            )
        bank_account.current_balance -= total_payout

        # Record payment transaction entry
        car_no = investment.car.car_number if investment.car else "N/A"
        tx = PaymentTransaction(
            transaction_type=TransactionType.WITHDRAWAL,
            payment_method=PaymentMethod.BANK_TRANSFER,
            bank_account_id=bank_account.id,
            amount=total_payout,
            reference_number=payout_in.transaction_reference,
            car_id=investment.car_id,
            notes=f"Investor Payout (Capital: {investment.investment_amount:,.0f} + Profit: {investment.profit_earned:,.0f}) for Car {car_no}",
            created_by_id=current_user.id,
        )
        db.add(tx)

    # Update investment payout status
    investment.payout_status = PayoutStatus.PAID
    investment.payout_date = datetime.now(timezone.utc)
    investment.bank_account_id = payout_in.bank_account_id

    await db.commit()

    # Re-fetch with relationships loaded
    stmt_reload = (
        select(CarInvestment)
        .options(
            joinedload(CarInvestment.car),
            joinedload(CarInvestment.bank_account),
        )
        .where(CarInvestment.id == investment.id)
    )
    res_reload = await db.execute(stmt_reload)
    return res_reload.scalars().first()
