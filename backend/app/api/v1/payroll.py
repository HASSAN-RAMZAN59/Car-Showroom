import uuid
from datetime import datetime, timezone
from typing import Any, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload, selectinload

from app.api.deps import get_current_user, require_roles
from app.core.database import get_db
from app.models.bank import BankAccount, PaymentMethod, PaymentTransaction, TransactionType
from app.models.payroll import Employee, Payroll, PayrollPaymentStatus
from app.models.user import User, UserRole
from app.schemas.payroll import (
    EmployeeCreate,
    EmployeeDetailResponse,
    EmployeeResponse,
    PayrollGenerateCreate,
    PayrollPaymentExecute,
    PayrollResponse,
)

router = APIRouter()


@router.post(
    "/employees",
    response_model=EmployeeResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_roles([UserRole.ADMIN, UserRole.MANAGER]))],
)
async def create_employee(
    emp_in: EmployeeCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Register a new employee or sales dealer profile."""
    # Check for duplicate CNIC
    res = await db.execute(select(Employee).where(Employee.cnic == emp_in.cnic))
    if res.scalars().first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"An employee with CNIC '{emp_in.cnic}' already exists.",
        )

    employee = Employee(
        user_id=emp_in.user_id,
        full_name=emp_in.full_name,
        cnic=emp_in.cnic,
        phone=emp_in.phone,
        designation=emp_in.designation,
        base_salary=emp_in.base_salary,
        joining_date=emp_in.joining_date,
        is_active=emp_in.is_active,
    )
    db.add(employee)
    await db.commit()
    await db.refresh(employee)
    return employee


@router.get(
    "/employees",
    response_model=List[EmployeeResponse],
    dependencies=[Depends(require_roles([UserRole.ADMIN, UserRole.MANAGER]))],
)
async def list_employees(
    is_active: Optional[bool] = Query(None, description="Filter by active employment status"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """List showroom employees and sales dealers."""
    stmt = select(Employee)
    if is_active is not None:
        stmt = stmt.where(Employee.is_active == is_active)
    stmt = stmt.order_by(Employee.created_at.desc())
    result = await db.execute(stmt)
    return result.scalars().all()


@router.get(
    "/employees/{employee_id}",
    response_model=EmployeeDetailResponse,
    dependencies=[Depends(require_roles([UserRole.ADMIN, UserRole.MANAGER]))],
)
async def get_employee(
    employee_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Fetch detailed employee profile along with complete salary payment history."""
    stmt = (
        select(Employee)
        .options(selectinload(Employee.payrolls))
        .where(Employee.id == employee_id)
    )
    result = await db.execute(stmt)
    employee = result.scalars().first()
    if not employee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Employee not found",
        )
    return employee


