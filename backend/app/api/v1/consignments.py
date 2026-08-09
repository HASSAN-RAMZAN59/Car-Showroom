import uuid
from datetime import datetime, timezone
from typing import Any, List, Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile, status
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import get_current_user, require_roles
from app.core.cloudinary import upload_file_to_cloudinary
from app.core.database import get_db
from app.models.car import Car, CarStatus
from app.models.consignment import CommissionType, ConsignmentAgreement, ConsignmentStatus
from app.models.user import User, UserRole
from app.schemas.consignment import (
    ConsignmentResponse,
    ConsignmentWithdraw,
)

router = APIRouter()


@router.post(
    "/",
    response_model=ConsignmentResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_roles([UserRole.ADMIN, UserRole.MANAGER, UserRole.EMPLOYEE]))],
)
async def register_consignment(
    owner_name: str = Form(..., description="Full name of car owner"),
    owner_cnic: str = Form(..., description="CNIC number of owner"),
    owner_phone: str = Form(..., description="Contact phone number"),
    owner_address: Optional[str] = Form(None),
    car_number: str = Form(..., description="e.g. LEB-1234"),
    make: str = Form(..., description="e.g. Honda"),
    model: str = Form(..., description="e.g. Civic"),
    year: int = Form(...),
    color: Optional[str] = Form(None),
    engine_number: str = Form(...),
    chassis_number: str = Form(...),
    mileage: Optional[int] = Form(None),
    commission_type: CommissionType = Form(CommissionType.PERCENTAGE),
    commission_value: float = Form(..., gt=0),
    agreed_asking_price: float = Form(..., gt=0),
    notes: Optional[str] = Form(None),
    cnic_front: Optional[UploadFile] = File(None),
    cnic_back: Optional[UploadFile] = File(None),
    car_photos: List[UploadFile] = File([]),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Register a new third-party consignment vehicle, uploading owner docs and car photos to Cloudinary."""
    # 1. Check for duplicate car_number, engine_number, or chassis_number
    existing_car_res = await db.execute(
        select(Car).where(
            or_(
                Car.car_number == car_number,
                Car.engine_number == engine_number,
                Car.chassis_number == chassis_number,
            )
        )
    )
    existing_car = existing_car_res.scalars().first()
    if existing_car:
        conflict_field = (
            "car_number" if existing_car.car_number == car_number
            else "engine_number" if existing_car.engine_number == engine_number
            else "chassis_number"
        )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"A vehicle with this {conflict_field} already exists in inventory.",
        )

    # 2. Upload CNIC documents to Cloudinary if provided
    cnic_front_url = None
    if cnic_front and cnic_front.filename:
        cnic_front_url = await upload_file_to_cloudinary(cnic_front, folder="consignments/cnic")

    cnic_back_url = None
    if cnic_back and cnic_back.filename:
        cnic_back_url = await upload_file_to_cloudinary(cnic_back, folder="consignments/cnic")

    # 3. Upload vehicle photos to Cloudinary
    car_photos_urls: List[str] = []
    for photo in car_photos:
        if photo.filename:
            url = await upload_file_to_cloudinary(photo, folder="consignments/cars")
            car_photos_urls.append(url)

    # 4. Create new Car entry for consignment stock
    car = Car(
        car_number=car_number,
        make=make,
        model=model,
        year=year,
        color=color,
        engine_number=engine_number,
        chassis_number=chassis_number,
        mileage=mileage,
        status=CarStatus.CONSIGNED_AVAILABLE,
        is_consignment=True,
        purchase_price=0.0,
        asking_price=agreed_asking_price,
        seller_id=None,
        car_photos_urls=car_photos_urls,
        registration_docs_urls=[],
        created_by_id=current_user.id,
    )
    db.add(car)
    await db.flush()

    # 5. Create Consignment Agreement
    consignment = ConsignmentAgreement(
        owner_name=owner_name,
        owner_cnic=owner_cnic,
        owner_phone=owner_phone,
        owner_address=owner_address,
        owner_cnic_front_url=cnic_front_url,
        owner_cnic_back_url=cnic_back_url,
        car_id=car.id,
        commission_type=commission_type,
        commission_value=commission_value,
        agreed_asking_price=agreed_asking_price,
        status=ConsignmentStatus.ACTIVE,
        deposit_date=datetime.now(timezone.utc),
        notes=notes,
        created_by_id=current_user.id,
    )
    db.add(consignment)
    await db.commit()

    # Re-fetch with car relationship
    stmt = (
        select(ConsignmentAgreement)
        .options(selectinload(ConsignmentAgreement.car))
        .where(ConsignmentAgreement.id == consignment.id)
    )
    res = await db.execute(stmt)
    result = res.scalars().first()
    return result


@router.get(
    "/",
    response_model=List[ConsignmentResponse],
    dependencies=[Depends(require_roles([UserRole.ADMIN, UserRole.MANAGER, UserRole.EMPLOYEE]))],
)
async def list_consignments(
    status_param: Optional[str] = Query(None, alias="status", description="Filter by status: ACTIVE, SOLD, RETURNED_TO_OWNER"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """List consignment agreements with optional status filter."""
    stmt = select(ConsignmentAgreement).options(selectinload(ConsignmentAgreement.car))
    if status_param and status_param.upper() != "ALL":
        try:
            cons_status = ConsignmentStatus(status_param.upper())
            stmt = stmt.where(ConsignmentAgreement.status == cons_status)
        except ValueError:
            pass

    stmt = stmt.offset(skip).limit(limit).order_by(ConsignmentAgreement.created_at.desc())
    res = await db.execute(stmt)
    return res.scalars().all()


@router.get(
    "/{consignment_id}",
    response_model=ConsignmentResponse,
    dependencies=[Depends(require_roles([UserRole.ADMIN, UserRole.MANAGER, UserRole.EMPLOYEE]))],
)
async def get_consignment(
    consignment_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Get single consignment agreement record with details."""
    stmt = (
        select(ConsignmentAgreement)
        .options(selectinload(ConsignmentAgreement.car))
        .where(ConsignmentAgreement.id == consignment_id)
    )
    res = await db.execute(stmt)
    consignment = res.scalars().first()
    if not consignment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Consignment agreement record not found.",
        )
    return consignment


