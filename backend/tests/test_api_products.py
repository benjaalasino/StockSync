"""Tests de integración para los endpoints de Products."""


def test_list_products_authenticated(client, admin_token, product_with_variant):
    res = client.get(
        "/api/v1/products/",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data, list)
    assert len(data) == 1
    assert data[0]["base_sku"] == "REM-TEST"


def test_list_products_unauthenticated(client):
    res = client.get("/api/v1/products/")
    assert res.status_code == 401


def test_get_product_by_id(client, admin_token, product_with_variant):
    product, variant = product_with_variant
    res = client.get(
        f"/api/v1/products/{product.id}",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert res.status_code == 200
    data = res.json()
    assert data["id"] == product.id
    assert len(data["variants"]) == 1
    assert data["variants"][0]["current_stock"] == 0


def test_get_product_with_stock(client, admin_token, variant_with_stock, product_with_variant):
    product, _ = product_with_variant
    res = client.get(
        f"/api/v1/products/{product.id}",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert res.status_code == 200
    assert res.json()["variants"][0]["current_stock"] == 20


def test_get_product_not_found(client, admin_token):
    res = client.get(
        "/api/v1/products/9999",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert res.status_code == 404


def test_create_product_as_admin(client, admin_token):
    res = client.post(
        "/api/v1/products/",
        json={"name": "Pantalón", "base_sku": "PANT-001"},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert res.status_code == 201
    data = res.json()
    assert data["base_sku"] == "PANT-001"
    assert data["variants"] == []


def test_create_product_as_operator_forbidden(client, operator_token):
    res = client.post(
        "/api/v1/products/",
        json={"name": "No permitido", "base_sku": "NOPE-001"},
        headers={"Authorization": f"Bearer {operator_token}"},
    )
    assert res.status_code == 403


def test_create_product_duplicate_sku(client, admin_token, product_with_variant):
    res = client.post(
        "/api/v1/products/",
        json={"name": "Duplicado", "base_sku": "REM-TEST"},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert res.status_code == 400


def test_update_product_as_admin(client, admin_token, product_with_variant):
    product, _ = product_with_variant
    res = client.patch(
        f"/api/v1/products/{product.id}",
        json={"name": "Remera Actualizada"},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert res.status_code == 200
    assert res.json()["name"] == "Remera Actualizada"


def test_delete_product_logical(client, admin_token, product_with_variant):
    product, _ = product_with_variant
    res = client.delete(
        f"/api/v1/products/{product.id}",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert res.status_code == 204

    # Verificar que no aparece en el listado (eliminación lógica)
    list_res = client.get(
        "/api/v1/products/",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert all(p["id"] != product.id for p in list_res.json())


def test_list_categories(client, admin_token):
    res = client.get(
        "/api/v1/products/categories",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert res.status_code == 200
    assert isinstance(res.json(), list)


def test_create_category_as_admin(client, admin_token):
    res = client.post(
        "/api/v1/products/categories",
        json={"name": "Remeras", "description": "Ropa superior"},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert res.status_code == 201
    assert res.json()["name"] == "Remeras"


def test_create_category_duplicate_forbidden(client, admin_token):
    client.post(
        "/api/v1/products/categories",
        json={"name": "Remeras"},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    res = client.post(
        "/api/v1/products/categories",
        json={"name": "Remeras"},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert res.status_code == 400
