import logging
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import get_password_hash
from app.models.user import User, UserRole

logger = logging.getLogger(__name__)

DEFAULT_USERS = [
    {
        "email": "admin@showroom.com",
        "password": "AdminPassword123!",
        "role": UserRole.ADMIN,
        "full_name": "System Admin",
        "phone": "0300-1111111",
    },
    {
        "email": "manager@showroom.com",
        "password": "ManagerPassword123!",
        "role": UserRole.MANAGER,
        "full_name": "Showroom Manager",
        "phone": "0300-2222222",
    },
    {
        "email": "staff@showroom.com",
        "password": "StaffPassword123!",
        "role": UserRole.EMPLOYEE,
        "full_name": "Showroom Staff",
        "phone": "0300-3333333",
    },
]


async def seed_default_users(db: AsyncSession) -> None:
    """Seed default system accounts idempotently into the live database if they do not exist."""
    for user_data in DEFAULT_USERS:
        result = await db.execute(select(User).where(User.email == user_data["email"]))
        existing_user = result.scalars().first()

        if not existing_user:
            hashed_pwd = get_password_hash(user_data["password"])
            db_user = User(
                email=user_data["email"],
                full_name=user_data["full_name"],
                hashed_password=hashed_pwd,
                phone=user_data["phone"],
                role=user_data["role"],
                is_active=True,
            )
            db.add(db_user)
            logger.info(f"Seeded default user: {user_data['email']} ({user_data['role'].value})")

    await db.commit()
