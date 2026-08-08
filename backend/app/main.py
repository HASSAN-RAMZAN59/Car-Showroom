from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.analytics import router as analytics_router
from app.api.v1.audit import router as audit_router
from app.api.v1.auth import router as auth_router
from app.api.v1.bank import router as bank_router
from app.api.v1.backup import router as backup_router
from app.api.v1.cars import router as cars_router
from app.api.v1.customers import router as customers_router
from app.api.v1.expenses import router as expenses_router
from app.api.v1.installments import router as installments_router
from app.api.v1.investors import router as investors_router
from app.api.v1.leads import router as leads_router
from app.api.v1.notifications import router as notifications_router
from app.api.v1.payroll import router as payroll_router
from app.api.v1.repairs import router as repairs_router
from app.api.v1.sales import router as sales_router
from app.api.v1.search import router as search_router
from app.api.v1.sellers import router as sellers_router
from app.api.v1.token_bookings import router as token_bookings_router
import app.models
from app.core.config import settings
from app.core.database import AsyncSessionLocal, Base, engine
from app.core.seed import seed_default_users


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager to handle application startup and shutdown events."""
    # Startup: ensure database tables are created
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    # Automatically seed default users if missing
    async with AsyncSessionLocal() as session:
        await seed_default_users(session)

    yield
    # Shutdown: dispose database engine
    await engine.dispose()


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# CORS Middleware Configuration (Allows all origins for development)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API v1 Routers
app.include_router(
    auth_router,
    prefix=f"{settings.API_V1_STR}/auth",
    tags=["Authentication"],
)
app.include_router(
    sellers_router,
    prefix=f"{settings.API_V1_STR}/sellers",
    tags=["Sellers"],
)
app.include_router(
    cars_router,
    prefix=f"{settings.API_V1_STR}/cars",
    tags=["Vehicles & Purchases"],
)
app.include_router(
    repairs_router,
    prefix=f"{settings.API_V1_STR}/repairs",
    tags=["Vehicle Repairs"],
)
app.include_router(
    search_router,
    prefix=f"{settings.API_V1_STR}/search",
    tags=["Auto-Complete Search"],
)
app.include_router(
    notifications_router,
    prefix=f"{settings.API_V1_STR}/notifications",
    tags=["Notifications & Alerts"],
)
app.include_router(
    customers_router,
    prefix=f"{settings.API_V1_STR}/customers",
    tags=["Customers"],
)
app.include_router(
    token_bookings_router,
    prefix=f"{settings.API_V1_STR}/token_bookings",
    tags=["Token Bookings"],
)
app.include_router(
    sales_router,
    prefix=f"{settings.API_V1_STR}/sales",
    tags=["Sales & Invoices"],
)
app.include_router(
    installments_router,
    prefix=f"{settings.API_V1_STR}/installments",
    tags=["Flexible Installments & EMI"],
)
app.include_router(
    bank_router,
    prefix=f"{settings.API_V1_STR}/bank",
    tags=["Multi-Bank Accounts & Split Payments"],
)
app.include_router(
    expenses_router,
    prefix=f"{settings.API_V1_STR}/expenses",
    tags=["Daily Showroom Expenses"],
)
app.include_router(
    investors_router,
    prefix=f"{settings.API_V1_STR}/investors",
    tags=["Investors & Profit Settlement"],
)
app.include_router(
    payroll_router,
    prefix=f"{settings.API_V1_STR}/payroll",
    tags=["Employees & Payroll Processing"],
)
app.include_router(
    leads_router,
    prefix=f"{settings.API_V1_STR}/leads",
    tags=["Customer CRM & Leads Management"],
)
app.include_router(
    audit_router,
    prefix=f"{settings.API_V1_STR}/audit",
    tags=["System Audit Logs"],
)
app.include_router(
    analytics_router,
    prefix=f"{settings.API_V1_STR}/analytics",
    tags=["Executive Financial Analytics"],
)
app.include_router(
    backup_router,
    prefix=f"{settings.API_V1_STR}/backup",
    tags=["Database Export & Backup"],
)


@app.get("/", tags=["Health"])
async def root():
    """Root health check endpoint."""
    return {
        "system": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "status": "online",
        "docs": "/docs",
    }
