import uuid
from typing import Any, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload, selectinload

from app.api.deps import get_current_user, require_roles
from app.core.database import get_db
from app.models.car import Car, CarStatus
from app.models.lead import Lead, LeadFollowup, LeadStatus
from app.schemas.notification import create_system_notification
from app.models.payroll import Employee
from app.models.user import User, UserRole
from app.schemas.car import CarResponse
from app.schemas.lead import (
    LeadCreate,
    LeadDetailResponse,
    LeadFollowupCreate,
    LeadFollowupResponse,
    LeadResponse,
    LeadStatusUpdate,
)

router = APIRouter()


@router.post(
    "/",
    response_model=LeadResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_roles([UserRole.ADMIN, UserRole.MANAGER, UserRole.EMPLOYEE]))],
)
async def create_lead(
    lead_in: LeadCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Create a new customer sales inquiry lead."""
    # Verify assigned employee exists if specified
    if lead_in.assigned_employee_id:
        emp_res = await db.execute(
            select(Employee).where(Employee.id == lead_in.assigned_employee_id)
        )
        if not emp_res.scalars().first():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Employee with ID '{lead_in.assigned_employee_id}' not found.",
            )

    lead = Lead(
        customer_name=lead_in.customer_name,
        phone=lead_in.phone,
        email=lead_in.email,
        budget_min=lead_in.budget_min,
        budget_max=lead_in.budget_max,
        preferred_make=lead_in.preferred_make,
        preferred_model=lead_in.preferred_model,
        status=lead_in.status,
        assigned_employee_id=lead_in.assigned_employee_id,
        created_by_id=current_user.id,
    )
    db.add(lead)

    await create_system_notification(
        db,
        title="New Lead Inquiry",
        message=f"New buyer lead registered for {lead_in.customer_name} (Budget: PKR {lead_in.budget_max:,.0f})",
        target_role="ALL" if not lead_in.assigned_employee_id else None,
        user_id=lead_in.assigned_employee_id if lead_in.assigned_employee_id else None,
        type="INFO",
        link="/leads",
    )
    await db.commit()

    # Eagerly load assigned employee for response
    stmt = (
        select(Lead)
        .options(joinedload(Lead.assigned_employee))
        .where(Lead.id == lead.id)
    )
    result = await db.execute(stmt)
    return result.scalars().first()


@router.get(
    "/",
    response_model=List[LeadResponse],
    dependencies=[Depends(require_roles([UserRole.ADMIN, UserRole.MANAGER, UserRole.EMPLOYEE]))],
)
async def list_leads(
    status_filter: Optional[LeadStatus] = Query(None, alias="status", description="Filter by lead status"),
    assigned_employee_id: Optional[uuid.UUID] = Query(None, description="Filter by assigned employee"),
    search: Optional[str] = Query(None, description="Search by customer name or phone number"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """List customer leads with filtering by status, assigned sales dealer, or name/phone search."""
    stmt = select(Lead).options(joinedload(Lead.assigned_employee))

    if status_filter:
        stmt = stmt.where(Lead.status == status_filter)
    if assigned_employee_id:
        stmt = stmt.where(Lead.assigned_employee_id == assigned_employee_id)
    if search:
        search_pattern = f"%{search}%"
        stmt = stmt.where(
            or_(
                Lead.customer_name.ilike(search_pattern),
                Lead.phone.ilike(search_pattern),
            )
        )

    stmt = stmt.offset(skip).limit(limit).order_by(Lead.created_at.desc())
    result = await db.execute(stmt)
    return result.scalars().all()


@router.get(
    "/{lead_id}",
    response_model=LeadDetailResponse,
    dependencies=[Depends(require_roles([UserRole.ADMIN, UserRole.MANAGER, UserRole.EMPLOYEE]))],
)
async def get_lead(
    lead_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Retrieve detailed single lead profile along with complete follow-up interaction history."""
    stmt = (
        select(Lead)
        .options(
            joinedload(Lead.assigned_employee),
            selectinload(Lead.followups),
        )
        .where(Lead.id == lead_id)
    )
    result = await db.execute(stmt)
    lead = result.scalars().first()
    if not lead:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lead record not found",
        )
    return lead


@router.patch(
    "/{lead_id}/status",
    response_model=LeadResponse,
    dependencies=[Depends(require_roles([UserRole.ADMIN, UserRole.MANAGER, UserRole.EMPLOYEE]))],
)
async def update_lead_status(
    lead_id: uuid.UUID,
    status_in: LeadStatusUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Update lead lifecycle status (e.g. transition from HOT to WARM, CONVERTED, or CLOSED)."""
    stmt = (
        select(Lead)
        .options(joinedload(Lead.assigned_employee))
        .where(Lead.id == lead_id)
    )
    result = await db.execute(stmt)
    lead = result.scalars().first()
    if not lead:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lead record not found",
        )

    lead.status = status_in.status
    await db.commit()
    await db.refresh(lead)
    return lead


@router.post(
    "/{lead_id}/followup",
    response_model=LeadFollowupResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_roles([UserRole.ADMIN, UserRole.MANAGER, UserRole.EMPLOYEE]))],
)
async def add_lead_followup(
    lead_id: uuid.UUID,
    followup_in: LeadFollowupCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Log a follow-up interaction note and optional scheduled next contact date."""
    stmt = select(Lead).where(Lead.id == lead_id)
    result = await db.execute(stmt)
    lead = result.scalars().first()
    if not lead:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lead record not found",
        )

    followup = LeadFollowup(
        lead_id=lead_id,
        note=followup_in.note,
        next_followup_date=followup_in.next_followup_date,
        created_by_id=current_user.id,
    )
    db.add(followup)
    await db.commit()
    await db.refresh(followup)
    return followup


@router.get(
    "/{lead_id}/matching-inventory",
    response_model=List[CarResponse],
    dependencies=[Depends(require_roles([UserRole.ADMIN, UserRole.MANAGER, UserRole.EMPLOYEE]))],
)
async def get_matching_inventory(
    lead_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Smart matching endpoint querying available showroom vehicles that match the lead's make, model, and budget preferences."""
    lead_res = await db.execute(select(Lead).where(Lead.id == lead_id))
    lead = lead_res.scalars().first()
    if not lead:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lead record not found",
        )

    stmt = select(Car).where(Car.status != CarStatus.SOLD)

    if lead.preferred_make:
        stmt = stmt.where(Car.make.ilike(f"%{lead.preferred_make}%"))
    if lead.preferred_model:
        stmt = stmt.where(Car.model.ilike(f"%{lead.preferred_model}%"))
    if lead.budget_max:
        stmt = stmt.where(Car.purchase_price <= lead.budget_max)

    stmt = stmt.order_by(Car.created_at.desc()).limit(20)
    result = await db.execute(stmt)
    cars = result.scalars().all()
    return cars
