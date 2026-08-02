from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from app.core.config import settings

# Engine configuration arguments based on database dialect
engine_kwargs = {
    "echo": False,
    "future": True,
}

if not settings.DATABASE_URL.startswith("postgresql"):
    raise ValueError("Database configuration error: System requires live PostgreSQL connection. DATABASE_URL must start with postgresql:// or postgresql+asyncpg://")

engine_kwargs["pool_pre_ping"] = True
engine_kwargs["pool_recycle"] = 300
if "sslmode=require" in settings.DATABASE_URL or "supabase" in settings.DATABASE_URL:
    engine_kwargs["connect_args"] = {"ssl": "require"}

# Create async engine
engine = create_async_engine(
    settings.DATABASE_URL,
    **engine_kwargs
)

# Async session factory
AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


class Base(DeclarativeBase):
    """Base model class for SQLAlchemy ORM models."""
    pass


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Dependency for providing database session to FastAPI endpoints."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()

