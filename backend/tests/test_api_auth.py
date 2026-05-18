"""Tests de integración para los endpoints de Auth."""


def test_login_success(client, admin_user):
    res = client.post(
        "/api/v1/auth/login",
        data={"username": "admin@test.com", "password": "Admin1234"},
    )
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


def test_login_wrong_password(client, admin_user):
    res = client.post(
        "/api/v1/auth/login",
        data={"username": "admin@test.com", "password": "wrong"},
    )
    assert res.status_code == 401


def test_login_unknown_email(client):
    res = client.post(
        "/api/v1/auth/login",
        data={"username": "noexiste@test.com", "password": "Admin1234"},
    )
    assert res.status_code == 401


def test_me_authenticated(client, admin_token, admin_user):
    res = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert res.status_code == 200
    data = res.json()
    assert data["email"] == "admin@test.com"
    assert data["role"] == "admin"


def test_me_without_token(client):
    res = client.get("/api/v1/auth/me")
    assert res.status_code == 401


def test_me_invalid_token(client):
    res = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": "Bearer token.invalido.123"},
    )
    assert res.status_code == 401


def test_create_user_as_admin(client, admin_token):
    res = client.post(
        "/api/v1/users/",
        json={
            "full_name": "Nuevo Operador",
            "email": "operador@nuevo.com",
            "password": "Operador1234",
            "role": "operator",
        },
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert res.status_code == 201
    assert res.json()["email"] == "operador@nuevo.com"


def test_create_user_as_operator_forbidden(client, operator_token):
    res = client.post(
        "/api/v1/users/",
        json={
            "full_name": "Intento",
            "email": "intento@test.com",
            "password": "Intento1234",
            "role": "operator",
        },
        headers={"Authorization": f"Bearer {operator_token}"},
    )
    assert res.status_code == 403


def test_create_user_weak_password(client, admin_token):
    res = client.post(
        "/api/v1/users/",
        json={
            "full_name": "Débil",
            "email": "debil@test.com",
            "password": "abc",
            "role": "operator",
        },
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert res.status_code == 422


def test_create_user_duplicate_email(client, admin_token, admin_user):
    res = client.post(
        "/api/v1/users/",
        json={
            "full_name": "Duplicado",
            "email": "admin@test.com",
            "password": "Admin1234",
            "role": "operator",
        },
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert res.status_code == 400
