"""
REQ-F02 / REQ-F03 / REQ-F04: Kardex inmutable y órdenes de compra.

El stock nunca se edita directamente. Se calcula como la sumatoria
de todos los movimientos (StockMovement) asociados a una variante.
"""

import enum
from datetime import datetime

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
)
from sqlalchemy.orm import relationship

from app.core.database import Base


class MovementType(enum.StrEnum):
    PURCHASE = "PURCHASE"       # Ingreso por compra
    SALE = "SALE"               # Egreso por venta
    ADJUSTMENT_IN = "ADJUSTMENT_IN"    # Ajuste positivo (solo Admin)
    ADJUSTMENT_OUT = "ADJUSTMENT_OUT"  # Ajuste negativo / merma (solo Admin)
    RETURN_IN = "RETURN_IN"     # Devolución de cliente
    RETURN_OUT = "RETURN_OUT"   # Devolución a proveedor


class StockMovement(Base):
    """
    Kardex transaccional INMUTABLE.
    Cada entrada, salida o ajuste genera un nuevo registro.
    Nunca se hace UPDATE ni DELETE sobre esta tabla.
    """

    __tablename__ = "stock_movements"

    id = Column(Integer, primary_key=True, index=True)
    variant_id = Column(
        Integer, ForeignKey("product_variants.id"), nullable=False, index=True
    )
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    movement_type = Column(Enum(MovementType), nullable=False)

    # Positivo = ingreso, Negativo = egreso
    quantity = Column(Integer, nullable=False)
    unit_cost = Column(Numeric(10, 2), nullable=True)

    # Referencia al documento origen (orden de compra, venta, etc.)
    reference_type = Column(String(50), nullable=True)  # "PURCHASE_ORDER", "SALE", etc.
    reference_id = Column(Integer, nullable=True)

    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    variant = relationship("ProductVariant", back_populates="stock_movements")
    user = relationship("User", back_populates="stock_movements")

    def __repr__(self) -> str:
        return (
            f"<StockMovement id={self.id} variant={self.variant_id} "
            f"type={self.movement_type} qty={self.quantity}>"
        )


class PurchaseOrderStatus(enum.StrEnum):
    PENDING = "PENDING"
    CONFIRMED = "CONFIRMED"
    RECEIVED = "RECEIVED"
    CANCELLED = "CANCELLED"


class PurchaseOrder(Base):
    """Orden de compra a proveedor. Al confirmar recepción genera movimientos de entrada."""

    __tablename__ = "purchase_orders"

    id = Column(Integer, primary_key=True, index=True)
    supplier_id = Column(Integer, ForeignKey("suppliers.id"), nullable=False)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    status = Column(
        Enum(PurchaseOrderStatus),
        default=PurchaseOrderStatus.PENDING,
        nullable=False,
    )
    notes = Column(Text, nullable=True)
    received_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    supplier = relationship("Supplier", back_populates="purchase_orders")
    created_by_user = relationship("User", back_populates="purchase_orders")
    items = relationship(
        "PurchaseOrderItem", back_populates="purchase_order", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<PurchaseOrder id={self.id} status={self.status}>"


class PurchaseOrderItem(Base):
    """Ítem de una orden de compra."""

    __tablename__ = "purchase_order_items"

    id = Column(Integer, primary_key=True, index=True)
    purchase_order_id = Column(
        Integer, ForeignKey("purchase_orders.id"), nullable=False
    )
    variant_id = Column(Integer, ForeignKey("product_variants.id"), nullable=False)
    quantity = Column(Integer, nullable=False)
    unit_cost = Column(Numeric(10, 2), nullable=False)

    purchase_order = relationship("PurchaseOrder", back_populates="items")
    variant = relationship("ProductVariant", back_populates="purchase_order_items")

    def __repr__(self) -> str:
        return f"<PurchaseOrderItem id={self.id} variant={self.variant_id} qty={self.quantity}>"


class Sale(Base):
    """
    REQ-F03: Registro de venta. Al crear una Sale se valida stock disponible
    y se genera el StockMovement de egreso de forma atómica.
    """

    __tablename__ = "sales"

    id = Column(Integer, primary_key=True, index=True)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    client_id = Column(Integer, ForeignKey("clients.id"), nullable=True, index=True)
    notes = Column(Text, nullable=True)
    is_cancelled = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    created_by_user = relationship("User")
    client = relationship("Client", back_populates="sales")
    items = relationship(
        "SaleItem", back_populates="sale", cascade="all, delete-orphan"
    )

    @property
    def client_name(self) -> str | None:
        return self.client.full_name if self.client else None

    def __repr__(self) -> str:
        return f"<Sale id={self.id} cancelled={self.is_cancelled}>"


class SaleItem(Base):
    """Ítem de una venta."""

    __tablename__ = "sale_items"

    id = Column(Integer, primary_key=True, index=True)
    sale_id = Column(Integer, ForeignKey("sales.id"), nullable=False)
    variant_id = Column(Integer, ForeignKey("product_variants.id"), nullable=False)
    quantity = Column(Integer, nullable=False)
    unit_price = Column(Numeric(10, 2), nullable=False)

    sale = relationship("Sale", back_populates="items")
    variant = relationship("ProductVariant")

    def __repr__(self) -> str:
        return f"<SaleItem id={self.id} variant={self.variant_id} qty={self.quantity}>"
