"""Endpoints de Stock, Kardex, Ventas, Compras y Proveedores."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user, require_admin
from app.schemas.stock import (
    PurchaseOrderCreate,
    PurchaseOrderResponse,
    SaleCreate,
    SaleResponse,
    StockAdjustmentRequest,
    StockMovementResponse,
    StockSummary,
    SupplierCreate,
    SupplierResponse,
)
from app.services.stock_service import stock_service

router = APIRouter()


# ---------------------------------------------------------------------------
# Stock queries
# ---------------------------------------------------------------------------

@router.get("/summary/{variant_id}", response_model=StockSummary)
def get_stock_summary(
    variant_id: int,
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    """Consulta stock actual calculado desde Kardex."""
    return stock_service.get_stock_summary(db, variant_id)


@router.get("/movements/{variant_id}", response_model=list[StockMovementResponse])
def get_movements(
    variant_id: int,
    limit: int = 100,
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    """REQ-F02: Historial completo del Kardex de una variante."""
    return stock_service.get_movements(db, variant_id, limit)


@router.get("/alerts/low-stock", response_model=list[StockSummary])
def get_low_stock_alerts(
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    """REQ-F04: Variantes que alcanzaron el punto de reorden."""
    return stock_service.get_low_stock_alerts(db)


# ---------------------------------------------------------------------------
# Stock adjustment (Admin only)
# ---------------------------------------------------------------------------

@router.post("/adjust", response_model=StockMovementResponse, status_code=201)
def adjust_stock(
    data: StockAdjustmentRequest,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):
    """REQ-F05: Ajuste de inventario — solo Admin."""
    return stock_service.adjust_stock(db, data, current_user)


# ---------------------------------------------------------------------------
# Sales
# ---------------------------------------------------------------------------

@router.post("/sales", response_model=SaleResponse, status_code=201)
def create_sale(
    data: SaleCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """REQ-F03: Registra una venta validando stock disponible de forma atómica."""
    return stock_service.create_sale(db, data, current_user)


# ---------------------------------------------------------------------------
# Purchase Orders
# ---------------------------------------------------------------------------

@router.post("/purchases", response_model=PurchaseOrderResponse, status_code=201)
def create_purchase_order(
    data: PurchaseOrderCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return stock_service.create_purchase_order(db, data, current_user)


@router.post("/purchases/{order_id}/receive", response_model=PurchaseOrderResponse)
def receive_purchase_order(
    order_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):
    """Confirma recepción de mercadería y actualiza el Kardex."""
    return stock_service.receive_purchase_order(db, order_id, current_user)


# ---------------------------------------------------------------------------
# Suppliers
# ---------------------------------------------------------------------------

@router.get("/suppliers", response_model=list[SupplierResponse])
def list_suppliers(db: Session = Depends(get_db), _=Depends(get_current_user)):
    return stock_service.get_suppliers(db)


@router.post("/suppliers", response_model=SupplierResponse, status_code=201)
def create_supplier(
    data: SupplierCreate,
    db: Session = Depends(get_db),
    _=Depends(require_admin),
):
    return stock_service.create_supplier(db, data)
