import pytest
from fastapi import HTTPException

from app.services.stock_service import stock_service
from app.models.user import User
from app.models.supplier import Supplier
from app.models.product import Product, ProductVariant
from app.models.stock import MovementType, PurchaseOrderStatus
from app.schemas.stock import StockAdjustmentRequest, SaleCreate, SupplierCreate, PurchaseOrderCreate

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
    