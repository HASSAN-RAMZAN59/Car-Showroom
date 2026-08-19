import asyncio
import logging
from sqlalchemy import text, select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import AsyncSessionLocal
from app.core.security import get_password_hash
from app.models.user import User, UserRole
from app.models.seller import Seller
from app.models.customer import Customer
from app.models.car import Car
from app.models.sale import Sale
from app.models.installment import InstallmentPlan
from app.models.expense import Expense
from app.models.investor import Investor
from app.models.payroll import Employee
from app.models.lead import Lead

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("db_reset")

DEFAULT_ACCOUNTS = [
    {
        "email": "admin@showroom.com",
        "password": "AdminPassword123!",
        "role": UserRole.ADMIN,
        "full_name": "System Admin",
        "phone": "0300-1111111",
    },
    {
        "email": "manager@showroom.com",
        "password": "ManagerPassword123!",
        "role": UserRole.MANAGER,
        "full_name": "Showroom Manager",
        "phone": "0300-2222222",
    },
    {
        "email": "staff@showroom.com",
        "password": "StaffPassword123!",
        "role": UserRole.EMPLOYEE,
        "full_name": "Showroom Staff",
        "phone": "0300-3333333",
    },
]


async def wipe_and_reset_database():
    print("=" * 80)
    print(" STARTING COMPLETE PRODUCTION DATABASE RESET & DUMMY DATA PURGE")
    print("=" * 80)

    async with AsyncSessionLocal() as db:
        # 1. Truncate all business data tables using CASCADE
        truncate_sql = text("""
            TRUNCATE TABLE 
                installment_payments, 
                installment_plans, 
                token_bookings, 
                sales, 
                car_repairs, 
                car_investments, 
                investors, 
                consignment_agreements,
                cars, 
                customers, 
                sellers, 
                expenses, 
                payrolls, 
                employees, 
                lead_followups, 
                customer_leads, 
                notifications, 
                audit_logs 
            RESTART IDENTITY CASCADE;
        """)

        await db.execute(truncate_sql)
        print(" [CLEARED] All business tables truncated & wiped cleanly!")

        # 2. Delete non-default users
        delete_users_sql = text("""
            DELETE FROM users WHERE email NOT IN ('admin@showroom.com', 'manager@showroom.com', 'staff@showroom.com');
        """)
        await db.execute(delete_users_sql)
        print(" [CLEARED] Non-default Test Users")

        # 3. Ensure default accounts exist with fresh credentials
        for acc in DEFAULT_ACCOUNTS:
            res = await db.execute(select(User).where(User.email == acc["email"]))
            user_obj = res.scalars().first()
            hashed_pwd = get_password_hash(acc["password"])
            
            if not user_obj:
                user_obj = User(
                    email=acc["email"],
                    full_name=acc["full_name"],
                    hashed_password=hashed_pwd,
                    phone=acc["phone"],
                    role=acc["role"],
                    is_active=True,
                )
                db.add(user_obj)
            else:
                user_obj.hashed_password = hashed_pwd
                user_obj.is_active = True

        await db.commit()
        print("\n [PRESERVED] Default System Accounts:")
        for acc in DEFAULT_ACCOUNTS:
            print(f"   - {acc['role'].value}: {acc['email']} | Password: {acc['password']}")

        # 4. Verify Table Counts
        print("\n" + "-" * 50)
        print(" VERIFYING TABLE COUNTS AFTER RESET:")
        print("-" * 50)
        
        verification_models = [
            ("Cars / Inventory", Car),
            ("Sales", Sale),
            ("Customers", Customer),
            ("Sellers", Seller),
            ("Installment Plans", InstallmentPlan),
            ("Daily Expenses", Expense),
            ("Investors", Investor),
            ("Employees", Employee),
            ("Customer Leads", Lead),
        ]

        for label, model in verification_models:
            count_res = await db.execute(select(func.count()).select_from(model))
            cnt = count_res.scalar_one()
            status_str = "CLEAN (0 records)" if cnt == 0 else f"{cnt} records"
            print(f"   - {label}: {cnt} ({status_str})")

        print("=" * 80)
        print(" SUCCESS: PRODUCTION DATABASE SUCCESSFULLY RESET! READY FOR GO-LIVE!")
        print("=" * 80)


if __name__ == "__main__":
    asyncio.run(wipe_and_reset_database())
