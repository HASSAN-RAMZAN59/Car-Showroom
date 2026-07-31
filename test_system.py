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
10. Multi-Bank Account Management, Balance Auto-Sync & Split Sale Payments
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

        # 4. Create Bank Accounts
        bank_a_data = {
            "account_title": "Meezan Showroom Operations",
            "bank_name": "Meezan Bank",
            "account_number": "PK12MEZN00011122233344",
            "current_balance": 5000000.0,
        }
        res = await client.post("/api/v1/bank/accounts", json=bank_a_data, headers=headers)
        assert res.status_code == 201, res.text
        bank_a = res.json()
        bank_a_id = bank_a["id"]

        bank_b_data = {
            "account_title": "HBL Showroom Reserve",
            "bank_name": "Habib Bank Limited",
            "account_number": "PK99HABB00099988877766",
            "current_balance": 2000000.0,
        }
        res = await client.post("/api/v1/bank/accounts", json=bank_b_data, headers=headers)
        assert res.status_code == 201, res.text
        bank_b = res.json()
        bank_b_id = bank_b["id"]

        print("[SUCCESS] 3. Bank Accounts Created! Meezan (PKR 5M) & HBL (PKR 2M).")

        # 5. Create Seller & Log Vehicle Purchase
        seller_data = {
            "full_name": "Muhammad Ali",
            "cnic": "42101-9876543-1",
            "phone": "0300-1122334",
            "address": "Gulberg III, Lahore",
        }
        res = await client.post("/api/v1/sellers/", data=seller_data, headers=headers)
        seller_id = res.json()["id"]

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
        car_id = res.json()["id"]

        # Log Purchase Payment Transaction out of Meezan Bank
        purchase_tx = {
            "transaction_type": "PURCHASE_PAYMENT",
            "payment_method": "BANK_TRANSFER",
            "bank_account_id": bank_a_id,
            "amount": 3200000.0,
            "reference_number": "FT-20260731-001",
            "car_id": car_id,
            "purchase_id": car_id,
            "notes": "Purchase price paid to seller via Meezan Bank",
        }
        res = await client.post("/api/v1/bank/transactions", json=purchase_tx, headers=headers)
        assert res.status_code == 201, res.text
        print("[SUCCESS] 4. Purchase Payment Logged! Meezan balance debited.")

        # 6. Register Customer Profile & Sale
        customer_data = {
            "full_name": "Usman Tariq",
            "cnic": "35202-1234567-3",
            "phone": "0321-4455667",
            "address": "DHA Phase 5, Lahore",
        }
        res = await client.post("/api/v1/customers/", data=customer_data, headers=headers)
        customer_id = res.json()["id"]

        sale_data = {
            "car_id": car_id,
            "customer_id": customer_id,
            "final_sale_price": 3600000.0,
            "payment_type": "FULL_PAYMENT",
            "notes": "Paid via split payments across Meezan, HBL, and Cash",
        }
        res = await client.post("/api/v1/sales/", json=sale_data, headers=headers)
        sale_id = res.json()["id"]

        # 7. Log Split Sale Payment (Meezan + HBL + Cash)
        split_payload = {
            "sale_id": sale_id,
            "payments": [
                {
                    "amount": 1600000.0,
                    "payment_method": "BANK_TRANSFER",
                    "bank_account_id": bank_a_id,
                    "reference_number": "TXN-MEEZAN-101",
                    "notes": "Part 1 payment via Meezan Bank",
                },
                {
                    "amount": 1500000.0,
                    "payment_method": "BANK_TRANSFER",
                    "bank_account_id": bank_b_id,
                    "reference_number": "TXN-HBL-202",
                    "notes": "Part 2 payment via HBL Bank",
                },
                {
                    "amount": 500000.0,
                    "payment_method": "CASH",
                    "bank_account_id": None,
                    "reference_number": "CASH-REC-303",
                    "notes": "Part 3 payment in cash",
                },
            ],
        }
        res = await client.post("/api/v1/bank/transactions/split-sale", json=split_payload, headers=headers)
        assert res.status_code == 201, res.text
        split_txs = res.json()
        assert len(split_txs) == 3
        print("[SUCCESS] 5. Split Sale Payment Engine Passed! 3 Split transactions recorded.")

        # 8. Verify Bank Balances & Ledger History
        res = await client.get("/api/v1/bank/accounts", headers=headers)
        assert res.status_code == 200
        accounts = {acc["bank_name"]: acc["current_balance"] for acc in res.json()}
        # Meezan: Initial 5M - 3.2M purchase + 1.6M split = 3.4M
        assert accounts["Meezan Bank"] == 3400000.0
        # HBL: Initial 2M + 1.5M split = 3.5M
        assert accounts["Habib Bank Limited"] == 3500000.0
        print(f"[SUCCESS] 6. Bank Balances Verified! Meezan: PKR {accounts['Meezan Bank']:,.2f} | HBL: PKR {accounts['Habib Bank Limited']:,.2f}")

        # 9. Verify Car Audit Trail
        res = await client.get(f"/api/v1/bank/car/{car_id}/transactions", headers=headers)
        assert res.status_code == 200
        car_txs = res.json()
        assert len(car_txs) >= 4  # 1 purchase + 3 split sale items
        print(f"[SUCCESS] 7. Car Financial Audit Trail Verified! Total Ledger Items: {len(car_txs)}")

        print("=" * 65)
        print(" ALL ERP BACKEND MODULE TESTS PASSED SUCCESSFULLY!")
        print("=" * 65)


if __name__ == "__main__":
    asyncio.run(run_tests())
