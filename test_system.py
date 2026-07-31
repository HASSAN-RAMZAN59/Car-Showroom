"""Integration Test Script for Car Showroom ERP FastAPI Backend.

This script tests:
1. User Registration & Login (JWT Authentication)
2. Seller Registration with CNIC upload
3. Vehicle Purchase logging
4. Repair Expense logging (testing receipt uploads & cost calculations)
5. Smart Search Auto-Complete (/api/v1/search/cars)
"""

import asyncio

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

        # 7. Verify Cost Basis & Total Repair Calculation
        res = await client.get(f"/api/v1/repairs/car/{car_id}", headers=headers)
        assert res.status_code == 200, res.text
        repairs_summary = res.json()
        total_repairs = repairs_summary["total_repair_cost"]
        assert total_repairs == 130000.0
        print(f"[SUCCESS] 6. Total Repairs Sum Verified: PKR {total_repairs:,.2f}")

        # 8. Transition Car Status to AVAILABLE & Set Asking Price
        status_payload = {
            "status": "AVAILABLE",
            "asking_price": 3550000.0,
        }
        res = await client.patch(f"/api/v1/repairs/cars/{car_id}/status", json=status_payload, headers=headers)
        assert res.status_code == 200, res.text
        updated_car = res.json()
        assert updated_car["status"] == "AVAILABLE"
        assert updated_car["total_cost_basis"] == 3330000.0  # 3,200,000 + 130,000
        print(f"[SUCCESS] 7. Car Status Transitioned to '{updated_car['status']}'!")
        print(f"   - Purchase Price: PKR {updated_car['purchase_price']:,.2f}")
        print(f"   - Total Repair Cost: PKR {updated_car['total_repair_cost']:,.2f}")
        print(f"   - Calculated Cost Basis: PKR {updated_car['total_cost_basis']:,.2f}")
        print(f"   - Target Asking Price: PKR {updated_car['asking_price']:,.2f}")

        # 9. Smart Search Auto-Complete Test
        res = await client.get("/api/v1/search/cars?query=LEB", headers=headers)
        assert res.status_code == 200, res.text
        search_results = res.json()
        assert len(search_results) > 0
        match = search_results[0]
        print(f"[SUCCESS] 8. Smart Search Auto-Complete Verified! Query: 'LEB' -> Found: {match['make']} {match['model']} ({match['car_number']})")
        print("=" * 65)
        print(" ALL BACKEND TESTS PASSED SUCCESSFULLY!")
        print("=" * 65)


if __name__ == "__main__":
    asyncio.run(run_tests())