@router.post(
    "/{consignment_id}/withdraw",
    response_model=ConsignmentResponse,
    dependencies=[Depends(require_roles([UserRole.ADMIN, UserRole.MANAGER, UserRole.EMPLOYEE]))],
)
async def withdraw_consignment(
    consignment_id: uuid.UUID,
    withdraw_in: ConsignmentWithdraw,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Withdraw consignment vehicle and return it to the owner, removing it from active showroom inventory."""
    stmt = (
        select(ConsignmentAgreement)
        .options(selectinload(ConsignmentAgreement.car))
        .where(ConsignmentAgreement.id == consignment_id)
    )
    res = await db.execute(stmt)
    consignment = res.scalars().first()
    if not consignment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Consignment agreement record not found.",
        )

    if consignment.status == ConsignmentStatus.SOLD:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot withdraw vehicle that has already been sold.",
        )

    # Update agreement
    consignment.status = ConsignmentStatus.RETURNED_TO_OWNER
    consignment.withdrawal_date = datetime.now(timezone.utc)
    if withdraw_in.withdrawal_reason or withdraw_in.notes:
        reason_note = f"Withdrawal Reason: {withdraw_in.withdrawal_reason or 'Owner took vehicle back'}"
        consignment.notes = f"{consignment.notes}\n{reason_note}" if consignment.notes else reason_note

    # Update linked Car status
    if consignment.car:
        consignment.car.status = CarStatus.CONSIGNED_RETURNED

    await db.commit()

    # Re-fetch for response
    res = await db.execute(
        select(ConsignmentAgreement)
        .options(selectinload(ConsignmentAgreement.car))
        .where(ConsignmentAgreement.id == consignment_id)
    )
    return res.scalars().first()
