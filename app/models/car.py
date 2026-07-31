import enum
import uuid
from datetime import datetime, timezone
from typing import TYPE_CHECKING, List, Optional

from sqlalchemy import (
    DateTime,
    Enum,
    Float,
    ForeignKey,
    Integer,
    JSON,
    String,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.repair import Repair
    from app.models.seller import Seller
    from app.models.user import User


class CarStatus(str, enum.Enum):
    AVAILABLE = "AVAILABLE"
    IN_MAINTENANCE = "IN_MAINTENANCE"
    RESERVED = "RESERVED"
    SOLD = "SOLD"


class Car(Base):
    """SQLAlchemy model for Car / Vehicle Inventory entities."""
    
    __tablename__ = "cars"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        index=True,
    )
    car_number: Mapped[str] = mapped_column(
        String(100), unique=True, index=True, nullable=False
    )
    make: Mapped[str] = mapped_column(String(100), nullable=False)
    model: Mapped[str] = mapped_column(String(100), nullable=False)
    year: Mapped[int] = mapped_column(Integer, nullable=False)
    color: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    
    engine_number: Mapped[str] = mapped_column(
        String(100), unique=True, index=True, nullable=False
    )
    chassis_number: Mapped[str] = mapped_column(
        String(100), unique=True, index=True, nullable=False
    )
    mileage: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    
    status: Mapped[CarStatus] = mapped_column(
        Enum(CarStatus, name="car_status_enum", native_enum=False),
        default=CarStatus.IN_MAINTENANCE,
        nullable=False,
    )
    
    purchase_price: Mapped[float] = mapped_column(Float, nullable=False)
    purchase_date: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    asking_price: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    
    # Foreign Keys
    seller_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("sellers.id", ondelete="RESTRICT"),
        nullable=False,
    )
    created_by_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False,
    )
    
    # Media URLs (Cloudinary)
    car_photos_urls: Mapped[List[str]] = mapped_column(
        JSON, default=list, nullable=False
    )
    registration_docs_urls: Mapped[List[str]] = mapped_column(
        JSON, default=list, nullable=False
    )
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationships
    seller: Mapped["Seller"] = relationship("Seller", back_populates="cars")
    created_by: Mapped["User"] = relationship("User")
    repairs: Mapped[List["Repair"]] = relationship(
        "Repair",
        back_populates="car",
        cascade="all, delete-orphan",
    )

    @property
    def total_repair_cost(self) -> float:
        """Calculate total refurbishment & repair cost for this vehicle."""
        if not self.repairs:
            return 0.0
        return sum(repair.cost for repair in self.repairs if repair and repair.cost)

    @property
    def total_cost_basis(self) -> float:
        """Calculate total financial cost basis (Purchase Price + Total Repair Costs)."""
        base_price = self.purchase_price if self.purchase_price else 0.0
        return base_price + self.total_repair_cost
