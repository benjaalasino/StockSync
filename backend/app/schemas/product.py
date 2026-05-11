"""Schemas de Productos, Variantes, Categorías y Atributos."""

from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel


# ---------------------------------------------------------------------------
# Category
# ---------------------------------------------------------------------------

class CategoryCreate(BaseModel):
    name: str
    description: str | None = None


class CategoryResponse(BaseModel):
    id: int
    name: str
    description: str | None
    is_active: bool

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Attribute Types & Values
# ---------------------------------------------------------------------------

class AttributeTypeCreate(BaseModel):
    name: str  # e.g. "Talle", "Color"


class AttributeTypeResponse(BaseModel):
    id: int
    name: str

    model_config = {"from_attributes": True}


class AttributeValueCreate(BaseModel):
    attribute_type_id: int
    value: str  # e.g. "S", "M", "Rojo"


class AttributeValueResponse(BaseModel):
    id: int
    attribute_type_id: int
    value: str

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Product Variant
# ---------------------------------------------------------------------------

class VariantCreate(BaseModel):
    """Se crea explícitamente o via generación automática de matriz."""
    attribute_value_ids: list[int]
    sale_price: Decimal
    cost_price: Decimal | None = None
    reorder_point: int = 5


class VariantResponse(BaseModel):
    id: int
    product_id: int
    sku: str
    sale_price: Decimal
    cost_price: Decimal | None
    reorder_point: int
    is_active: bool
    attribute_values: list[AttributeValueResponse]
    current_stock: int = 0  # Calculado desde Kardex

    model_config = {"from_attributes": True}


class VariantUpdate(BaseModel):
    sale_price: Decimal | None = None
    cost_price: Decimal | None = None
    reorder_point: int | None = None
    is_active: bool | None = None


# ---------------------------------------------------------------------------
# Product (Padre)
# ---------------------------------------------------------------------------

class ProductCreate(BaseModel):
    name: str
    description: str | None = None
    brand: str | None = None
    base_sku: str
    category_id: int | None = None


class ProductUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    brand: str | None = None
    category_id: int | None = None
    is_active: bool | None = None


class ProductResponse(BaseModel):
    id: int
    name: str
    description: str | None
    brand: str | None
    base_sku: str
    category_id: int | None
    is_active: bool
    created_at: datetime
    variants: list[VariantResponse] = []

    model_config = {"from_attributes": True}


class ProductListResponse(BaseModel):
    id: int
    name: str
    brand: str | None
    base_sku: str
    is_active: bool
    variant_count: int = 0

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Generación automática de variantes (matriz)
# REQ-F01: SKU Hijo generado automáticamente a partir de la combinación de atributos
# ---------------------------------------------------------------------------

class GenerateVariantsRequest(BaseModel):
    """
    Genera el producto cartesiano de atributos como variantes.
    Ejemplo: talles=[1,2,3] x colores=[4,5] → 6 variantes.
    """
    attribute_combinations: list[list[int]]  # lista de listas de attribute_value_ids
    base_sale_price: Decimal
    base_cost_price: Decimal | None = None
    reorder_point: int = 5
