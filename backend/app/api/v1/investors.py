import uuid
from datetime import datetime, timezone
from typing import Any, List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload, selectinload

from app.api.deps import get_current_user, require_roles
from app.core.database import get_db
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
    InvestorUpdate,
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


@router.put(
    "/{investor_id}",
    response_model=InvestorResponse,
    dependencies=[Depends(require_roles([UserRole.ADMIN, UserRole.MANAGER]))],
)
async def update_investor(
    investor_id: uuid.UUID,
    investor_in: InvestorUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Update investor profile details (full_name, cnic, phone, notes)."""
    stmt = select(Investor).where(Investor.id == investor_id)
    res = await db.execute(stmt)
    investor = res.scalars().first()
    if not investor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Investor not found",
        )

    update_data = investor_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        if value is not None:
            setattr(investor, field, value)

    await db.commit()
    await db.refresh(investor)
    return investor


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

    # Eagerly load car for response
    stmt = (
        select(CarInvestment)
        .options(
            joinedload(CarInvestment.car),
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
        )
        .where(CarInvestment.car_id == car_id)
        .order_by(CarInvestment.created_at.desc())
    )
    result = await db.execute(stmt)
    return result.scalars().all()


@router.get(
    "/investments/all",
    response_model=List[CarInvestmentResponse],
    dependencies=[Depends(require_roles([UserRole.ADMIN, UserRole.MANAGER]))],
)
async def list_all_investments(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """List all car investments across all investors."""
    stmt = (
        select(CarInvestment)
        .options(
            joinedload(CarInvestment.car),
            joinedload(CarInvestment.investor),
        )
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
    """Log payout payment (principal capital + earned profit share) to the investor."""
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

    # Update investment payout status
    investment.payout_status = PayoutStatus.PAID
    investment.payout_date = datetime.now(timezone.utc)

    await db.commit()

    # Re-fetch with relationships loaded
    stmt_reload = (
        select(CarInvestment)
        .options(
            joinedload(CarInvestment.car),
        )
        .where(CarInvestment.id == investment.id)
    )
    res_reload = await db.execute(stmt_reload)
    return res_reload.scalars().first()


@router.delete(
    "/{investor_id}",
    status_code=status.HTTP_200_OK,
    dependencies=[Depends(require_roles([UserRole.ADMIN, UserRole.MANAGER]))],
)
async def delete_investor(
    investor_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Delete an investor profile (Admin/Manager only). Prevents deletion if investor has active investments."""
    res = await db.execute(select(Investor).where(Investor.id == investor_id))
    investor = res.scalars().first()
    if not investor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Investor record not found",
        )

    # Check for active investments
    inv_res = await db.execute(select(CarInvestment).where(CarInvestment.investor_id == investor_id))
    if inv_res.scalars().first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete investor who has linked investment records. Delete the investments first.",
        )

    await db.delete(investor)
    await db.commit()
    return {"message": "Investor profile deleted successfully", "investor_id": str(investor_id)}


@router.delete(
    "/investments/{investment_id}",
    status_code=status.HTTP_200_OK,
    dependencies=[Depends(require_roles([UserRole.ADMIN, UserRole.MANAGER]))],
)
async def delete_car_investment(
    investment_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Delete a car investment record (Admin/Manager only) and adjust investor total capital."""
    res = await db.execute(select(CarInvestment).where(CarInvestment.id == investment_id))
    investment = res.scalars().first()
    if not investment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Investment record not found",
        )

    # Revert investor total capital invested
    investor_res = await db.execute(select(Investor).where(Investor.id == investment.investor_id))
    investor = investor_res.scalars().first()
    if investor:
        investor.total_capital_invested = max(0.0, investor.total_capital_invested - investment.investment_amount)

    await db.delete(investment)
    await db.commit()
    return {"message": "Investment record deleted successfully", "investment_id": str(investment_id)}