@router.post(
    "/generate",
    response_model=PayrollResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_roles([UserRole.ADMIN, UserRole.MANAGER]))],
)
async def generate_payroll(
    payroll_in: PayrollGenerateCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Generate a monthly payroll record for an employee with automated net salary calculation."""
    # 1. Verify employee exists
    emp_res = await db.execute(select(Employee).where(Employee.id == payroll_in.employee_id))
    employee = emp_res.scalars().first()
    if not employee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Employee with ID '{payroll_in.employee_id}' not found.",
        )

    # 2. Check if a payroll record already exists for this month/year
    existing_res = await db.execute(
        select(Payroll).where(
            Payroll.employee_id == payroll_in.employee_id,
            Payroll.pay_period_month == payroll_in.pay_period_month,
            Payroll.pay_period_year == payroll_in.pay_period_year,
        )
    )
    if existing_res.scalars().first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Payroll for employee '{employee.full_name}' for period {payroll_in.pay_period_month}/{payroll_in.pay_period_year} has already been generated.",
        )

    # 3. Compute net salary (base_salary + allowances - deductions)
    base_salary = employee.base_salary
    net_salary = max(0.0, base_salary + payroll_in.allowances - payroll_in.deductions)

    payroll = Payroll(
        employee_id=payroll_in.employee_id,
        pay_period_month=payroll_in.pay_period_month,
        pay_period_year=payroll_in.pay_period_year,
        base_salary=base_salary,
        allowances=payroll_in.allowances,
        deductions=payroll_in.deductions,
        net_salary=net_salary,
        payment_status=PayrollPaymentStatus.PENDING,
        notes=payroll_in.notes,
        created_by_id=current_user.id,
    )
    db.add(payroll)
    await db.commit()

    # Eagerly load employee for response
    stmt = (
        select(Payroll)
        .options(joinedload(Payroll.employee), joinedload(Payroll.bank_account))
        .where(Payroll.id == payroll.id)
    )
    res = await db.execute(stmt)
    return res.scalars().first()


@router.post(
    "/pay/{payroll_id}",
    response_model=PayrollResponse,
    dependencies=[Depends(require_roles([UserRole.ADMIN, UserRole.MANAGER]))],
)
async def execute_salary_payment(
    payroll_id: uuid.UUID,
    pay_in: PayrollPaymentExecute,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Execute salary payment for a pending payroll record and deduct from bank account balance if applicable."""
    stmt = (
        select(Payroll)
        .options(joinedload(Payroll.employee))
        .where(Payroll.id == payroll_id)
    )
    result = await db.execute(stmt)
    payroll = result.scalars().first()
    if not payroll:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payroll record not found",
        )
    if payroll.payment_status == PayrollPaymentStatus.PAID:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This payroll record has already been marked as PAID.",
        )

    # Handle bank transfer auto-deduction
    bank_account = None
    if pay_in.payment_method == PaymentMethod.BANK_TRANSFER and pay_in.bank_account_id:
        bank_res = await db.execute(
            select(BankAccount).where(BankAccount.id == pay_in.bank_account_id)
        )
        bank_account = bank_res.scalars().first()
        if not bank_account:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Bank Account with ID '{pay_in.bank_account_id}' not found.",
            )
        if bank_account.current_balance < payroll.net_salary:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Insufficient funds in bank account for salary payout. Current balance: PKR {bank_account.current_balance:,.2f}, Required: PKR {payroll.net_salary:,.2f}",
            )
        # Deduct net_salary from bank balance
        bank_account.current_balance -= payroll.net_salary

        # Log expense payment ledger transaction
        emp_name = payroll.employee.full_name if payroll.employee else "Employee"
        tx = PaymentTransaction(
            transaction_type=TransactionType.EXPENSE_PAYMENT,
            payment_method=PaymentMethod.BANK_TRANSFER,
            bank_account_id=bank_account.id,
            amount=payroll.net_salary,
            reference_number=f"PAYROLL-{payroll.pay_period_month:02d}{payroll.pay_period_year}",
            notes=f"Payroll Salary Payout for {emp_name} ({payroll.pay_period_month}/{payroll.pay_period_year})",
            created_by_id=current_user.id,
        )
        db.add(tx)

    # Update payroll status
    payroll.payment_status = PayrollPaymentStatus.PAID
    payroll.payment_date = datetime.now(timezone.utc)
    payroll.payment_method = pay_in.payment_method
    payroll.bank_account_id = pay_in.bank_account_id
    if pay_in.notes:
        payroll.notes = (payroll.notes or "") + f" | Payout Note: {pay_in.notes}"

    await db.commit()

    # Re-fetch with loaded relations
    stmt_reload = (
        select(Payroll)
        .options(joinedload(Payroll.employee), joinedload(Payroll.bank_account))
        .where(Payroll.id == payroll.id)
    )
    res_reload = await db.execute(stmt_reload)
    return res_reload.scalars().first()


@router.get(
    "/history",
    response_model=List[PayrollResponse],
    dependencies=[Depends(require_roles([UserRole.ADMIN, UserRole.MANAGER]))],
)
async def list_payroll_history(
    pay_period_month: Optional[int] = Query(None, ge=1, le=12, description="Filter by month"),
    pay_period_year: Optional[int] = Query(None, ge=2020, le=2100, description="Filter by year"),
    payment_status: Optional[PayrollPaymentStatus] = Query(None, description="Filter by payment status"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Fetch payroll history filtered by month, year, or payment status."""
    stmt = select(Payroll).options(
        joinedload(Payroll.employee), joinedload(Payroll.bank_account)
    )
    if pay_period_month:
        stmt = stmt.where(Payroll.pay_period_month == pay_period_month)
    if pay_period_year:
        stmt = stmt.where(Payroll.pay_period_year == pay_period_year)
    if payment_status:
        stmt = stmt.where(Payroll.payment_status == payment_status)

    stmt = stmt.order_by(Payroll.created_at.desc())
    result = await db.execute(stmt)
    return result.scalars().all()
