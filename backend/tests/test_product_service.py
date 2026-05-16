import pytest
from fastapi import HTTPException

from app.services.product_service import product_service

def test_create_category_success(db):
    # 1. ARRANGE
    name = "sweatpants"
    description = "size_L-Man-gray"
    
    # 2. ACT
    category = product_service.create_category(db, name=name, description=description)
    
    # 3. ASSERT
    assert category.id is not None
    assert category.name == "sweatpants"
    assert category.description == "size_L-Man-gray"

def test_create_category_duplicate_name(db):
    # 1. ARRANGE
    name = "sweatpants"
    # Create the first category
    product_service.create_category(db, name=name, description="first one")
    
    # 2. ACT & 3. ASSERT
    with pytest.raises(HTTPException) as exception_info:
        product_service.create_category(db, name=name, description="second one")
        
    assert exception_info.value.status_code == 400
    assert exception_info.value.detail == "Ya existe una categoría con ese nombre"
