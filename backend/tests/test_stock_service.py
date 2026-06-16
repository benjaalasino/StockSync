import pytest
from fastapi import HTTPException

from app.models.product import Product, ProductVariant
from app.models.stock import MovementType, PurchaseOrderStatus
from app.models.supplier import Supplier
from app.models.user import User
from app.schemas.stock import (
    PurchaseOrderCreate,
    SaleCreate,
    StockAdjustmentRequest,
    SupplierCreate,
)
from app.services.stock_service import stock_service

# ---------------------------------------------------------------------------
# Helpers para tests
# ---------------------------------------------------------------------------

def create_test_user(db) -> User:
    user = User(
        full_name="Admin User",
        email="admin@stock.com",
        hashed_password="hashed_pwd",
        role="admin"
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

def create_test_variant(db) -> ProductVariant:
    product = Product(name="Test Product", base_sku="TEST-001")
    db.add(product)
    db.commit()

    variant = ProductVariant(
        product_id=product.id,
        sku="TEST-001-A",
        sale_price=100.0,
        cost_price=50.0
    )
    db.add(variant)
    db.commit()
    db.refresh(variant)
    return variant

def create_test_supplier(db) -> Supplier:
    supplier = Supplier(name="Global Supplier", email="contact@global.com")
    db.add(supplier)
    db.commit()
    db.refresh(supplier)
    return supplier

# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------

def test_get_current_stock_initial(db):
    # 1. ARRANGE
    variant = create_test_variant(db)

    # 2. ACT
    stock = stock_service.get_current_stock(db, variant.id)

    # 3. ASSERT
    assert stock == 0  # El stock inicial debe ser 0 al no haber movimientos

def test_adjust_stock_success(db):
    # 1. ARRANGE
    user = create_test_user(db)
    variant = create_test_variant(db)
    adj_data = StockAdjustmentRequest(variant_id=variant.id, quantity=15, notes="Ingreso inicial")

    # 2. ACT
    movement = stock_service.adjust_stock(db, adj_data, user)

    # 3. ASSERT
    assert movement.id is not None
    assert movement.quantity == 15
    assert movement.movement_type == MovementType.ADJUSTMENT_IN

    # Verificamos que el Kardex retorne el nuevo saldo
    current_stock = stock_service.get_current_stock(db, variant.id)
    assert current_stock == 15

def test_create_sale_insufficient_stock(db):
    # 1. ARRANGE
    user = create_test_user(db)
    variant = create_test_variant(db)
    # Stock actual es 0

    sale_data = SaleCreate(**{
        "notes": "Venta que debería fallar",
        "items": [{"variant_id": variant.id, "quantity": 5}]
    })

    # 2. ACT & 3. ASSERT
    with pytest.raises(HTTPException) as exception_info:
        stock_service.create_sale(db, sale_data, user)

    assert exception_info.value.status_code == 409
    assert "Stock insuficiente" in exception_info.value.detail

def test_create_sale_success(db):
    # 1. ARRANGE
    user = create_test_user(db)
    variant = create_test_variant(db)

    # Agregamos stock de forma manual primero (usando el servicio para dejar rastro en Kardex)
    stock_service.adjust_stock(
        db,
        StockAdjustmentRequest(variant_id=variant.id, quantity=10, notes="Ingreso previo"),
        user
    )

    sale_data = SaleCreate(**{
        "notes": "Venta exitosa",
        "items": [{"variant_id": variant.id, "quantity": 3}]
    })

    # 2. ACT
    sale = stock_service.create_sale(db, sale_data, user)

    # 3. ASSERT
    assert sale.id is not None
    assert len(sale.items) == 1

    # Verificamos que el stock se haya descontado correctamente en el Kardex
    current_stock = stock_service.get_current_stock(db, variant.id)
    assert current_stock == 7  # 10 originales - 3 vendidos = 7

# ---------------------------------------------------------------------------
# Purchase Orders
# ---------------------------------------------------------------------------
def test_create_purchase_order_success(db):
    # 1. ARRANGE
    user = create_test_user(db)
    supplier = create_test_supplier(db)
    variant = create_test_variant(db)

    po_data = PurchaseOrderCreate(
        supplier_id=supplier.id,
        notes="Orden de prueba",
        items=[{"variant_id": variant.id, "quantity": 50, "unit_cost": 45.0}]
    )

    # 2. ACT
    order = stock_service.create_purchase_order(db, po_data, user)

    # 3. ASSERT
    assert order.id is not None
    assert order.status == PurchaseOrderStatus.PENDING  # Al crearse, debe estar pendiente
    assert len(order.items) == 1
    assert order.items[0].quantity == 50

def test_receive_purchase_order_success(db):
    # 1. ARRANGE
    user = create_test_user(db)
    supplier = create_test_supplier(db)
    variant = create_test_variant(db)

    # Creamos una orden de compra primero
    po_data = PurchaseOrderCreate(
        supplier_id=supplier.id,
        notes="Orden para recibir",
        items=[{"variant_id": variant.id, "quantity": 20, "unit_cost": 40.0}]
    )
    order = stock_service.create_purchase_order(db, po_data, user)

    # 2. ACT
    received_order = stock_service.receive_purchase_order(db, order.id, user)

    # 3. ASSERT
    assert received_order.id == order.id
    assert received_order.status == PurchaseOrderStatus.RECEIVED
    assert received_order.received_at is not None
    assert stock_service.get_current_stock(db, variant.id) == 20  # El stock debe reflejar la recepción de la orden

# ---------------------------------------------------------------------------
# Suppliers
# ---------------------------------------------------------------------------
def test_create_supplier(db):
    # 1. ARRANGE
    supplier_data = SupplierCreate(
        name="Test Supplier",
        email="test@supplier.com"
    )

    # 2. ACT
    supplier = stock_service.create_supplier(db, supplier_data)

    # 3. ASSERT
    assert supplier.id is not None
    assert supplier.name == "Test Supplier"
    assert supplier.email == "test@supplier.com"


# ---------------------------------------------------------------------------
# TC-16 — REQ-F02 — Caja Blanca / Sentencia (SUM)
# Múltiples movimientos: +100 PURCHASE, -30 SALE, +10 ADJ_IN → 80
# ---------------------------------------------------------------------------
def test_tc16_stock_suma_multiples_movimientos(db):
    from app.models.stock import StockMovement

    user = create_test_user(db)
    variant = create_test_variant(db)

    for qty, mtype in [
        (100, MovementType.PURCHASE),
        (-30, MovementType.SALE),
        (10, MovementType.ADJUSTMENT_IN),
    ]:
        db.add(StockMovement(
            variant_id=variant.id,
            user_id=user.id,
            movement_type=mtype,
            quantity=qty,
        ))
    db.commit()

    assert stock_service.get_current_stock(db, variant.id) == 80


# ---------------------------------------------------------------------------
# TC-17 — REQ-F02 — Caja Negra
# get_stock_summary con variante inexistente → HTTPException 404
# ---------------------------------------------------------------------------
def test_tc17_stock_summary_variante_inexistente(db):
    with pytest.raises(HTTPException) as exc_info:
        stock_service.get_stock_summary(db, variant_id=99999)
    assert exc_info.value.status_code == 404


# ---------------------------------------------------------------------------
# TC-18 — REQ-F04 — Valor límite (stock == reorder_point)
# stock=5, reorder_point=5 → variante aparece en alertas
# ---------------------------------------------------------------------------
def test_tc18_alerta_stock_igual_a_reorder_point(db):
    user = create_test_user(db)
    product = Product(name="Alerta Producto", base_sku="ALRT-001")
    db.add(product)
    db.commit()

    variant = ProductVariant(
        product_id=product.id,
        sku="ALRT-001-A",
        sale_price=50.0,
        cost_price=20.0,
        reorder_point=5,
    )
    db.add(variant)
    db.commit()
    db.refresh(variant)

    stock_service.adjust_stock(
        db,
        StockAdjustmentRequest(variant_id=variant.id, quantity=5, notes="Stock límite"),
        user,
    )

    alerts = stock_service.get_low_stock_alerts(db)
    alert_ids = [a.variant_id for a in alerts]
    assert variant.id in alert_ids


# ---------------------------------------------------------------------------
# TC-19 — REQ-F04 — Valor límite (stock == reorder_point + 1)
# stock=6, reorder_point=5 → variante NO aparece en alertas
# ---------------------------------------------------------------------------
def test_tc19_sin_alerta_stock_sobre_reorder_point(db):
    user = create_test_user(db)
    product = Product(name="Sin Alerta Producto", base_sku="NOALRT-001")
    db.add(product)
    db.commit()

    variant = ProductVariant(
        product_id=product.id,
        sku="NOALRT-001-A",
        sale_price=50.0,
        cost_price=20.0,
        reorder_point=5,
    )
    db.add(variant)
    db.commit()
    db.refresh(variant)

    stock_service.adjust_stock(
        db,
        StockAdjustmentRequest(variant_id=variant.id, quantity=6, notes="Stock sobre umbral"),
        user,
    )

    alerts = stock_service.get_low_stock_alerts(db)
    alert_ids = [a.variant_id for a in alerts]
    assert variant.id not in alert_ids


# ---------------------------------------------------------------------------
# TC-21 — REQ-F05 — Caja Blanca / Rama (qty < 0)
# adjust_stock(quantity=-5) → movement_type=ADJUSTMENT_OUT, quantity=-5
# ---------------------------------------------------------------------------
def test_tc21_ajuste_stock_negativo_genera_adjustment_out(db):
    user = create_test_user(db)
    variant = create_test_variant(db)

    stock_service.adjust_stock(
        db,
        StockAdjustmentRequest(variant_id=variant.id, quantity=20, notes="Ingreso previo"),
        user,
    )

    movement = stock_service.adjust_stock(
        db,
        StockAdjustmentRequest(variant_id=variant.id, quantity=-5, notes="Salida manual"),
        user,
    )

    assert movement.movement_type == MovementType.ADJUSTMENT_OUT
    assert movement.quantity == -5


# ---------------------------------------------------------------------------
# TC-25 — REQ-F02, REQ-F03 — Caja Blanca / Sentencia Kardex
# create_sale() genera StockMovement tipo SALE con quantity=-10
# ---------------------------------------------------------------------------
def test_tc25_venta_genera_movimiento_kardex_negativo(db):
    from app.models.stock import StockMovement

    user = create_test_user(db)
    variant = create_test_variant(db)

    stock_service.adjust_stock(
        db,
        StockAdjustmentRequest(variant_id=variant.id, quantity=50, notes="Stock inicial"),
        user,
    )

    sale_data = SaleCreate(**{
        "items": [{"variant_id": variant.id, "quantity": 10}],
        "notes": "Venta TC-25",
    })
    stock_service.create_sale(db, sale_data, user)

    movimientos = (
        db.query(StockMovement)
        .filter(
            StockMovement.variant_id == variant.id,
            StockMovement.movement_type == MovementType.SALE,
        )
        .all()
    )
    assert len(movimientos) == 1
    assert movimientos[0].quantity == -10


# ---------------------------------------------------------------------------
# TC-26 — REQ-F02 — Caja Negra / Estado inválido
# receive_purchase_order() sobre orden ya recibida → HTTPException 400
# ---------------------------------------------------------------------------
def test_tc26_recibir_orden_ya_recibida(db):
    user = create_test_user(db)
    supplier = create_test_supplier(db)
    variant = create_test_variant(db)

    po_data = PurchaseOrderCreate(
        supplier_id=supplier.id,
        notes="Orden doble recepción",
        items=[{"variant_id": variant.id, "quantity": 50, "unit_cost": 30.0}],
    )
    order = stock_service.create_purchase_order(db, po_data, user)
    stock_service.receive_purchase_order(db, order.id, user)

    with pytest.raises(HTTPException) as exc_info:
        stock_service.receive_purchase_order(db, order.id, user)
    assert exc_info.value.status_code == 400


# ---------------------------------------------------------------------------
# TC-27 — REQ-F02 — Caja Blanca / Sentencia Kardex
# receive_purchase_order() → StockMovement PURCHASE quantity=50, stock final=50
# ---------------------------------------------------------------------------
def test_tc27_recepcion_orden_genera_movimiento_purchase(db):
    from app.models.stock import StockMovement

    user = create_test_user(db)
    supplier = create_test_supplier(db)
    variant = create_test_variant(db)

    po_data = PurchaseOrderCreate(
        supplier_id=supplier.id,
        notes="Orden TC-27",
        items=[{"variant_id": variant.id, "quantity": 50, "unit_cost": 40.0}],
    )
    order = stock_service.create_purchase_order(db, po_data, user)
    stock_service.receive_purchase_order(db, order.id, user)

    movimientos = (
        db.query(StockMovement)
        .filter(
            StockMovement.variant_id == variant.id,
            StockMovement.movement_type == MovementType.PURCHASE,
        )
        .all()
    )
    assert len(movimientos) == 1
    assert movimientos[0].quantity == 50
    assert stock_service.get_current_stock(db, variant.id) == 50
