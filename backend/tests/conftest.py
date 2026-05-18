import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.database import Base, get_db
from app.core.security import create_access_token, hash_password
from app.main import app
from app.models.product import Product, ProductVariant
from app.models.stock import MovementType, StockMovement
from app.models.supplier import Supplier
from app.models.user import User, UserRole

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
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def client(db):
    """TestClient con override de la sesión de BD y rate limiting deshabilitado."""
    def override_get_db():
        try:
            yield db
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


# ─── Fixtures de datos reutilizables ────────────────────────────────────────

@pytest.fixture
def admin_user(db) -> User:
    user = User(
        full_name="Admin Test",
        email="admin@test.com",
        hashed_password=hash_password("Admin1234"),
        role=UserRole.ADMIN,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture
def operator_user(db) -> User:
    user = User(
        full_name="Operator Test",
        email="operator@test.com",
        hashed_password=hash_password("Operator1234"),
        role=UserRole.OPERATOR,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture
def admin_token(admin_user) -> str:
    """Token JWT generado directamente — no pasa por el endpoint de login."""
    return create_access_token(subject=admin_user.id)


@pytest.fixture
def operator_token(operator_user) -> str:
    """Token JWT generado directamente — no pasa por el endpoint de login."""
    return create_access_token(subject=operator_user.id)


@pytest.fixture
def product_with_variant(db, admin_user) -> tuple[Product, ProductVariant]:
    product = Product(name="Remera Test", base_sku="REM-TEST")
    db.add(product)
    db.commit()

    variant = ProductVariant(
        product_id=product.id,
        sku="REM-TEST-S-ROJO",
        sale_price=1500,
        cost_price=700,
        reorder_point=5,
    )
    db.add(variant)
    db.commit()
    db.refresh(product)
    db.refresh(variant)
    return product, variant


@pytest.fixture
def variant_with_stock(db, admin_user, product_with_variant) -> ProductVariant:
    """Variante con 20 unidades de stock ya cargadas."""
    _, variant = product_with_variant
    movement = StockMovement(
        variant_id=variant.id,
        user_id=admin_user.id,
        movement_type=MovementType.ADJUSTMENT_IN,
        quantity=20,
        notes="Stock inicial para test",
    )
    db.add(movement)
    db.commit()
    return variant


@pytest.fixture
def supplier(db) -> Supplier:
    s = Supplier(name="Proveedor Test", email="prov@test.com")
    db.add(s)
    db.commit()
    db.refresh(s)
    return s
