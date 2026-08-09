import uuid
from datetime import datetime
from typing import Any, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.api.deps import get_current_user, require_roles
from app.core.database import get_db
from app.models.bank import BankAccount, PaymentMethod, PaymentTransaction, TransactionType
from app.models.car import Car
from app.models.sale import Sale
from app.models.user import User, UserRole
from app.schemas.bank import (
    BankAccountCreate,
    BankAccountResponse,
    PaymentTransactionCreate,
    PaymentTransactionResponse,
    SplitSalePaymentCreate,
)

router = APIRouter()


@router.post(
    "/accounts",
    response_model=BankAccountResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_roles([UserRole.ADMIN, UserRole.MANAGER]))],
)
async def create_bank_account(
    account_in: BankAccountCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Register a new showroom bank account."""
    # Check if account number already exists
    res = await db.execute(
        select(BankAccount).where(BankAccount.account_number == account_in.account_number)
    )
    if res.scalars().first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"A bank account with number '{account_in.account_number}' already exists.",
        )

    bank_account = BankAccount(
        account_title=account_in.account_title,
        bank_name=account_in.bank_name,
        account_number=account_in.account_number,
        current_balance=account_in.current_balance,
        is_active=True,
    )
    db.add(bank_account)
    await db.commit()
    await db.refresh(bank_account)
    return bank_account


@router.get(
    "/accounts",
    response_model=List[BankAccountResponse],
    dependencies=[Depends(require_roles([UserRole.ADMIN, UserRole.MANAGER, UserRole.EMPLOYEE]))],
)
async def list_bank_accounts(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """List all active showroom bank accounts with current balances."""
    stmt = select(BankAccount).where(BankAccount.is_active == True).order_by(BankAccount.bank_name.asc())
    result = await db.execute(stmt)
    accounts = result.scalars().all()
    return accounts


@router.post(
    "/transactions",
    response_model=PaymentTransactionResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_roles([UserRole.ADMIN, UserRole.MANAGER, UserRole.EMPLOYEE]))],
)
async def record_payment_transaction(
    tx_in: PaymentTransactionCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Record a single payment transaction and automatically synchronize bank account balances."""
    bank_account = None
    if tx_in.bank_account_id:
        bank_res = await db.execute(
            select(BankAccount).where(BankAccount.id == tx_in.bank_account_id)
        )
        bank_account = bank_res.scalars().first()
        if not bank_account:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Bank Account with ID '{tx_in.bank_account_id}' not found.",
            )

    # Calculate balance increment/decrement
    if bank_account:
        if tx_in.transaction_type in [
            TransactionType.SALE_PAYMENT,
            TransactionType.INSTALLMENT_PAYMENT,
            TransactionType.DEPOSIT,
            TransactionType.CONSIGNMENT_COMMISSION,
        ]:
            bank_account.current_balance += tx_in.amount
        elif tx_in.transaction_type in [
            TransactionType.PURCHASE_PAYMENT,
            TransactionType.EXPENSE_PAYMENT,
            TransactionType.WITHDRAWAL,
        ]:
            if bank_account.current_balance < tx_in.amount and tx_in.transaction_type == TransactionType.WITHDRAWAL:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Insufficient funds in bank account. Current balance: PKR {bank_account.current_balance:,.2f}",
                )
            bank_account.current_balance -= tx_in.amount

    transaction = PaymentTransaction(
        transaction_type=tx_in.transaction_type,
        payment_method=tx_in.payment_method,
        bank_account_id=tx_in.bank_account_id,
        amount=tx_in.amount,
        reference_number=tx_in.reference_number,
        car_id=tx_in.car_id,
        sale_id=tx_in.sale_id,
        purchase_id=tx_in.purchase_id,
        installment_payment_id=tx_in.installment_payment_id,
        notes=tx_in.notes,
        created_by_id=current_user.id,
    )
    db.add(transaction)
    await db.commit()

    # Eagerly load bank account for response
    stmt = (
        select(PaymentTransaction)
        .options(joinedload(PaymentTransaction.bank_account))
        .where(PaymentTransaction.id == transaction.id)
    )
    res = await db.execute(stmt)
    return res.scalars().first()


