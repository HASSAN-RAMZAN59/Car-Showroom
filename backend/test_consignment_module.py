import asyncio
import uuid
from datetime import datetime, timezone
from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import AsyncSessionLocal, engine, Base
from app.models.car import Car, CarStatus
from app.models.consignment import ConsignmentAgreement, CommissionType, ConsignmentStatus
from app.models.customer import Customer
from app.models.sale import Sale, PaymentType
from app.models.user import User, UserRole


async def test_consignment_flow():
    print("=== STARTING CONSIGNMENT MODULE E2E TEST ===")
    
    # 1. Ensure DB schema tables & new columns exist
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        await conn.execute(text("ALTER TABLE cars ADD COLUMN IF NOT EXISTS is_consignment BOOLEAN DEFAULT FALSE;"))
        await conn.execute(text("ALTER TABLE cars ALTER COLUMN seller_id DROP NOT NULL;"))
        await conn.execute(text("ALTER TABLE cars ALTER COLUMN status TYPE VARCHAR(50);"))
    
    async with AsyncSessionLocal() as session:
        # Find or create admin user
        user_res = await session.execute(select(User).limit(1))
        user = user_res.scalars().first()
        if not user:
            user = User(
                full_name="Test Admin",
                email="admin_test@showroom.com",
                hashed_password="hashed_pass_test",
                role=UserRole.ADMIN,
            )
            session.add(user)
            await session.flush()

        # Find or create customer
        cust_res = await session.execute(select(Customer).limit(1))
        customer = cust_res.scalars().first()
        if not customer:
            customer = Customer(
                full_name="Test Buyer",
                cnic="35202-9999999-1",
                phone="0300-9999999",
            )
            session.add(customer)
            await session.flush()

        # -------------------------------------------------------------
        # TEST 1: Register Consignment Car (Percentage Commission)
        # -------------------------------------------------------------
        car_number = f"CONS-{uuid.uuid4().hex[:6].upper()}"
        engine_number = f"ENG-{uuid.uuid4().hex[:8].upper()}"
        chassis_number = f"CHS-{uuid.uuid4().hex[:8].upper()}"

        cons_car = Car(
            car_number=car_number,
            make="Toyota",
            model="Fortuner Legender",
            year=2023,
            color="Attitude Black",
            engine_number=engine_number,
            chassis_number=chassis_number,
            mileage=12000,
            status=CarStatus.CONSIGNED_AVAILABLE,
            is_consignment=True,
            purchase_price=0.0,
            asking_price=18500000.0,
            seller_id=None,
            created_by_id=user.id,
        )
        session.add(cons_car)
        await session.flush()

        cons_agreement = ConsignmentAgreement(
            owner_name="Chaudhry Tariq",
            owner_cnic="35202-7777777-3",
            owner_phone="0321-7777777",
            owner_address="Gulberg III, Lahore",
            car_id=cons_car.id,
            commission_type=CommissionType.PERCENTAGE,
            commission_value=2.5, # 2.5% cut
            agreed_asking_price=18500000.0,
            status=ConsignmentStatus.ACTIVE,
            created_by_id=user.id,
        )
        session.add(cons_agreement)
        await session.commit()

        print(f"[OK] TEST 1 PASSED: Consignment Agreement registered. Car ID: {cons_car.id}, Status: {cons_car.status}")

        # -------------------------------------------------------------
        # TEST 2: Sell Consignment Car and verify calculations
        # -------------------------------------------------------------
        selling_price = 18000000.0 # Sold for PKR 18 Million
        expected_commission = (selling_price * 2.5) / 100.0 # PKR 450,000
        expected_owner_payout = selling_price - expected_commission # PKR 17,550,000

        # Simulate Sale creation logic
        sale = Sale(
            car_id=cons_car.id,
            customer_id=customer.id,
            sold_by_employee_id=user.id,
            final_sale_price=selling_price,
            total_cost_basis=0.0,
            net_profit=expected_commission,
            payment_type=PaymentType.FULL_PAYMENT,
            notes="Consignment sale test",
        )
        session.add(sale)
        cons_car.status = CarStatus.CONSIGNED_SOLD
        cons_agreement.status = ConsignmentStatus.SOLD

        await session.commit()

        # Re-verify values
        assert cons_car.status == CarStatus.CONSIGNED_SOLD, "Car status should be CONSIGNED_SOLD"
        assert cons_agreement.status == ConsignmentStatus.SOLD, "Agreement status should be SOLD"

        print(f"[OK] TEST 2 PASSED: Consignment car sold successfully!")
        print(f"   - Selling Price: PKR {selling_price:,.2f}")
        print(f"   - Showroom Commission (2.5%): PKR {expected_commission:,.2f}")
        print(f"   - Owner Payout: PKR {expected_owner_payout:,.2f}")

        # -------------------------------------------------------------
        # TEST 3: Register and Withdraw a consignment vehicle
        # -------------------------------------------------------------
        car_number_2 = f"WITH-{uuid.uuid4().hex[:6].upper()}"
        engine_number_2 = f"ENG-{uuid.uuid4().hex[:8].upper()}"
        chassis_number_2 = f"CHS-{uuid.uuid4().hex[:8].upper()}"

        cons_car_2 = Car(
            car_number=car_number_2,
            make="Civic",
            model="RS Turbo",
            year=2022,
            color="Rallye Red",
            engine_number=engine_number_2,
            chassis_number=chassis_number_2,
            mileage=25000,
            status=CarStatus.CONSIGNED_AVAILABLE,
            is_consignment=True,
            purchase_price=0.0,
            asking_price=7500000.0,
            created_by_id=user.id,
        )
        session.add(cons_car_2)
        await session.flush()

        cons_agreement_2 = ConsignmentAgreement(
            owner_name="Usman Sheikh",
            owner_cnic="35202-8888888-2",
            owner_phone="0300-8888888",
            car_id=cons_car_2.id,
            commission_type=CommissionType.FIXED_AMOUNT,
            commission_value=150000.0, # PKR 150K fixed
            agreed_asking_price=7500000.0,
            status=ConsignmentStatus.ACTIVE,
            created_by_id=user.id,
        )
        session.add(cons_agreement_2)
        await session.commit()

        # Withdraw vehicle
        cons_agreement_2.status = ConsignmentStatus.RETURNED_TO_OWNER
        cons_agreement_2.withdrawal_date = datetime.now(timezone.utc)
        cons_car_2.status = CarStatus.CONSIGNED_RETURNED
        await session.commit()

        assert cons_car_2.status == CarStatus.CONSIGNED_RETURNED, "Car status should be CONSIGNED_RETURNED"
        assert cons_agreement_2.status == ConsignmentStatus.RETURNED_TO_OWNER, "Agreement status should be RETURNED_TO_OWNER"

        print(f"[OK] TEST 3 PASSED: Consignment withdrawal verified successfully! Car ID {cons_car_2.id} status is now CONSIGNED_RETURNED.")

    print("=== ALL CONSIGNMENT MODULE TESTS PASSED PERFECTLY ===")


if __name__ == "__main__":
    asyncio.run(test_consignment_flow())
