import uuid
from datetime import datetime, timezone
from typing import TYPE_CHECKING, List, Optional

from sqlalchemy import DateTime, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.car import Car


class Seller(Base):
    """SQLAlchemy model for Car Sellers / Previous Owners."""
    
    __tablename__ = "sellers"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        index=True,
    )
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    cnic: Mapped[str] = mapped_column(
        String(50), unique=True, index=True, nullable=False
    )
    phone: Mapped[str] = mapped_column(String(50), nullable=False)
    address: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    cnic_front_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    cnic_back_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationship to vehicles purchased from this seller
    cars: Mapped[List["Car"]] = relationship(
        "Car",
        back_populates="seller",
        cascade="all, delete-orphan",
    )
