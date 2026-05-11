"""Schemas de Stock, Ventas y Compras."""

from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, field_validator

from app.models.stock import MovementType, PurchaseOrderStatus


# ---------------------------------------------------------------------------
# Stock Movement (Kardex)
# ---------------------------------------------------------------------------

class StockMovementResponse(BaseModel):
    id: int
    variant_id: int
    user_id: int
    movement_type: MovementType
    quantity: int
    unit_cost: Decimal | None
    reference_type: str | None
    reference_id: int | None
    notes: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


class StockAdjustmentRequest(BaseModel):
    """REQ-F05: Solo Admin puede ajustar stock directamente."""
    variant_id: int
    quantity: int  # Positivo = entrada, Negativo = salida/merma
    notes: str


class StockSummary(BaseModel):
    """Estado actual de stock de una variante (calculado desde Kardex)."""
    variant_id: int
    variant_sku: str
    current_stock: int
    reorder_point: int
    below_reorder: bool  # REQ-F04


# ---------------------------------------------------------------------------
# Sale (Venta)
# ---------------------------------------------------------------------------

class SaleItemCreate(BaseModel):
    variant_id: int
    quantity: int

    @field_validator("quantity")
    @classmethod
    def quantity_must_be_positive(cls, v: int) -> int:
        if v <= 0:
            raise ValueError("La cantidad debe ser mayor a 0")
        return v


class SaleCreate(BaseModel):
    items: list[SaleItemCreate]
    notes: str | None = None


class SaleItemResponse(BaseModel):
    id: int
    variant_id: int
    quantity: int
    unit_price: Decimal

    model_config = {"from_attributes": True}


class SaleResponse(BaseModel):
    id: int
    created_by: int
    notes: str | None
    is_cancelled: bool
    created_at: datetime
    items: list[SaleItemResponse]

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Purchase Order (Compra)
# ---------------------------------------------------------------------------

class PurchaseOrderItemCreate(BaseModel):
    variant_id: int
    quantity: int
    unit_cost: Decimal


class PurchaseOrderCreate(BaseModel):
    supplier_id: int
    items: list[PurchaseOrderItemCreate]
    notes: str | None = None


class PurchaseOrderItemResponse(BaseModel):
    id: int
    variant_id: int
    quantity: int
    unit_cost: Decimal

    model_config = {"from_attributes": True}


class PurchaseOrderResponse(BaseModel):
    id: int
    supplier_id: int
    created_by: int
    status: PurchaseOrderStatus
    notes: str | None
    received_at: datetime | None
    created_at: datetime
    items: list[PurchaseOrderItemResponse]

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Supplier
# ---------------------------------------------------------------------------

class SupplierCreate(BaseModel):
    name: str
    contact_name: str | None = None
    email: str | None = None
    phone: str | None = None
    address: str | None = None
    notes: str | None = None


class SupplierResponse(BaseModel):
    id: int
    name: str
    contact_name: str | None
    email: str | None
    phone: str | None
    is_active: bool

    model_config = {"from_attributes": True}
