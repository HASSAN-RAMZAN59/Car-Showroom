from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.auth import router as auth_router
from app.api.v1.cars import router as cars_router
from app.api.v1.customers import router as customers_router
from app.api.v1.installments import router as installments_router
from app.api.v1.repairs import router as repairs_router
from app.api.v1.sales import router as sales_router
from app.api.v1.search import router as search_router
from app.api.v1.sellers import router as sellers_router
from app.api.v1.token_bookings import router as token_bookings_router
from app.core.config import settings
from app.core.database import Base, engine


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager to handle application startup and shutdown events."""
    # Startup: ensure database tables are created
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
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


@app.get("/", tags=["Health"])
async def root():
    """Root health check endpoint."""
    return {
        "system": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "status": "online",
        "docs": "/docs",
    }
