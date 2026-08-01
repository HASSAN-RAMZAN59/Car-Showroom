import uuid
from datetime import datetime, timezone
from typing import Any, Optional

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
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.api.deps import get_current_user, require_roles
from app.core.cloudinary import upload_file_to_cloudinary
from app.core.database import get_db
from app.models.bank import BankAccount, PaymentMethod, PaymentTransaction, TransactionType
from app.models.expense import Expense
from app.models.user import User, UserRole
from app.schemas.expense import ExpenseListResponse, ExpenseResponse

router = APIRouter()


@router.post(
    "/",
    response_model=ExpenseResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_roles([UserRole.ADMIN, UserRole.MANAGER, UserRole.EMPLOYEE]))],
)
async def create_expense(
    expense_name: str = Form(..., description="e.g. Electricity Bill, Office Tea"),
    category: str = Form(..., description="e.g. Utilities, Maintenance, Food/Tea, Fuel"),
    amount: float = Form(..., gt=0),
    date_param: Optional[datetime] = Form(None, alias="date"),
    reason: Optional[str] = Form(None),
    payment_method: PaymentMethod = Form(PaymentMethod.CASH),
    bank_account_id: Optional[uuid.UUID] = Form(None),
    receipt: Optional[UploadFile] = File(None, description="Optional receipt image or bill document"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Log a new daily expense entry with optional receipt upload and bank account balance deduction."""
    bank_account = None
    if payment_method == PaymentMethod.BANK_TRANSFER and bank_account_id:
        bank_res = await db.execute(
            select(BankAccount).where(BankAccount.id == bank_account_id)
        )
        bank_account = bank_res.scalars().first()
        if not bank_account:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Bank Account with ID '{bank_account_id}' not found.",
            )
        if bank_account.current_balance < amount:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Insufficient funds in bank account. Current balance: PKR {bank_account.current_balance:,.2f}",
            )
        # Deduct expense amount from bank balance
        bank_account.current_balance -= amount

    # Upload receipt image to Cloudinary if provided
    receipt_url = None
    if receipt and receipt.filename:
        receipt_url = await upload_file_to_cloudinary(
            receipt, folder="expenses/receipts"
        )

    expense = Expense(
        expense_name=expense_name,
        category=category,
        amount=amount,
        date=date_param if date_param else datetime.now(timezone.utc),
        reason=reason,
        receipt_url=receipt_url,
        payment_method=payment_method,
        bank_account_id=bank_account_id,
        created_by_id=current_user.id,
    )
    db.add(expense)

    # Record linked PaymentTransaction if paid via bank
    if bank_account:
        tx = PaymentTransaction(
            transaction_type=TransactionType.EXPENSE_PAYMENT,
            payment_method=PaymentMethod.BANK_TRANSFER,
            bank_account_id=bank_account.id,
            amount=amount,
            reference_number=f"EXP-{expense_name[:10].upper()}",
            notes=f"Daily Expense: {expense_name} ({category})",
            created_by_id=current_user.id,
        )
        db.add(tx)

    await db.commit()

    # Eagerly load bank account and creator for response
    stmt = (
        select(Expense)
        .options(joinedload(Expense.bank_account), joinedload(Expense.created_by))
        .where(Expense.id == expense.id)
    )
    result = await db.execute(stmt)
    return result.scalars().first()


@router.get(
    "/",
    response_model=ExpenseListResponse,
    dependencies=[Depends(require_roles([UserRole.ADMIN, UserRole.MANAGER, UserRole.EMPLOYEE]))],
)
async def list_expenses(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    start_date: Optional[datetime] = Query(None, description="Filter expenses on or after this date"),
    end_date: Optional[datetime] = Query(None, description="Filter expenses on or before this date"),
    category: Optional[str] = Query(None, description="Filter by category (e.g. Utilities, Fuel)"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """List daily expenses with optional date range and category filters + total expense sum calculation."""
    stmt = select(Expense).options(
        joinedload(Expense.bank_account), joinedload(Expense.created_by)
    )

    if start_date:
        stmt = stmt.where(Expense.date >= start_date)
    if end_date:
        stmt = stmt.where(Expense.date <= end_date)
    if category:
        stmt = stmt.where(Expense.category.ilike(f"%{category}%"))

    # Compute total expense sum for filtered range
    sum_stmt = select(func.coalesce(func.sum(Expense.amount), 0.0))
    if start_date:
        sum_stmt = sum_stmt.where(Expense.date >= start_date)
    if end_date:
        sum_stmt = sum_stmt.where(Expense.date <= end_date)
    if category:
        sum_stmt = sum_stmt.where(Expense.category.ilike(f"%{category}%"))

    total_sum_res = await db.execute(sum_stmt)
    total_amount = total_sum_res.scalar() or 0.0

    stmt = stmt.offset(skip).limit(limit).order_by(Expense.date.desc())
    result = await db.execute(stmt)
    expenses = result.scalars().all()

    return ExpenseListResponse(
        total_expense_amount=total_amount,
        expenses=expenses,
    )


@router.get(
    "/{expense_id}",
    response_model=ExpenseResponse,
    dependencies=[Depends(require_roles([UserRole.ADMIN, UserRole.MANAGER, UserRole.EMPLOYEE]))],
)
async def get_expense(
    expense_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Fetch single expense record details."""
    stmt = (
        select(Expense)
        .options(joinedload(Expense.bank_account), joinedload(Expense.created_by))
        .where(Expense.id == expense_id)
    )
    result = await db.execute(stmt)
    expense = result.scalars().first()
    if not expense:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Expense record not found",
        )
    return expense


@router.delete(
    "/{expense_id}",
    status_code=status.HTTP_200_OK,
    dependencies=[Depends(require_roles([UserRole.ADMIN, UserRole.MANAGER]))],
)
async def delete_expense(
    expense_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Delete an expense record (Admin/Manager only). If paid via bank transfer, refunds the amount back to bank balance."""
    stmt = (
        select(Expense)
        .options(joinedload(Expense.bank_account))
        .where(Expense.id == expense_id)
    )
    result = await db.execute(stmt)
    expense = result.scalars().first()
    if not expense:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Expense record not found",
        )

    # Refund bank account if paid via bank
    if expense.payment_method == PaymentMethod.BANK_TRANSFER and expense.bank_account_id:
        bank_res = await db.execute(
            select(BankAccount).where(BankAccount.id == expense.bank_account_id)
        )
        bank_account = bank_res.scalars().first()
        if bank_account:
            bank_account.current_balance += expense.amount

    await db.delete(expense)
    await db.commit()

    return {"message": "Expense record deleted successfully", "expense_id": str(expense_id)}
