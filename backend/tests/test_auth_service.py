import pytest
from fastapi import HTTPException

from app.schemas.user import UserCreate
from app.services.auth_service import auth_service


def test_create_user_success(db):
    # 1. ARRANGE
    user_data = UserCreate(
        full_name="John Doe",
        email="john@example.com",
        password="supersecretpassword",
        role="operator"
    )

    # 2. ACT
    user = auth_service.create_user(db, user_data)

    # 3. ASSERT
    assert user.id is not None
    assert user.email == "john@example.com"
    assert user.full_name == "John Doe"
    assert user.hashed_password != "supersecretpassword"  # Ensure password was hashed!

def test_create_user_duplicate_email(db):
    # 1. ARRANGE
    user_data = UserCreate(
        full_name="Jane Doe",
        email="jane@example.com",
        password="password123",
        role="operator"
    )
    auth_service.create_user(db, user_data)  # Create the user the first time

    # 2. ACT & 3. ASSERT
    with pytest.raises(HTTPException) as exception_info:
        auth_service.create_user(db, user_data)  # Try to create it again!

    assert exception_info.value.status_code == 400
    assert exception_info.value.detail == "El email ya está registrado"
