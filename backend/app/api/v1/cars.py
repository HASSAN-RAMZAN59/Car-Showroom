import uuid
from typing import Any, List, Optional

from fastapi import (
    APIRouter,
    Depends,
    File,
    Form,
    HTTPException,
    Query,
    UploadFile,
    status,
)
from sqlalchemy import or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import joinedload, selectinload

from app.api.deps import get_current_user, require_roles
from app.core.cloudinary import upload_file_to_cloudinary
from app.core.database import get_db
from app.models.car import Car, CarStatus
from app.models.seller import Seller
from app.models.user import User, UserRole
from app.schemas.car import CarDetailResponse, CarResponse

router = APIRouter()


@router.post(
    "/purchase",
    response_model=CarResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_roles([UserRole.ADMIN, UserRole.MANAGER, UserRole.EMPLOYEE]))],
)
async def purchase_car(
    car_number: str = Form(..., description="e.g. LEB-1234"),
    make: str = Form(..., description="e.g. Toyota"),
    model: str = Form(..., description="e.g. Corolla"),
    year: int = Form(...),
    color: Optional[str] = Form(None),
    engine_number: str = Form(...),
    chassis_number: str = Form(...),
    mileage: Optional[int] = Form(None),
    status_param: CarStatus = Form(CarStatus.IN_MAINTENANCE, alias="status"),
    purchase_price: float = Form(...),
    asking_price: Optional[float] = Form(None),
    seller_id: uuid.UUID = Form(...),
    car_photos: List[UploadFile] = File([], description="Optional photo uploads"),
    registration_docs: List[UploadFile] = File([], description="Optional document uploads"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Log a new car purchase from a registered seller."""
    # 1. Verify seller exists
    seller_res = await db.execute(select(Seller).where(Seller.id == seller_id))
    seller = seller_res.scalars().first()
    if not seller:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Seller with ID '{seller_id}' does not exist.",
        )

    # 2. Check for duplicate car_number, engine_number, or chassis_number
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

    # 3. Upload car photos to Cloudinary
    car_photos_urls: List[str] = []
    for photo in car_photos:
        if photo.filename:
            url = await upload_file_to_cloudinary(photo, folder="cars/photos")
            car_photos_urls.append(url)

    # 4. Upload registration docs to Cloudinary
    registration_docs_urls: List[str] = []
    for doc in registration_docs:
        if doc.filename:
            url = await upload_file_to_cloudinary(doc, folder="cars/docs")
            registration_docs_urls.append(url)

    # 5. Create new Car database entry
    car = Car(
        car_number=car_number,
        make=make,
        model=model,
        year=year,
        color=color,
        engine_number=engine_number,
        chassis_number=chassis_number,
        mileage=mileage,
        status=status_param,
        purchase_price=purchase_price,
        asking_price=asking_price,
        seller_id=seller_id,
        created_by_id=current_user.id,
        car_photos_urls=car_photos_urls,
        registration_docs_urls=registration_docs_urls,
    )
    db.add(car)
    await db.commit()
    await db.refresh(car)

    # Eagerly load repairs for serialization
    stmt = select(Car).options(selectinload(Car.repairs)).where(Car.id == car.id)
    res = await db.execute(stmt)
    car_with_repairs = res.scalars().first()
    return car_with_repairs


@router.get(
    "/",
    response_model=List[CarResponse],
    dependencies=[Depends(require_roles([UserRole.ADMIN, UserRole.MANAGER, UserRole.EMPLOYEE]))],
)
async def list_cars(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    status_filter: Optional[CarStatus] = Query(None, alias="status", description="Filter by car status"),
    make: Optional[str] = Query(None, description="Filter by make (e.g. Toyota)"),
    model: Optional[str] = Query(None, description="Filter by model (e.g. Corolla)"),
    year: Optional[int] = Query(None, description="Filter by year"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """List vehicle inventory with optional filtering by status, make, model, and year."""
    stmt = select(Car).options(selectinload(Car.repairs), joinedload(Car.seller))
    if status_filter:
        stmt = stmt.where(Car.status == status_filter)
    if make:
        stmt = stmt.where(Car.make.ilike(f"%{make}%"))
    if model:
        stmt = stmt.where(Car.model.ilike(f"%{model}%"))
    if year:
        stmt = stmt.where(Car.year == year)

    stmt = stmt.offset(skip).limit(limit).order_by(Car.created_at.desc())
    result = await db.execute(stmt)
    cars = result.scalars().all()
    return cars


@router.get(
    "/{car_id}",
    response_model=CarDetailResponse,
    dependencies=[Depends(require_roles([UserRole.ADMIN, UserRole.MANAGER, UserRole.EMPLOYEE]))],
)
async def get_car(
    car_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Get detailed vehicle information including seller profile, repairs, and creation user."""
    stmt = (
        select(Car)
        .options(
            joinedload(Car.seller),
            joinedload(Car.created_by),
            selectinload(Car.repairs),
        )
        .where(Car.id == car_id)
    )
    result = await db.execute(stmt)
    car = result.scalars().first()
    if not car:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vehicle not found in inventory",
        )
    return car
