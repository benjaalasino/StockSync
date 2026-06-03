"""
Tests de integración de API — Módulo de Productos.
TC-07 a TC-11 del Plan de Pruebas StockSync v1.0.
"""

_PRODUCT_PAYLOAD = {
    "name": "Pantalón Cargo",
    "base_sku": "PANT-CARGO",
    "description": "Pantalón de trabajo resistente",
}


# ---------------------------------------------------------------------------
# TC-07 — REQ-F01 — Caja Negra
# POST /products/ como Admin con datos válidos → HTTP 201, is_active=True
# ---------------------------------------------------------------------------
def test_tc07_crear_producto_admin(client, admin_token):
    resp = client.post(
        "/api/v1/products/",
        json=_PRODUCT_PAYLOAD,
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert resp.status_code == 201
    body = resp.json()
    assert body["is_active"] is True
    assert body["base_sku"] == "PANT-CARGO"


# ---------------------------------------------------------------------------
# TC-08 — REQ-F01 — Caja Negra / Partición de equivalencia
# POST /products/ con base_sku duplicado → HTTP 400, detalle menciona 'SKU'
# ---------------------------------------------------------------------------
def test_tc08_crear_producto_sku_duplicado(client, admin_token):
    client.post(
        "/api/v1/products/",
        json=_PRODUCT_PAYLOAD,
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    resp = client.post(
        "/api/v1/products/",
        json=_PRODUCT_PAYLOAD,
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert resp.status_code == 400
    assert "SKU" in resp.json()["detail"]


# ---------------------------------------------------------------------------
# TC-09 — REQ-F05 — Caja Negra / RBAC
# POST /products/ con token de operator → HTTP 403 Forbidden
# ---------------------------------------------------------------------------
def test_tc09_crear_producto_rol_operator(client, operator_token):
    resp = client.post(
        "/api/v1/products/",
        json=_PRODUCT_PAYLOAD,
        headers={"Authorization": f"Bearer {operator_token}"},
    )
    assert resp.status_code == 403


# ---------------------------------------------------------------------------
# TC-10 — REQ-F01 — Caja Negra
# GET /products/99999 → HTTP 404
# ---------------------------------------------------------------------------
def test_tc10_obtener_producto_inexistente(client, admin_token):
    resp = client.get(
        "/api/v1/products/99999",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert resp.status_code == 404


# ---------------------------------------------------------------------------
# TC-11 — REQ-F05 — Caja Negra / Eliminación lógica
# DELETE /products/{id} como Admin → HTTP 204
# Luego GET /products/ → producto ausente del listado (no DELETE físico)
# ---------------------------------------------------------------------------
def test_tc11_eliminar_producto_logico(client, admin_token):
    create_resp = client.post(
        "/api/v1/products/",
        json=_PRODUCT_PAYLOAD,
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    product_id = create_resp.json()["id"]

    del_resp = client.delete(
        f"/api/v1/products/{product_id}",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert del_resp.status_code == 204

    list_resp = client.get(
        "/api/v1/products/",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert list_resp.status_code == 200
    active_ids = [p["id"] for p in list_resp.json()]
    assert product_id not in active_ids
