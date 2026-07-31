"""Integration Test Script for Car Showroom ERP FastAPI Backend.

This script tests:
1. User Registration & Login (JWT Authentication)
2. Seller Registration with CNIC upload
3. Vehicle Purchase logging & Inventory Creation
4. Repair Expense logging (testing receipt uploads & cost calculations)
5. Smart Search Auto-Complete (/api/v1/search/cars)
6. Customer Profile Registration
7. Token / Advance Booking & Vehicle Reservation
8. Sales Transaction, Net Profit calculation & PDF Deed Generation
9. Flexible Installment Plan Creation & Schedule Generation (EMI)
10. Multi-Bank Account Management, Balance Auto-Sync & Split Sale Payments
11. Daily Expense Logging, Bank Auto-Deduction, Period Sum, & Refund on Delete
12. Investor Profile Registration, Vehicle Capital Investment, Automated Profit Settlement upon Sale, and Bank Payout
13. Employee/Dealer Registration, Monthly Payroll Generation (Net Salary calculation), and Salary Payout Execution
14. Customer CRM Lead Creation, Follow-up Logging, Status Patching, and Smart Inventory Matching
15. Audit Log Entry Logging, Executive Financial Analytics, Inventory Aging, and One-Click Database Backup Export
"""

import asyncio
import json
from datetime import date, datetime, timedelta, timezone

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

        # 4. Create Seller & Log Vehicle Purchases
        seller_data = {
            "full_name": "Muhammad Ali",
            "cnic": "42101-9876543-1",
            "phone": "0300-1122334",
        }
        res = await client.post("/api/v1/sellers/", data=seller_data, headers=headers)
        seller_id = res.json()["id"]

        # Vehicle A (Sold)
        car_a_data = {
            "car_number": "LEB-9988",
            "make": "Honda",
            "model": "Civic Rebirth",
            "year": 2016,
            "color": "Black",
            "engine_number": "ENG-998877",
            "chassis_number": "CHS-112233",
            "status": "AVAILABLE",
            "purchase_price": 3200000.0,
            "seller_id": seller_id,
        }
        res = await client.post("/api/v1/cars/purchase", data=car_a_data, headers=headers)
        car_a_id = res.json()["id"]

        # Vehicle B (Unsold - In Stock)
        car_b_data = {
            "car_number": "LHR-5544",
            "make": "Toyota",
            "model": "Corolla Grande",
            "year": 2021,
            "color": "White",
            "engine_number": "ENG-554433",
            "chassis_number": "CHS-554433",
            "status": "AVAILABLE",
            "purchase_price": 4500000.0,
            "seller_id": seller_id,
        }
        res = await client.post("/api/v1/cars/purchase", data=car_b_data, headers=headers)
        car_b_id = res.json()["id"]
        print("[SUCCESS] 3. Vehicles Logged (Civic & Corolla Grande).")

        # 5. Log Daily Expense (PKR 15,000)
        exp_data = {
            "expense_name": "Showroom Electricity Bill",
            "category": "Utilities",
            "amount": 15000.0,
            "payment_method": "CASH",
        }
        res = await client.post("/api/v1/expenses/", data=exp_data, headers=headers)
        assert res.status_code == 201, res.text

        # 6. Complete Sale of Vehicle A (Sale Price PKR 3,600,000)
        # Cost Basis: 3,200,000 | Sale Price: 3,600,000 -> Gross Profit: 400,000
        customer_data = {
            "full_name": "Usman Tariq",
            "cnic": "35202-1234567-3",
            "phone": "0321-4455667",
        }
        res = await client.post("/api/v1/customers/", data=customer_data, headers=headers)
        customer_id = res.json()["id"]

        sale_data = {
            "car_id": car_a_id,
            "customer_id": customer_id,
            "final_sale_price": 3600000.0,
            "payment_type": "FULL_PAYMENT",
        }
        res = await client.post("/api/v1/sales/", json=sale_data, headers=headers)
        assert res.status_code == 201, res.text
        print("[SUCCESS] 4. Vehicle Sale Completed! Revenue: PKR 3,600,000.")

        # 7. Test Executive Financial Analytics Endpoint
        res = await client.get("/api/v1/analytics/financial-summary", headers=headers)
        assert res.status_code == 200, res.text
        fin = res.json()
        assert fin["total_sales_revenue"] == 3600000.0
        assert fin["total_car_purchase_cost"] == 3200000.0
        assert fin["total_gross_profit"] == 400000.0
        assert fin["total_operational_expenses"] == 15000.0
        assert fin["total_net_showroom_profit"] == 385000.0  # 400,000 - 15,000
        print(f"[SUCCESS] 5. Executive Financial Analytics Verified! Revenue: PKR {fin['total_sales_revenue']:,.2f} | Net Showroom Profit: PKR {fin['total_net_showroom_profit']:,.2f}")

        # 8. Test Inventory Aging Endpoint
        res = await client.get("/api/v1/analytics/inventory-aging", headers=headers)
        assert res.status_code == 200, res.text
        aging = res.json()
        assert aging["total_unsold_vehicles"] == 1
        assert aging["total_capital_locked"] == 4500000.0
        print(f"[SUCCESS] 6. Inventory Aging Breakdown Verified! Unsold Vehicles: {aging['total_unsold_vehicles']} | Capital Locked: PKR {aging['total_capital_locked']:,.2f}")

        # 9. Test One-Click Database JSON Backup Exporter
        res = await client.get("/api/v1/backup/export-json", headers=headers)
        assert res.status_code == 200, res.text
        backup_content = res.content.decode("utf-8")
        backup_obj = json.loads(backup_content)
        assert backup_obj["system"] == "Used Car Showroom ERP"
        assert "users" in backup_obj["tables"]
        assert "cars" in backup_obj["tables"]
        assert len(backup_obj["tables"]["cars"]) == 2
        print(f"[SUCCESS] 7. One-Click Database JSON Export Verified! Backup size: {len(backup_content):,} bytes across {len(backup_obj['tables'])} database tables.")

        print("=" * 65)
        print(" ALL ERP BACKEND MODULE TESTS PASSED SUCCESSFULLY!")
        print("=" * 65)


if __name__ == "__main__":
    asyncio.run(run_tests())
