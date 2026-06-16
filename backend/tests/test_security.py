"""
Tests unitarios — Módulo de Seguridad (hashing y JWT).
TC-28 a TC-32 del Plan de Pruebas StockSync v1.0.
"""

import pytest
from fastapi import HTTPException

from app.core.security import (
    create_access_token,
    decode_token,
    hash_password,
    verify_password,
)


# ---------------------------------------------------------------------------
# TC-28 — REQ-F05 — Caja Blanca / Sentencia bcrypt
# hash_password devuelve hash bcrypt distinto al texto plano
# ---------------------------------------------------------------------------
def test_tc28_hash_password_produce_hash_bcrypt():
    plain = "micontrasena123"
    hashed = hash_password(plain)
    assert hashed != plain
    assert hashed.startswith("$2")


# ---------------------------------------------------------------------------
# TC-29 — REQ-F05 — Caja Blanca / Rama (correcto)
# verify_password con la contraseña correcta → True
# ---------------------------------------------------------------------------
def test_tc29_verify_password_correcto():
    plain = "micontrasena123"
    hashed = hash_password(plain)
    assert verify_password(plain, hashed) is True


# ---------------------------------------------------------------------------
# TC-30 — REQ-F05 — Caja Blanca / Rama (incorrecto)
# verify_password con contraseña incorrecta → False
# ---------------------------------------------------------------------------
def test_tc30_verify_password_incorrecto():
    hashed = hash_password("correcta")
    assert verify_password("incorrecta", hashed) is False


# ---------------------------------------------------------------------------
# TC-31 — REQ-F05 — Caja Blanca / Sentencia JWT
# create_access_token y decode retornan payload con 'sub' y 'exp'
# ---------------------------------------------------------------------------
def test_tc31_create_y_decode_access_token():
    token = create_access_token(subject=42)
    payload = decode_token(token)
    assert payload["sub"] == "42"
    assert "exp" in payload


# ---------------------------------------------------------------------------
# TC-32 — REQ-F05 — Caja Blanca / Rama (JWTError)
# decode_token con token inválido → HTTPException 401
# ---------------------------------------------------------------------------
def test_tc32_decode_token_invalido():
    with pytest.raises(HTTPException) as exc_info:
        decode_token("token.invalido.firma")
    assert exc_info.value.status_code == 401
