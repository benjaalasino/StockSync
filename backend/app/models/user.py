"""
REQ-F05: Modelo de Usuario con roles RBAC (Admin / Operador).
"""

import enum
from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, Enum, Integer, String
from sqlalchemy.orm import relationship

from app.core.database import Base


class UserRole(enum.StrEnum):
    ADMIN = "admin"
    OPERATOR = "operator"


class User(Base):
    """Usuario del sistema con rol asignado."""

    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(Enum(UserRole), default=UserRole.OPERATOR, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    stock_movements = relationship("StockMovement", back_populates="user")
    purchase_orders = relationship("PurchaseOrder", back_populates="created_by_user")

    def __repr__(self) -> str:
        return f"<User id={self.id} email={self.email} role={self.role}>"

    @property
    def is_admin(self) -> bool:
        return self.role == UserRole.ADMIN
