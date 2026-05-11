"""
Modelo de Proveedor vinculado a órdenes de compra.
"""

from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, Integer, String, Text
from sqlalchemy.orm import relationship

from app.core.database import Base


class Supplier(Base):
    """Proveedor de mercadería."""

    __tablename__ = "suppliers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    contact_name = Column(String(100), nullable=True)
    email = Column(String(255), nullable=True)
    phone = Column(String(30), nullable=True)
    address = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    purchase_orders = relationship("PurchaseOrder", back_populates="supplier")

    def __repr__(self) -> str:
        return f"<Supplier id={self.id} name={self.name}>"
