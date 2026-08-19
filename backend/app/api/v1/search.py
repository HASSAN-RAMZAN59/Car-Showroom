from typing import Any, List, Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy import or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import joinedload, selectinload

from app.api.deps import get_current_user, require_roles
from app.core.database import get_db
from app.models.car import Car
from app.models.user import User, UserRole
from app.schemas.car import CarAutoCompleteResponse

router = APIRouter()


@router.get(
    "/cars",
    response_model=List[CarAutoCompleteResponse],
    dependencies=[Depends(require_roles([UserRole.ADMIN, UserRole.MANAGER, UserRole.EMPLOYEE]))],
)
async def auto_complete_cars(
    query: Optional[str] = Query(
        None,
        description="Search term matching license plate number, engine number, or chassis number",
    ),
    limit: int = Query(10, ge=1, le=50, description="Max results for auto-complete dropdown"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Fast auto-complete lookup searching license plate, engine number, or chassis number."""
    stmt = select(Car).options(
        joinedload(Car.seller),
        selectinload(Car.repairs),
    )

    if query and query.strip():
        search_pattern = f"%{query.strip()}%"
        stmt = stmt.where(
            or_(
                Car.car_number.ilike(search_pattern),
                Car.make.ilike(search_pattern),
                Car.model.ilike(search_pattern),
                Car.engine_number.ilike(search_pattern),
                Car.chassis_number.ilike(search_pattern),
            )
        )

    stmt = stmt.limit(limit).order_by(Car.created_at.desc())
    result = await db.execute(stmt)
    cars = result.scalars().all()
    return cars
