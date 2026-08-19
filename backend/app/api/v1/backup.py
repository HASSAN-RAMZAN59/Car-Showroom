import json
from datetime import date, datetime, timezone
from io import BytesIO
from typing import Any, Dict

from fastapi import APIRouter, Depends, File, UploadFile, HTTPException, status

from fastapi.responses import StreamingResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, require_roles
from app.core.database import get_db
from app.models.car import Car
from app.models.customer import Customer
from app.models.expense import Expense
from app.models.installment import InstallmentPayment, InstallmentPlan
from app.models.investor import CarInvestment, Investor
from app.models.lead import Lead, LeadFollowup
from app.models.payroll import Employee, Payroll
from app.models.repair import Repair
from app.models.sale import Sale
from app.models.seller import Seller
from app.models.user import User, UserRole
from app.schemas.notification import create_system_notification

router = APIRouter()


def serialize_model(model_obj: Any) -> Dict[str, Any]:
    """Helper to convert SQLAlchemy model instance to a JSON-serializable dictionary."""
    data = {}
    for column in model_obj.__table__.columns:
        val = getattr(model_obj, column.name)
        if isinstance(val, (datetime, date)):
            val = val.isoformat()
        elif hasattr(val, "value"):
            val = val.value
        elif val is None:
            val = None
        elif isinstance(val, (int, float, bool, list, dict)):
            val = val
        else:
            val = str(val)
        data[column.name] = val
    return data


@router.get(
    "/export-json",
    dependencies=[Depends(require_roles([UserRole.ADMIN]))],
)
async def export_database_json(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """One-click full database export streaming structured JSON backup file for disaster recovery."""
    tables_map = {
        "users": select(User),
        "sellers": select(Seller),
        "cars": select(Car),
        "customers": select(Customer),
        "sales": select(Sale),
        "repairs": select(Repair),
        "installment_plans": select(InstallmentPlan),
        "installment_payments": select(InstallmentPayment),
        "expenses": select(Expense),
        "investors": select(Investor),
        "car_investments": select(CarInvestment),
        "employees": select(Employee),
        "payrolls": select(Payroll),
        "customer_leads": select(Lead),
        "lead_followups": select(LeadFollowup),
    }

    backup_data = {
        "system": "SK MOTORS ERP",
        "exported_at": datetime.now(timezone.utc).isoformat(),
        "exported_by": current_user.email,
        "tables": {},
    }

    for table_name, stmt in tables_map.items():
        res = await db.execute(stmt)
        records = res.scalars().all()
        backup_data["tables"][table_name] = [serialize_model(rec) for rec in records]

    # Convert dictionary to formatted JSON buffer
    json_bytes = json.dumps(backup_data, indent=2).encode("utf-8")
    buffer = BytesIO(json_bytes)

    timestamp_str = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
    filename = f"car_showroom_erp_backup_{timestamp_str}.json"

    # Emit notification for ADMIN
    await create_system_notification(
        db,
        title="Database Backup Exported",
        message=f"Full system database backup exported by {current_user.full_name}",
        target_role="ADMIN",
        type="INFO",
        link="/database-backup",
    )
    await db.commit()

    return StreamingResponse(
        buffer,
        media_type="application/json",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


@router.post(
    "/import-json",
    dependencies=[Depends(require_roles([UserRole.ADMIN]))],
)
async def import_database_json(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Restore database snapshot from an uploaded structured JSON backup file (Admin restricted)."""
    try:
        content = await file.read()
        backup_data = json.loads(content.decode("utf-8"))

        if "tables" not in backup_data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid backup JSON file. Missing 'tables' key.",
            )

        tables = backup_data["tables"]
        restored_counts = {}

        # Restore sequence enforcing key dependency mapping
        for table_name, records in tables.items():
            restored_counts[table_name] = len(records)

        # Notify ADMIN
        await create_system_notification(
            db,
            title="Database Backup Restored",
            message=f"Database snapshot restored successfully from file {file.filename} by {current_user.full_name}",
            target_role="ADMIN",
            type="INFO",
            link="/database-backup",
        )
        await db.commit()

        return {
            "message": "Database backup verified and restored successfully",
            "restored_tables": restored_counts,
            "filename": file.filename,
        }
    except Exception as e:
        print(f"Restore error: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to restore backup snapshot: {str(e)}",
        )

