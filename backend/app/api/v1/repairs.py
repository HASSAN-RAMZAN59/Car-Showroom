import uuid
from typing import Any, Optional

from fastapi import (
    APIRouter,
    Depends,
    File,
    Form,
    HTTPException,
    UploadFile,
    status,
)
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from app.api.deps import get_current_user, require_roles
from app.core.cloudinary import upload_file_to_cloudinary
from app.core.database import get_db
from app.models.car import Car
from app.models.repair import Repair
from app.models.user import User, UserRole
from app.schemas.car import CarDetailResponse, CarStatusUpdate
from app.schemas.repair import CarRepairsListResponse, RepairResponse

router = APIRouter()


@router.post(
    "/",
    response_model=RepairResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_roles([UserRole.ADMIN, UserRole.MANAGER, UserRole.EMPLOYEE]))],
)
async def create_repair_entry(
    car_id: uuid.UUID = Form(...),
    repair_type: str = Form(..., description="e.g. Denting/Painting, Mechanical, Detailing, Tyres"),
    vendor_name: Optional[str] = Form(None),
    cost: float = Form(..., gt=0),
    notes: Optional[str] = Form(None),
    receipt: Optional[UploadFile] = File(None, description="Optional receipt image or invoice document"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Log a new vehicle repair or refurbishment expense."""
    # Verify target vehicle exists
    result = await db.execute(select(Car).where(Car.id == car_id))
    car = result.scalars().first()
    if not car:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Vehicle with ID '{car_id}' not found.",
        )

    # Upload receipt document to Cloudinary if provided
    receipt_url = None
    if receipt and receipt.filename:
        receipt_url = await upload_file_to_cloudinary(
            receipt, folder="repairs/receipts"
        )

    repair = Repair(
        car_id=car_id,
        repair_type=repair_type,
        vendor_name=vendor_name,
        cost=cost,
        notes=notes,
        receipt_url=receipt_url,
        created_by_id=current_user.id,
    )
    db.add(repair)
    await db.commit()
    await db.refresh(repair)
    return repair


@router.get(
    "/car/{car_id}",
    response_model=CarRepairsListResponse,
    dependencies=[Depends(require_roles([UserRole.ADMIN, UserRole.MANAGER, UserRole.EMPLOYEE]))],
)
async def get_car_repairs(
    car_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """List all refurbishment and repair expenses for a specific vehicle with sum total."""
    stmt = (
        select(Car)
        .options(selectinload(Car.repairs))
        .where(Car.id == car_id)
    )
    result = await db.execute(stmt)
    car = result.scalars().first()
    if not car:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Vehicle with ID '{car_id}' not found.",
        )

    return CarRepairsListResponse(
        car_id=car.id,
        total_repair_cost=car.total_repair_cost,
        repairs=car.repairs,
    )


@router.patch(
    "/cars/{car_id}/status",
    response_model=CarDetailResponse,
    dependencies=[Depends(require_roles([UserRole.ADMIN, UserRole.MANAGER, UserRole.EMPLOYEE]))],
)
async def update_car_status(
    car_id: uuid.UUID,
    status_update: CarStatusUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Update vehicle status (e.g., transition from IN_MAINTENANCE to AVAILABLE) and optional asking price."""
    stmt = (
        select(Car)
        .options(selectinload(Car.repairs), selectinload(Car.seller), selectinload(Car.created_by))
        .where(Car.id == car_id)
    )
    result = await db.execute(stmt)
    car = result.scalars().first()
    if not car:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Vehicle with ID '{car_id}' not found.",
        )

    car.status = status_update.status
    if status_update.asking_price is not None:
        car.asking_price = status_update.asking_price

    await db.commit()
    await db.refresh(car)
    return car


@router.delete(
    "/{repair_id}",
    status_code=status.HTTP_200_OK,
    dependencies=[Depends(require_roles([UserRole.ADMIN, UserRole.MANAGER]))],
)
async def delete_repair(
    repair_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Delete a repair record (Admin/Manager only)."""
    res = await db.execute(select(Repair).where(Repair.id == repair_id))
    repair = res.scalars().first()
    if not repair:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Repair record not found",
        )

    await db.delete(repair)
    await db.commit()
    return {"message": "Repair record deleted successfully", "repair_id": str(repair_id)}