@router.post(
    "/transactions/split-sale",
    response_model=List[PaymentTransactionResponse],
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_roles([UserRole.ADMIN, UserRole.MANAGER, UserRole.EMPLOYEE]))],
)
async def record_split_sale_payments(
    split_in: SplitSalePaymentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Helper endpoint to log multiple split payments (e.g. Bank A + Bank B + Cash) against a single sale transaction."""
    sale_res = await db.execute(select(Sale).where(Sale.id == split_in.sale_id))
    sale = sale_res.scalars().first()
    if not sale:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Sale transaction with ID '{split_in.sale_id}' not found.",
        )

    created_tx_ids = []

    for item in split_in.payments:
        bank_account = None
        if item.bank_account_id:
            bank_res = await db.execute(
                select(BankAccount).where(BankAccount.id == item.bank_account_id)
            )
            bank_account = bank_res.scalars().first()
            if not bank_account:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Bank Account with ID '{item.bank_account_id}' not found.",
                )
            bank_account.current_balance += item.amount

        tx = PaymentTransaction(
            transaction_type=TransactionType.SALE_PAYMENT,
            payment_method=item.payment_method,
            bank_account_id=item.bank_account_id,
            amount=item.amount,
            reference_number=item.reference_number,
            car_id=sale.car_id,
            sale_id=sale.id,
            notes=item.notes,
            created_by_id=current_user.id,
        )
        db.add(tx)
        await db.flush()
        created_tx_ids.append(tx.id)

    await db.commit()

    # Retrieve created transactions with eagerly loaded bank_account
    stmt = (
        select(PaymentTransaction)
        .options(joinedload(PaymentTransaction.bank_account))
        .where(PaymentTransaction.id.in_(created_tx_ids))
        .order_by(PaymentTransaction.created_at.asc())
    )
    result = await db.execute(stmt)
    return result.scalars().all()


@router.get(
    "/accounts/{account_id}/ledger",
    response_model=List[PaymentTransactionResponse],
    dependencies=[Depends(require_roles([UserRole.ADMIN, UserRole.MANAGER, UserRole.EMPLOYEE]))],
)
async def get_account_ledger(
    account_id: uuid.UUID,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Retrieve transaction audit ledger history for a specific bank account."""
    # Verify bank account exists
    res = await db.execute(select(BankAccount).where(BankAccount.id == account_id))
    if not res.scalars().first():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Bank Account with ID '{account_id}' not found.",
        )

    stmt = (
        select(PaymentTransaction)
        .options(joinedload(PaymentTransaction.bank_account))
        .where(PaymentTransaction.bank_account_id == account_id)
    )
    if start_date:
        stmt = stmt.where(PaymentTransaction.created_at >= start_date)
    if end_date:
        stmt = stmt.where(PaymentTransaction.created_at <= end_date)

    stmt = stmt.offset(skip).limit(limit).order_by(PaymentTransaction.created_at.desc())
    result = await db.execute(stmt)
    return result.scalars().all()


@router.get(
    "/car/{car_id}/transactions",
    response_model=List[PaymentTransactionResponse],
    dependencies=[Depends(require_roles([UserRole.ADMIN, UserRole.MANAGER, UserRole.EMPLOYEE]))],
)
async def get_car_financial_transactions(
    car_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Retrieve all payment transactions (across all bank accounts & cash) linked to a specific car."""
    stmt = (
        select(PaymentTransaction)
        .options(joinedload(PaymentTransaction.bank_account))
        .where(
            or_(
                PaymentTransaction.car_id == car_id,
                PaymentTransaction.purchase_id == car_id,
            )
        )
        .order_by(PaymentTransaction.created_at.desc())
    )
    result = await db.execute(stmt)
    return result.scalars().all()
