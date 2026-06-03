import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.database import Base, get_db
from app.main import app
from app.schemas.user import UserCreate
from app.services.auth_service import auth_service

SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)

@event.listens_for(engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.close()

TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="function")
def db():
    Base.metadata.create_all(bind=engine)
    db_session = TestingSessionLocal()
    try:
        yield db_session
    finally:
        db_session.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def client(db):
    def override_get_db():
        yield db

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture(scope="function")
def admin_token(client, db):
    auth_service.create_user(
        db,
        UserCreate(
            full_name="Admin Test",
            email="admin@test.com",
            password="adminpass123",
            role="admin",
        ),
    )
    resp = client.post(
        "/api/v1/auth/login",
        data={"username": "admin@test.com", "password": "adminpass123"},
    )
    return resp.json()["access_token"]


@pytest.fixture(scope="function")
def operator_token(client, db):
    auth_service.create_user(
        db,
        UserCreate(
            full_name="Operator Test",
            email="operator@test.com",
            password="operatorpass123",
            role="operator",
        ),
    )
    resp = client.post(
        "/api/v1/auth/login",
        data={"username": "operator@test.com", "password": "operatorpass123"},
    )
    return resp.json()["access_token"]
