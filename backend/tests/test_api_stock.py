"""
Tests de integración de API — Módulo de Stock/Ventas.
TC-22, TC-24 del Plan de Pruebas StockSync v1.0.
"""

from app.models.product import Product, ProductVariant
from app.schemas.stock import StockAdjustmentRequest
from app.services.stock_service import stock_service


def _create_variant_with_stock(db, client, admin_token, initial_stock: int) -> int:
    product = Product(name="Producto Test", base_sku="API-TEST-001")
    db.add(product)
    db.commit()

    variant = ProductVariant(
        product_id=product.id,
        sku="API-TEST-001-A",
        sale_price=100.0,
        cost_price=60.0,
    )
    db.add(variant)
    db.commit()
    db.refresh(variant)

    from app.models.user import User
    user = db.query(User).filter(User.email == "admin@test.com").first()

    if initial_stock > 0:
        stock_service.adjust_stock(
            db,
            StockAdjustmentRequest(
                variant_id=variant.id,
                quantity=initial_stock,
                notes="Stock inicial",
            ),
            user,
        )

    return variant.id


# ---------------------------------------------------------------------------
# TC-22 — REQ-F03, REQ-F02 — Caja Negra / Partición de equivalencia
# Stock=20, POST /stock/sales con quantity=5 → HTTP 201, stock post-venta=15
# ---------------------------------------------------------------------------
def test_tc22_venta_exitosa_descuenta_stock(client, admin_token, db):
    variant_id = _create_variant_with_stock(db, client, admin_token, initial_stock=20)

    resp = client.post(
        "/api/v1/stock/sales",
        json={"items": [{"variant_id": variant_id, "quantity": 5}]},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert resp.status_code == 201

    stock_final = stock_service.get_current_stock(db, variant_id)
    assert stock_final == 15


# ---------------------------------------------------------------------------
# TC-24 — REQ-F03 — Valor límite (quantity = 0)
# POST /stock/sales con quantity=0 → HTTP 422 (validación Pydantic)
# ---------------------------------------------------------------------------
def test_tc24_venta_quantity_cero_es_invalido(client, admin_token, db):
    variant_id = _create_variant_with_stock(db, client, admin_token, initial_stock=10)

    resp = client.post(
        "/api/v1/stock/sales",
        json={"items": [{"variant_id": variant_id, "quantity": 0}]},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert resp.status_code == 422
