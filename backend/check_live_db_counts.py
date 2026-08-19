import asyncio
import httpx
from datetime import datetime

API_URL = "https://car-showroom-backend-q497.onrender.com/api/v1"

async def check_database_counts():
    print("=" * 80)
    print(" LIVE SUPABASE DATABASE RECORD COUNT AUDIT")
    print(f" Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 80)

    async with httpx.AsyncClient(base_url=API_URL, timeout=30.0) as client:
        # Admin Login
        login_res = await client.post("/auth/login", json={
            "email": "admin@showroom.com",
            "password": "AdminPassword123!"
        })
        token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # 1. Cars
        cars = (await client.get("/cars/", headers=headers)).json()
        print(f" - Vehicles Inventory: {len(cars)} Cars")

        # 2. Sellers
        sellers = (await client.get("/sellers/", headers=headers)).json()
        print(f" - Registered Sellers: {len(sellers)} Sellers")

        # 3. Customers
        customers = (await client.get("/customers/", headers=headers)).json()
        print(f" - Registered Customers: {len(customers)} Customers")

        # 4. Sales
        sales = (await client.get("/sales/", headers=headers)).json()
        print(f" - Vehicle Sales & Invoices: {len(sales)} Deals")

        # 5. Park & Sell Consignments
        consignments = (await client.get("/consignments/", headers=headers)).json()
        print(f" - Park & Sell Consignments: {len(consignments)} Agreements")

        # 6. Customer CRM Leads
        leads = (await client.get("/leads/", headers=headers)).json()
        print(f" - Customer CRM Leads: {len(leads)} Leads")

        # 7. Daily Expenses
        expenses = (await client.get("/expenses/", headers=headers)).json()
        print(f" - Daily Expenses: {len(expenses)} Expense Records")

        # 9. Investors Engine
        investors = (await client.get("/investors/", headers=headers)).json()
        print(f" - Registered Investors: {len(investors)} Investors")

        # 10. System Users
        users = (await client.get("/auth/users", headers=headers)).json()
        print(f" - Team & Staff Users: {len(users)} Users")

        # 11. System Audit Logs
        audit = (await client.get("/audit/", headers=headers)).json()
        print(f" - System Audit Logs: {len(audit)} Event Logs")

if __name__ == "__main__":
    asyncio.run(check_database_counts())
