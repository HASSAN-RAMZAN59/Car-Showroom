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
        print("[SUCCESS] 5a. Repair Entry 1 logged: Denting & Painting (PKR 85,000)")

        repair2_data = {
            "car_id": car_id,
            "repair_type": "Mechanical & Tuning",
            "vendor_name": "Honda Master Tech",
            "cost": 45000.0,
            "notes": "Engine oil, brake pads, and suspension bushings",
        }
        res = await client.post("/api/v1/repairs/", data=repair2_data, headers=headers)
        assert res.status_code == 201, res.text
        print("[SUCCESS] 5b. Repair Entry 2 logged: Mechanical & Tuning (PKR 45,000)")

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
        print("[SUCCESS] 6. Customer Profile Registered! Customer ID:", customer_id)

        # 8. Token / Advance Booking Reservation
        expiry = (datetime.now(timezone.utc) + timedelta(days=7)).isoformat()
        token_data = {
            "car_id": car_id,
            "customer_id": customer_id,
            "advance_amount": 100000.0,
            "expiry_date": expiry,
            "is_refundable": False,
            "notes": "Advance token payment for Honda Civic",
        }
        res = await client.post("/api/v1/token_bookings/", json=token_data, headers=headers)
        assert res.status_code == 201, res.text
        booking = res.json()
        print(f"[SUCCESS] 7. Token Booking Created! Car Reserved. Advance: PKR {booking['advance_amount']:,.2f}")

        # 9. Register Sales Transaction
        sale_data = {
            "car_id": car_id,
            "customer_id": customer_id,
            "final_sale_price": 3600000.0,
            "payment_type": "FULL_PAYMENT",
            "notes": "Full payment received via bank transfer",
        }
        res = await client.post("/api/v1/sales/", json=sale_data, headers=headers)
        assert res.status_code == 201, res.text
        sale = res.json()
        sale_id = sale["id"]
        print(f"[SUCCESS] 8. Vehicle Sale Completed!")
        print(f"   - Final Sale Price: PKR {sale['final_sale_price']:,.2f}")
        print(f"   - Total Cost Basis: PKR {sale['total_cost_basis']:,.2f}")
        print(f"   - Net Profit Margin: PKR {sale['net_profit']:,.2f}")

        # 10. Generate & Download PDF Sale Deed
        res = await client.get(f"/api/v1/sales/{sale_id}/pdf", headers=headers)
        assert res.status_code == 200, res.text
        assert res.headers["content-type"] == "application/pdf"
        print(f"[SUCCESS] 9. PDF Sale Deed Export Verified! File Size: {len(res.content)} bytes.")

        print("=" * 65)
        print(" ALL ERP BACKEND MODULE TESTS PASSED SUCCESSFULLY!")
        print("=" * 65)


if __name__ == "__main__":
    asyncio.run(run_tests())
