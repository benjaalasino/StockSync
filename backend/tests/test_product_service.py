import pytest
from fastapi import HTTPException

from app.services.product_service import product_service

# ---------------------------------------------------------------------------
# Categories
# ---------------------------------------------------------------------------
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

# ---------------------------------------------------------------------------
# Products
# ---------------------------------------------------------------------------
def test_create_product_success(db):
    # 1. ARRANGE
    data = {
        "name": "Sweatpants",
        "base_sku": "SP-001",
        "description": "Comfortable sweatpants for everyday wear.",
        "category_id": None,
    }
    
    # 2. ACT
    product = product_service.create_product(db, data=data)
    
    # 3. ASSERT
    assert product.id is not None
    assert product.name == "Sweatpants"
    assert product.base_sku == "SP-001"
    assert product.description == "Comfortable sweatpants for everyday wear."
    
def test_create_product_duplicate_sku(db):
    # 1. ARRANGE
    data = {
        "name": "Sweatpants",
        "base_sku": "SP-001",
        "description": "Comfortable sweatpants for everyday wear.",
        "category_id": None,
    }
    # Create the first product
    product_service.create_product(db, data=data)
    
    # 2. ACT & 3. ASSERT
    with pytest.raises(HTTPException) as exception_info:
        product_service.create_product(db, data=data)
        
    assert exception_info.value.status_code == 400
    assert exception_info.value.detail == "Ya existe un producto con SKU base 'SP-001'"

def test_update_product_success(db):
    # 1. ARRANGE
    create_data = {
        "name": "Sweatpants",
        "base_sku": "SP-001",
        "description": "Comfortable sweatpants for everyday wear.",
        "category_id": None,
    }
    product = product_service.create_product(db, data=create_data)
    
    update_data = {
        "name": "Updated Sweatpants",
        "description": "Updated description.",
    }
    
    # 2. ACT
    updated_product = product_service.update_product(db, product_id=product.id, data=update_data)
    
    # 3. ASSERT
    assert updated_product.id == product.id
    assert updated_product.name == "Updated Sweatpants"
    assert updated_product.base_sku == "SP-001"  # SKU should remain unchanged
    assert updated_product.description == "Updated description."
    
def test_update_product_not_found(db):
    # 1. ARRANGE
    update_data = {
        "name": "Non-existent Product",
        "description": "This product does not exist.",
    }
    
    # 2. ACT & 3. ASSERT
    with pytest.raises(HTTPException) as exception_info:
        product_service.update_product(db, product_id=9999, data=update_data)
        
    assert exception_info.value.status_code == 404
    assert exception_info.value.detail == "Producto no encontrado"
    
def test_delete_product_success(db):
    # 1. ARRANGE
    create_data = {
        "name": "Sweatpants",
        "base_sku": "SP-001",
        "description": "Comfortable sweatpants for everyday wear.",
        "category_id": None,
    }
    product = product_service.create_product(db, data=create_data)
    
    # 2. ACT
    product_service.delete_product(db, product_id=product.id)
    
    # 3. ASSERT
    with pytest.raises(HTTPException) as exception_info:
        product_service.get_product(db, product_id=product.id)
        
    assert exception_info.value.status_code == 404
    assert exception_info.value.detail == "Producto no encontrado"
    
def test_delete_product_not_found(db):
    # 1. ARRANGE
    non_existent_product_id = 9999
    
    # 2. ACT & 3. ASSERT
    with pytest.raises(HTTPException) as exception_info:
        product_service.delete_product(db, product_id=non_existent_product_id)
        
    assert exception_info.value.status_code == 404
    assert exception_info.value.detail == "Producto no encontrado"
    
    
# ---------------------------------------------------------------------------
# Variants
# ---------------------------------------------------------------------------
