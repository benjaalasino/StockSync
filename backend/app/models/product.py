"""
REQ-F01: Modelo de Productos con variantes (Producto Padre / SKU Hijo).
Permite combinaciones dinámicas de atributos como Talle y Color.
"""

from datetime import datetime, timezone

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Table,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import relationship

from app.core.database import Base

# Tabla de asociación entre variantes y sus valores de atributo
variant_attribute_values = Table(
    "variant_attribute_values",
    Base.metadata,
    Column("variant_id", Integer, ForeignKey("product_variants.id"), primary_key=True),
    Column(
        "attribute_value_id",
        Integer,
        ForeignKey("attribute_values.id"),
        primary_key=True,
    ),
)


class Category(Base):
    """Categoría de producto (Remeras, Pantalones, Zapatillas, etc.)."""

    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)

    products = relationship("Product", back_populates="category")

    def __repr__(self) -> str:
        return f"<Category id={self.id} name={self.name}>"


class AttributeType(Base):
    """Tipo de atributo que puede tener un producto (Talle, Color, Temporada, etc.)."""

    __tablename__ = "attribute_types"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, nullable=False)  # e.g. "Talle", "Color"

    values = relationship("AttributeValue", back_populates="attribute_type")

    def __repr__(self) -> str:
        return f"<AttributeType id={self.id} name={self.name}>"


class AttributeValue(Base):
    """Valor específico de un atributo (S, M, L / Rojo, Azul, etc.)."""

    __tablename__ = "attribute_values"
    __table_args__ = (
        UniqueConstraint("attribute_type_id", "value", name="uq_attribute_value"),
    )

    id = Column(Integer, primary_key=True, index=True)
    attribute_type_id = Column(
        Integer, ForeignKey("attribute_types.id"), nullable=False
    )
    value = Column(String(50), nullable=False)  # e.g. "S", "M", "Rojo"

    attribute_type = relationship("AttributeType", back_populates="values")
    variants = relationship(
        "ProductVariant",
        secondary=variant_attribute_values,
        back_populates="attribute_values",
    )

    def __repr__(self) -> str:
        return f"<AttributeValue id={self.id} value={self.value}>"


class Product(Base):
    """
    Producto Padre (SKU Base). Define el producto genérico.
    Genera variantes (SKU Hijo) combinando atributos.
    """

    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False, index=True)
    description = Column(Text, nullable=True)
    brand = Column(String(100), nullable=True)
    base_sku = Column(String(50), unique=True, nullable=False, index=True)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    category = relationship("Category", back_populates="products")
    variants = relationship(
        "ProductVariant", back_populates="product", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<Product id={self.id} name={self.name} sku={self.base_sku}>"


class ProductVariant(Base):
    """
    SKU Hijo — combinación única de atributos de un Producto Padre.
    El stock se calcula siempre desde el Kardex (StockMovement).
    """

    __tablename__ = "product_variants"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    sku = Column(String(80), unique=True, nullable=False, index=True)
    sale_price = Column(Numeric(10, 2), nullable=False, default=0)
    cost_price = Column(Numeric(10, 2), nullable=True)
    reorder_point = Column(Integer, default=5, nullable=False)  # REQ-F04
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    product = relationship("Product", back_populates="variants")
    attribute_values = relationship(
        "AttributeValue",
        secondary=variant_attribute_values,
        back_populates="variants",
    )
    stock_movements = relationship("StockMovement", back_populates="variant")
    purchase_order_items = relationship("PurchaseOrderItem", back_populates="variant")

    def __repr__(self) -> str:
        return f"<ProductVariant id={self.id} sku={self.sku}>"
