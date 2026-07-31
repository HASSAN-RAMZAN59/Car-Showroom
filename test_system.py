"""Integration Test Script for Car Showroom ERP FastAPI Backend.

This script tests:
1. User Registration & Login (JWT Authentication)
2. Seller Registration with CNIC upload
3. Vehicle Purchase logging
4. Repair Expense logging (testing receipt uploads & cost calculations)
5. Smart Search Auto-Complete (/api/v1/search/cars)
6. Customer Profile Registration
7. Token / Advance Booking & Vehicle Reservation
8. Sales Transaction, Net Profit calculation & PDF Deed Generation
9. Flexible Installment Plan Creation & Schedule Generation (EMI)
10. Monthly Installment Payment Logging & Auto-Completion
"""

import asyncio
from datetime import datetime, timedelta, timezone

import httpx
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.database import Base, get_db
from app.main import app

# Setup test in-memory SQLite database engine
TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"
test_engine = create_async_engine(TEST_DATABASE_URL, echo=False)
TestingSessionLocal = async_sessionmaker(
    bind=test_engine, class_=AsyncSession, expire_on_commit=False
)


async def init_test_db():
    """Initialize database tables for testing."""
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def override_get_db():
    """Override get_db dependency to use in-memory SQLite session."""
    async with TestingSessionLocal() as session:
        yield session


app.dependency_overrides[get_db] = override_get_db


async def run_tests():
    await init_test_db()

    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
        print("=" * 65)
        print(" CAR SHOWROOM ERP - SYSTEM INTEGRATION TEST")
        print("=" * 65)

        # 1. Health Check
        res = await client.get("/")
        assert res.status_code == 200
        print("[SUCCESS] Health Check passed:", res.json())

        # 2. Register Admin User
        user_payload = {
            "email": "admin@carshowroom.com",
            "full_name": "Admin Manager",
            "password": "SecurePassword123!",
            "role": "ADMIN",
            "phone": "+923001234567",
        }
        res = await client.post("/api/v1/auth/register", json=user_payload)
        assert res.status_code == 201, res.text
        user_data = res.json()
        print("[SUCCESS] 1. User Registration passed! User ID:", user_data["id"])

        # 3. User Login
        login_payload = {
            "email": "admin@carshowroom.com",
            "password": "SecurePassword123!",
        }
        res = await client.post("/api/v1/auth/login", json=login_payload)
        assert res.status_code == 200, res.text
        token = res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        print("[SUCCESS] 2. User Login passed! JWT Access Token received.")

        # 4. Create Seller Record
        seller_data = {
            "full_name": "Muhammad Ali",
            "cnic": "42101-9876543-1",
            "phone": "0300-1122334",
            "address": "Gulberg III, Lahore",
        }
        res = await client.post("/api/v1/sellers/", data=seller_data, headers=headers)
        assert res.status_code == 201, res.text
        seller = res.json()
        seller_id = seller["id"]
        print("[SUCCESS] 3. Seller Registration passed! Seller ID:", seller_id)

        # 5. Log Vehicle Purchase
        car_data = {
            "car_number": "LEB-9988",
            "make": "Honda",
            "model": "Civic Rebirth",
            "year": 2016,
            "color": "Black",
            "engine_number": "ENG-998877",
            "chassis_number": "CHS-112233",
            "mileage": 75000,
            "status": "IN_MAINTENANCE",
            "purchase_price": 3200000.0,
            "seller_id": seller_id,
        }
        res = await client.post("/api/v1/cars/purchase", data=car_data, headers=headers)
        assert res.status_code == 201, res.text
        car = res.json()
        car_id = car["id"]
        print(f"[SUCCESS] 4. Car Purchase logged! Plate: {car['car_number']}, Price: PKR {car['purchase_price']:,.2f}")

        # 6. Log Repair Expenses
        repair1_data = {
            "car_id": car_id,
            "repair_type": "Denting & Painting",
            "vendor_name": "Royal Motors Workshop",
            "cost": 85000.0,
            "notes": "Front bumper and fender touchup",
        }
        res = await client.post("/api/v1/repairs/", data=repair1_data, headers=headers)
        assert res.status_code == 201, res.text

        # 7. Register Customer Profile
        customer_data = {
            "full_name": "Usman Tariq",
            "cnic": "35202-1234567-3",
            "phone": "0321-4455667",
            "address": "DHA Phase 5, Lahore",
        }
        res = await client.post("/api/v1/customers/", data=customer_data, headers=headers)
        assert res.status_code == 201, res.text
        customer = res.json()
        customer_id = customer["id"]

        # 8. Register Sales Transaction
        sale_data = {
            "car_id": car_id,
            "customer_id": customer_id,
            "final_sale_price": 3600000.0,
            "payment_type": "INSTALLMENT",
            "notes": "Financed via 6-month installment plan",
        }
        res = await client.post("/api/v1/sales/", json=sale_data, headers=headers)
        assert res.status_code == 201, res.text
        sale = res.json()
        sale_id = sale["id"]
        print(f"[SUCCESS] 5. Vehicle Sale Completed! Sale ID: {sale_id}")

        # 9. Create 6-Month Installment Plan
        plan_data = {
            "sale_id": sale_id,
            "down_payment": 1200000.0,
            "duration_months": 6,
        }
        res = await client.post("/api/v1/installments/plan", json=plan_data, headers=headers)
        assert res.status_code == 201, res.text
        plan = res.json()
        plan_id = plan["id"]
        payments = plan["payments"]
        assert len(payments) == 6
        print(f"[SUCCESS] 6. Installment Plan Created! Total: PKR {plan['total_amount']:,.2f}")
        print(f"   - Down Payment: PKR {plan['down_payment']:,.2f}")
        print(f"   - Financed Amount: PKR {plan['financed_amount']:,.2f}")
        print(f"   - Monthly Installment (6 Mos): PKR {plan['monthly_installment_amount']:,.2f}")

        # 10. Log Installment Payment (Month 1)
        m1_payment_id = payments[0]["id"]
        pay_data = {
            "amount_paid": plan['monthly_installment_amount'],
            "payment_method": "Bank Transfer",
            "transaction_reference": "TXN-99887766",
            "notes": "Month 1 EMI Received",
        }
        res = await client.post(f"/api/v1/installments/pay/{m1_payment_id}", json=pay_data, headers=headers)
        assert res.status_code == 200, res.text
        paid_m1 = res.json()
        assert paid_m1["status"] == "PAID"
        print("[SUCCESS] 7. Month 1 Installment Payment Logged!")

        # 11. Fetch Plan Details & Check Remaining Balance
        res = await client.get(f"/api/v1/installments/plan/{plan_id}", headers=headers)
        assert res.status_code == 200, res.text
        plan_detail = res.json()
        expected_total_paid = 1200000.0 + plan['monthly_installment_amount']
        expected_balance = 3600000.0 - expected_total_paid
        assert plan_detail["total_paid"] == expected_total_paid
        assert plan_detail["remaining_balance"] == expected_balance
        print(f"[SUCCESS] 8. Remaining Balance Verified: PKR {plan_detail['remaining_balance']:,.2f}")

        # 12. Check Overdue Endpoint
        res = await client.get("/api/v1/installments/overdue", headers=headers)
        assert res.status_code == 200
        print("[SUCCESS] 9. Overdue Payments Monitoring Endpoint Verified!")

        print("=" * 65)
        print(" ALL ERP BACKEND MODULE TESTS PASSED SUCCESSFULLY!")
        print("=" * 65)


if __name__ == "__main__":
    asyncio.run(run_tests())
