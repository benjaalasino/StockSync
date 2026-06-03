"""
Tests de integración de API — Módulo de Autenticación.
TC-01 a TC-05 del Plan de Pruebas StockSync v1.0.
"""

from app.schemas.user import UserCreate
from app.services.auth_service import auth_service


def _create_admin(db, client):
    auth_service.create_user(
        db,
        UserCreate(
            full_name="Admin User",
            email="admin@test.com",
            password="adminpass123",
            role="admin",
        ),
    )


# ---------------------------------------------------------------------------
# TC-01 — REQ-F05 — Caja Negra / Partición de equivalencia
# Login con credenciales correctas → HTTP 200 + access_token
# ---------------------------------------------------------------------------
def test_tc01_login_credenciales_correctas(client, db):
    _create_admin(db, client)
    resp = client.post(
        "/api/v1/auth/login",
        data={"username": "admin@test.com", "password": "adminpass123"},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert "access_token" in body
    assert body["token_type"] == "bearer"


# ---------------------------------------------------------------------------
# TC-02 — REQ-F05 — Caja Negra / Partición de equivalencia
# Login con contraseña incorrecta → HTTP 401 + mensaje 'incorrectos'
# ---------------------------------------------------------------------------
def test_tc02_login_password_incorrecto(client, db):
    _create_admin(db, client)
    resp = client.post(
        "/api/v1/auth/login",
        data={"username": "admin@test.com", "password": "WRONGPASSWORD"},
    )
    assert resp.status_code == 401
    assert "incorrectos" in resp.json()["detail"]


# ---------------------------------------------------------------------------
# TC-03 — REQ-F05 — Caja Negra / Partición de equivalencia
# Login con email inexistente → HTTP 401
# ---------------------------------------------------------------------------
def test_tc03_login_usuario_inexistente(client, db):
    resp = client.post(
        "/api/v1/auth/login",
        data={"username": "nadie@test.com", "password": "cualquiera"},
    )
    assert resp.status_code == 401


# ---------------------------------------------------------------------------
# TC-04 — REQ-F05 — Caja Negra
# GET /auth/me sin header Authorization → HTTP 401
# ---------------------------------------------------------------------------
def test_tc04_get_me_sin_token(client):
    resp = client.get("/api/v1/auth/me")
    assert resp.status_code == 401


# ---------------------------------------------------------------------------
# TC-05 — REQ-F05 — Caja Negra
# GET /auth/me con Bearer token válido → HTTP 200 + email + role
# ---------------------------------------------------------------------------
def test_tc05_get_me_con_token_valido(client, db):
    _create_admin(db, client)
    login = client.post(
        "/api/v1/auth/login",
        data={"username": "admin@test.com", "password": "adminpass123"},
    )
    token = login.json()["access_token"]

    resp = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["email"] == "admin@test.com"
    assert body["role"] == "admin"
