"""Tests de integración para los endpoints de Stock, Ventas y Compras."""


def test_get_stock_summary(client, admin_token, variant_with_stock, product_with_variant):
    _, variant = product_with_variant
    res = client.get(
        f"/api/v1/stock/summary/{variant.id}",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert res.status_code == 200
    data = res.json()
    assert data["current_stock"] == 20
    assert data["variant_sku"] == "REM-TEST-S-ROJO"


def test_get_stock_summary_not_found(client, admin_token):
    res = client.get(
        "/api/v1/stock/summary/9999",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert res.status_code == 404


def test_get_movements_paginated(client, admin_token, variant_with_stock, product_with_variant):
    _, variant = product_with_variant
    res = client.get(
        f"/api/v1/stock/movements/{variant.id}?limit=10&offset=0",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert res.status_code == 200
    data = res.json()
    assert len(data) == 1
    assert data[0]["quantity"] == 20


def test_adjust_stock_as_admin(client, admin_token, product_with_variant):
    _, variant = product_with_variant
    res = client.post(
        "/api/v1/stock/adjust",
        json={"variant_id": variant.id, "quantity": 10, "notes": "Ajuste de prueba"},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert res.status_code == 201
    assert res.json()["quantity"] == 10
    assert res.json()["movement_type"] == "ADJUSTMENT_IN"


def test_adjust_stock_negative_as_admin(client, admin_token, variant_with_stock, product_with_variant):
    _, variant = product_with_variant
    res = client.post(
        "/api/v1/stock/adjust",
        json={"variant_id": variant.id, "quantity": -5, "notes": "Merma"},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert res.status_code == 201
    assert res.json()["movement_type"] == "ADJUSTMENT_OUT"


def test_adjust_stock_as_operator_forbidden(client, operator_token, product_with_variant):
    _, variant = product_with_variant
    res = client.post(
        "/api/v1/stock/adjust",
        json={"variant_id": variant.id, "quantity": 5, "notes": "No permitido"},
        headers={"Authorization": f"Bearer {operator_token}"},
    )
    assert res.status_code == 403


def test_low_stock_alerts(client, admin_token, product_with_variant):
    # reorder_point=5, stock=0 → debe aparecer en alertas
    _, variant = product_with_variant
    res = client.get(
        "/api/v1/stock/alerts/low-stock",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert res.status_code == 200
    alerts = res.json()
    assert any(a["variant_id"] == variant.id for a in alerts)


def test_low_stock_no_alerts_when_stock_sufficient(client, admin_token, variant_with_stock, product_with_variant):
    # reorder_point=5, stock=20 → no debe aparecer en alertas
    _, variant = product_with_variant
    res = client.get(
        "/api/v1/stock/alerts/low-stock",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert res.status_code == 200
    alerts = res.json()
    assert not any(a["variant_id"] == variant.id for a in alerts)


# ─── Ventas ──────────────────────────────────────────────────────────────────

def test_create_sale_success(client, admin_token, variant_with_stock, product_with_variant):
    _, variant = product_with_variant
    res = client.post(
        "/api/v1/stock/sales",
        json={"items": [{"variant_id": variant.id, "quantity": 3}]},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert res.status_code == 201
    data = res.json()
    assert data["id"] is not None
    assert len(data["items"]) == 1
    assert data["items"][0]["quantity"] == 3


def test_create_sale_insufficient_stock(client, admin_token, product_with_variant):
    # stock = 0, intentamos vender 5
    _, variant = product_with_variant
    res = client.post(
        "/api/v1/stock/sales",
        json={"items": [{"variant_id": variant.id, "quantity": 5}]},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert res.status_code == 409
    assert "Stock insuficiente" in res.json()["detail"]


def test_create_sale_zero_quantity_rejected(client, admin_token, variant_with_stock, product_with_variant):
    _, variant = product_with_variant
    res = client.post(
        "/api/v1/stock/sales",
        json={"items": [{"variant_id": variant.id, "quantity": 0}]},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert res.status_code == 422


def test_create_sale_stock_decreases(client, admin_token, variant_with_stock, product_with_variant):
    product, variant = product_with_variant
    client.post(
        "/api/v1/stock/sales",
        json={"items": [{"variant_id": variant.id, "quantity": 7}]},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    summary = client.get(
        f"/api/v1/stock/summary/{variant.id}",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert summary.json()["current_stock"] == 13  # 20 - 7


# ─── Órdenes de compra ────────────────────────────────────────────────────────

def test_create_purchase_order(client, admin_token, supplier, product_with_variant):
    _, variant = product_with_variant
    res = client.post(
        "/api/v1/stock/purchases",
        json={
            "supplier_id": supplier.id,
            "items": [{"variant_id": variant.id, "quantity": 50, "unit_cost": "45.00"}],
        },
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert res.status_code == 201
    data = res.json()
    assert data["status"] == "PENDING"
    assert data["supplier_id"] == supplier.id


def test_receive_purchase_order_updates_stock(client, admin_token, supplier, product_with_variant):
    _, variant = product_with_variant
    create_res = client.post(
        "/api/v1/stock/purchases",
        json={
            "supplier_id": supplier.id,
            "items": [{"variant_id": variant.id, "quantity": 30, "unit_cost": "40.00"}],
        },
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    order_id = create_res.json()["id"]

    receive_res = client.post(
        f"/api/v1/stock/purchases/{order_id}/receive",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert receive_res.status_code == 200
    assert receive_res.json()["status"] == "RECEIVED"

    summary = client.get(
        f"/api/v1/stock/summary/{variant.id}",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert summary.json()["current_stock"] == 30


def test_receive_purchase_order_double_receive_rejected(client, admin_token, supplier, product_with_variant):
    _, variant = product_with_variant
    create_res = client.post(
        "/api/v1/stock/purchases",
        json={
            "supplier_id": supplier.id,
            "items": [{"variant_id": variant.id, "quantity": 10, "unit_cost": "30.00"}],
        },
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    order_id = create_res.json()["id"]

    client.post(
        f"/api/v1/stock/purchases/{order_id}/receive",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    # Segunda recepción debe fallar
    second_res = client.post(
        f"/api/v1/stock/purchases/{order_id}/receive",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert second_res.status_code == 400


# ─── Proveedores ──────────────────────────────────────────────────────────────

def test_list_suppliers(client, admin_token, supplier):
    res = client.get(
        "/api/v1/stock/suppliers",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert res.status_code == 200
    data = res.json()
    assert any(s["name"] == "Proveedor Test" for s in data)


def test_create_supplier_as_admin(client, admin_token):
    res = client.post(
        "/api/v1/stock/suppliers",
        json={"name": "Nuevo Proveedor", "email": "nuevo@prov.com"},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert res.status_code == 201
    assert res.json()["name"] == "Nuevo Proveedor"


def test_create_supplier_as_operator_forbidden(client, operator_token):
    res = client.post(
        "/api/v1/stock/suppliers",
        json={"name": "No permitido"},
        headers={"Authorization": f"Bearer {operator_token}"},
    )
    assert res.status_code == 403
