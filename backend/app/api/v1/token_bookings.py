import uuid
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import joinedload

from app.api.deps import get_current_user, require_roles
from app.core.database import get_db
from app.models.car import Car, CarStatus
from app.models.customer import Customer
from app.models.token_booking import TokenBooking, TokenStatus
from app.models.user import User, UserRole
from app.schemas.token_booking import TokenBookingCreate, TokenBookingResponse

router = APIRouter()


@router.post(
    "/",
    response_model=TokenBookingResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_roles([UserRole.ADMIN, UserRole.MANAGER, UserRole.EMPLOYEE]))],
)
async def create_token_booking(
    booking_in: TokenBookingCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Log an advance token payment and reserve a vehicle."""
    # 1. Verify target car exists
    car_res = await db.execute(select(Car).where(Car.id == booking_in.car_id))
    car = car_res.scalars().first()
    if not car:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Vehicle with ID '{booking_in.car_id}' not found.",
        )
    if car.status == CarStatus.SOLD:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Vehicle has already been sold.",
        )
    if car.status == CarStatus.RESERVED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Vehicle is currently reserved under another active token booking.",
        )

    # 2. Verify customer exists
    customer_res = await db.execute(select(Customer).where(Customer.id == booking_in.customer_id))
    customer = customer_res.scalars().first()
    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Customer with ID '{booking_in.customer_id}' not found.",
        )

    # 3. Create TokenBooking record
    token_booking = TokenBooking(
        car_id=booking_in.car_id,
        customer_id=booking_in.customer_id,
        advance_amount=booking_in.advance_amount,
        expiry_date=booking_in.expiry_date,
        is_refundable=booking_in.is_refundable,
        notes=booking_in.notes,
        status=TokenStatus.ACTIVE,
        created_by_id=current_user.id,
    )

    # 4. Reserve vehicle
    car.status = CarStatus.RESERVED

    db.add(token_booking)
    await db.commit()
    await db.refresh(token_booking)

    # Eagerly load relations for response
    stmt = (
        select(TokenBooking)
        .options(joinedload(TokenBooking.car), joinedload(TokenBooking.customer))
        .where(TokenBooking.id == token_booking.id)
    )
    result = await db.execute(stmt)
    return result.scalars().first()


@router.get(
    "/car/{car_id}",
    response_model=TokenBookingResponse,
    dependencies=[Depends(require_roles([UserRole.ADMIN, UserRole.MANAGER, UserRole.EMPLOYEE]))],
)
async def get_active_token_for_car(
    car_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Fetch active token reservation details for a vehicle."""
    stmt = (
        select(TokenBooking)
        .options(joinedload(TokenBooking.car), joinedload(TokenBooking.customer))
        .where(TokenBooking.car_id == car_id, TokenBooking.status == TokenStatus.ACTIVE)
    )
    result = await db.execute(stmt)
    booking = result.scalars().first()
    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No active token reservation found for vehicle ID '{car_id}'.",
        )
    return booking


@router.get(
    "/",
    response_model=list[TokenBookingResponse],
    dependencies=[Depends(require_roles([UserRole.ADMIN, UserRole.MANAGER, UserRole.EMPLOYEE]))],
)
async def list_token_bookings(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """List all token reservations along with vehicle and customer details."""
    stmt = (
        select(TokenBooking)
        .options(joinedload(TokenBooking.car), joinedload(TokenBooking.customer))
        .order_by(TokenBooking.created_at.desc())
    )
    result = await db.execute(stmt)
    return result.scalars().all()



@router.delete(
    "/{booking_id}",
    status_code=status.HTTP_200_OK,
    dependencies=[Depends(require_roles([UserRole.ADMIN, UserRole.MANAGER]))],
)
async def delete_token_booking(
    booking_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Delete a token booking (Admin/Manager only) and unreserve vehicle."""
    stmt = (
        select(TokenBooking)
        .options(joinedload(TokenBooking.car))
        .where(TokenBooking.id == booking_id)
    )
    res = await db.execute(stmt)
    booking = res.scalars().first()
    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Token booking record not found",
        )

    if booking.car and booking.car.status == CarStatus.RESERVED:
        booking.car.status = CarStatus.AVAILABLE

    await db.delete(booking)
    await db.commit()
    return {"message": "Token booking deleted successfully and vehicle unreserved", "booking_id": str(booking_id)}

