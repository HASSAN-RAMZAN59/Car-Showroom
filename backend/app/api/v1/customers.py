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
from app.models.customer import Customer
from app.models.user import User, UserRole
from app.schemas.customer import CustomerDetailResponse, CustomerResponse

router = APIRouter()


@router.post(
    "/",
    response_model=CustomerResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_roles([UserRole.ADMIN, UserRole.MANAGER, UserRole.EMPLOYEE]))],
)
async def create_customer(
    full_name: str = Form(...),
    cnic: str = Form(...),
    phone: str = Form(...),
    address: Optional[str] = Form(None),
    cnic_front: Optional[UploadFile] = File(None),
    cnic_back: Optional[UploadFile] = File(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Register a new customer profile with optional CNIC front & back document uploads."""
    # Check for duplicate CNIC
    result = await db.execute(select(Customer).where(Customer.cnic == cnic))
    if result.scalars().first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"A customer with CNIC '{cnic}' is already registered.",
        )

    # Upload CNIC images to Cloudinary if provided
    cnic_front_url = None
    if cnic_front and cnic_front.filename:
        cnic_front_url = await upload_file_to_cloudinary(
            cnic_front, folder="customers/cnic"
        )

    cnic_back_url = None
    if cnic_back and cnic_back.filename:
        cnic_back_url = await upload_file_to_cloudinary(
            cnic_back, folder="customers/cnic"
        )

    customer = Customer(
        full_name=full_name,
        cnic=cnic,
        phone=phone,
        address=address,
        cnic_front_url=cnic_front_url,
        cnic_back_url=cnic_back_url,
    )
    db.add(customer)
    await db.commit()
    await db.refresh(customer)
    return customer


@router.get(
    "/",
    response_model=List[CustomerResponse],
    dependencies=[Depends(require_roles([UserRole.ADMIN, UserRole.MANAGER, UserRole.EMPLOYEE]))],
)
async def list_customers(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    query: Optional[str] = Query(None, description="Search by CNIC or full name"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """List customer profiles with pagination and search filtering by CNIC or Name."""
    stmt = select(Customer)
    if query:
        search_pattern = f"%{query}%"
        stmt = stmt.where(
            or_(
                Customer.cnic.ilike(search_pattern),
                Customer.full_name.ilike(search_pattern),
            )
        )
    stmt = stmt.offset(skip).limit(limit).order_by(Customer.created_at.desc())
    result = await db.execute(stmt)
    customers = result.scalars().all()
    return customers


@router.get(
    "/{customer_id}",
    response_model=CustomerDetailResponse,
    dependencies=[Depends(require_roles([UserRole.ADMIN, UserRole.MANAGER, UserRole.EMPLOYEE]))],
)
async def get_customer(
    customer_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Get detailed customer profile along with token bookings and purchase history."""
    stmt = (
        select(Customer)
        .options(
            selectinload(Customer.token_bookings),
            selectinload(Customer.sales),
        )
        .where(Customer.id == customer_id)
    )
    result = await db.execute(stmt)
    customer = result.scalars().first()
    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Customer not found",
        )
    return customer


@router.delete(
    "/{customer_id}",
    status_code=status.HTTP_200_OK,
    dependencies=[Depends(require_roles([UserRole.ADMIN, UserRole.MANAGER]))],
)
async def delete_customer(
    customer_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Delete customer profile (Admin/Manager only). Checks for active sales."""
    from app.models.sale import Sale
    res = await db.execute(select(Customer).where(Customer.id == customer_id))
    customer = res.scalars().first()
    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Customer profile not found",
        )

    sale_res = await db.execute(select(Sale).where(Sale.customer_id == customer_id))
    if sale_res.scalars().first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete customer with active purchase/sale records.",
        )

    await db.delete(customer)
    await db.commit()
    return {"message": "Customer profile deleted successfully", "customer_id": str(customer_id)}

