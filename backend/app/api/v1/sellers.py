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
from sqlalchemy.orm import selectinload

from app.api.deps import get_current_user, require_roles
from app.core.cloudinary import upload_file_to_cloudinary
from app.core.database import get_db
from app.models.seller import Seller
from app.models.user import User, UserRole
from app.schemas.seller import SellerDetailResponse, SellerResponse

router = APIRouter()


@router.post(
    "/",
    response_model=SellerResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_roles([UserRole.ADMIN, UserRole.MANAGER, UserRole.EMPLOYEE]))],
)
async def create_seller(
    full_name: str = Form(...),
    cnic: str = Form(...),
    phone: str = Form(...),
    address: Optional[str] = Form(None),
    cnic_front: Optional[UploadFile] = File(None),
    cnic_back: Optional[UploadFile] = File(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Create a new Seller record with optional CNIC front & back image uploads."""
    # Check for duplicate CNIC: reuse existing seller if CNIC matches
    result = await db.execute(select(Seller).where(Seller.cnic == cnic))
    existing_seller = result.scalars().first()
    if existing_seller:
        existing_seller.full_name = full_name
        existing_seller.phone = phone
        if address:
            existing_seller.address = address
        await db.commit()
        await db.refresh(existing_seller)
        return existing_seller

    # Upload CNIC images to Cloudinary if provided
    cnic_front_url = None
    if cnic_front and cnic_front.filename:
        cnic_front_url = await upload_file_to_cloudinary(
            cnic_front, folder="sellers/cnic"
        )

    cnic_back_url = None
    if cnic_back and cnic_back.filename:
        cnic_back_url = await upload_file_to_cloudinary(
            cnic_back, folder="sellers/cnic"
        )

    seller = Seller(
        full_name=full_name,
        cnic=cnic,
        phone=phone,
        address=address,
        cnic_front_url=cnic_front_url,
        cnic_back_url=cnic_back_url,
    )
    db.add(seller)
    await db.commit()
    await db.refresh(seller)
    return seller


@router.get(
    "/",
    response_model=List[SellerResponse],
    dependencies=[Depends(require_roles([UserRole.ADMIN, UserRole.MANAGER, UserRole.EMPLOYEE]))],
)
async def list_sellers(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    query: Optional[str] = Query(None, description="Search by CNIC or full name"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """List sellers with pagination and optional search filter by CNIC or full name."""
    stmt = select(Seller)
    if query:
        search_pattern = f"%{query}%"
        stmt = stmt.where(
            or_(
                Seller.cnic.ilike(search_pattern),
                Seller.full_name.ilike(search_pattern),
            )
        )
    stmt = stmt.offset(skip).limit(limit).order_by(Seller.created_at.desc())
    result = await db.execute(stmt)
    sellers = result.scalars().all()
    return sellers


@router.get(
    "/{seller_id}",
    response_model=SellerDetailResponse,
    dependencies=[Depends(require_roles([UserRole.ADMIN, UserRole.MANAGER, UserRole.EMPLOYEE]))],
)
async def get_seller(
    seller_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Get detailed seller profile along with all cars purchased from them."""
    stmt = (
        select(Seller)
        .options(selectinload(Seller.cars))
        .where(Seller.id == seller_id)
    )
    result = await db.execute(stmt)
    seller = result.scalars().first()
    if not seller:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Seller not found",
        )
    return seller
