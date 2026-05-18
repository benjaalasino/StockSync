"""Endpoints de Productos, Variantes, Categorías y Atributos."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user, require_admin
from app.models.product import AttributeType, AttributeValue
from app.schemas.product import (
    AttributeTypeCreate,
    AttributeTypeResponse,
    AttributeValueCreate,
    AttributeValueResponse,
    CategoryCreate,
    CategoryResponse,
    GenerateVariantsRequest,
    ProductCreate,
    ProductResponse,
    ProductUpdate,
    VariantCreate,
    VariantResponse,
    VariantUpdate,
)
from app.services.product_service import product_service
from app.services.stock_service import stock_service

router = APIRouter()


# ---------------------------------------------------------------------------
# Categories
# ---------------------------------------------------------------------------

@router.get("/categories", response_model=list[CategoryResponse])
def list_categories(db: Session = Depends(get_db), _=Depends(get_current_user)):
    return product_service.get_categories(db)


@router.post("/categories", response_model=CategoryResponse, status_code=201)
def create_category(
    data: CategoryCreate,
    db: Session = Depends(get_db),
    _=Depends(require_admin),
):
    return product_service.create_category(db, data.name, data.description)


# ---------------------------------------------------------------------------
# Attribute Types & Values
# ---------------------------------------------------------------------------

@router.get("/attributes", response_model=list[AttributeTypeResponse])
def list_attribute_types(db: Session = Depends(get_db), _=Depends(get_current_user)):
    return db.query(AttributeType).all()


@router.post("/attributes", response_model=AttributeTypeResponse, status_code=201)
def create_attribute_type(
    data: AttributeTypeCreate,
    db: Session = Depends(get_db),
    _=Depends(require_admin),
):
    attr = AttributeType(name=data.name)
    db.add(attr)
    db.commit()
    db.refresh(attr)
    return attr


@router.post("/attributes/values", response_model=AttributeValueResponse, status_code=201)
def create_attribute_value(
    data: AttributeValueCreate,
    db: Session = Depends(get_db),
    _=Depends(require_admin),
):
    val = AttributeValue(attribute_type_id=data.attribute_type_id, value=data.value)
    db.add(val)
    db.commit()
    db.refresh(val)
    return val


# ---------------------------------------------------------------------------
# Products (Padre)
# ---------------------------------------------------------------------------

@router.get("/", response_model=list[ProductResponse])
def list_products(
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    return stock_service.get_products_with_stock(db, skip=skip, limit=limit)


@router.post("/", response_model=ProductResponse, status_code=201)
def create_product(
    data: ProductCreate,
    db: Session = Depends(get_db),
    _=Depends(require_admin),
):
    return product_service.create_product(db, data)


@router.get("/{product_id}", response_model=ProductResponse)
def get_product(
    product_id: int,
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    return stock_service.get_product_with_stock(db, product_id)


@router.patch("/{product_id}", response_model=ProductResponse)
def update_product(
    product_id: int,
    data: ProductUpdate,
    db: Session = Depends(get_db),
    _=Depends(require_admin),
):
    return product_service.update_product(db, product_id, data)


@router.delete("/{product_id}", status_code=204)
def delete_product(
    product_id: int,
    db: Session = Depends(get_db),
    _=Depends(require_admin),
):
    """REQ-F05: Eliminación lógica, solo Admin."""
    product_service.delete_product(db, product_id)


# ---------------------------------------------------------------------------
# Variants (Hijo)
# ---------------------------------------------------------------------------

@router.post("/{product_id}/variants", response_model=VariantResponse, status_code=201)
def add_variant(
    product_id: int,
    data: VariantCreate,
    db: Session = Depends(get_db),
    _=Depends(require_admin),
):
    return product_service.add_variant(db, product_id, data)


@router.post("/{product_id}/variants/generate", response_model=list[VariantResponse], status_code=201)
def generate_variants(
    product_id: int,
    data: GenerateVariantsRequest,
    db: Session = Depends(get_db),
    _=Depends(require_admin),
):
    """REQ-F01: Genera la matriz de variantes automáticamente."""
    return product_service.generate_variants(db, product_id, data)


@router.patch("/variants/{variant_id}", response_model=VariantResponse)
def update_variant(
    variant_id: int,
    data: VariantUpdate,
    db: Session = Depends(get_db),
    _=Depends(require_admin),
):
    return product_service.update_variant(db, variant_id, data)
