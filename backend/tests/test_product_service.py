import pytest
from fastapi import HTTPException

from app.models.product import AttributeType, AttributeValue
from app.schemas.product import (
    GenerateVariantsRequest,
    ProductCreate,
    ProductUpdate,
    VariantCreate,
    VariantUpdate,
)
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
    data = ProductCreate(
        name="Sweatpants",
        base_sku="SP-001",
        description="Comfortable sweatpants for everyday wear.",
        category_id=None,
    )

    # 2. ACT
    product = product_service.create_product(db, data=data)

    # 3. ASSERT
    assert product.id is not None
    assert product.name == "Sweatpants"
    assert product.base_sku == "SP-001"
    assert product.description == "Comfortable sweatpants for everyday wear."

def test_create_product_duplicate_sku(db):
    # 1. ARRANGE
    data = ProductCreate(
        name="Sweatpants",
        base_sku="SP-001",
        description="Comfortable sweatpants for everyday wear.",
        category_id=None,
    )
    # Create the first product
    product_service.create_product(db, data=data)

    # 2. ACT & 3. ASSERT
    with pytest.raises(HTTPException) as exception_info:
        product_service.create_product(db, data=data)

    assert exception_info.value.status_code == 400
    assert exception_info.value.detail == "Ya existe un producto con SKU base 'SP-001'"

def test_update_product_success(db):
    # 1. ARRANGE
    create_data = ProductCreate(
        name="Sweatpants",
        base_sku="SP-001",
        description="Comfortable sweatpants for everyday wear.",
        category_id=None,
    )
    product = product_service.create_product(db, data=create_data)

    update_data = ProductUpdate(
        name="Updated Sweatpants",
        description="Updated description.",
    )

    # 2. ACT
    updated_product = product_service.update_product(db, product_id=product.id, data=update_data)

    # 3. ASSERT
    assert updated_product.id == product.id
    assert updated_product.name == "Updated Sweatpants"
    assert updated_product.base_sku == "SP-001"  # SKU should remain unchanged
    assert updated_product.description == "Updated description."

def test_update_product_not_found(db):
    # 1. ARRANGE
    update_data = ProductUpdate(
        name="Non-existent Product",
        description="This product does not exist.",
    )

    # 2. ACT & 3. ASSERT
    with pytest.raises(HTTPException) as exception_info:
        product_service.update_product(db, product_id=9999, data=update_data)

    assert exception_info.value.status_code == 404
    assert exception_info.value.detail == "Producto no encontrado"

def test_delete_product_success(db):
    # 1. ARRANGE
    create_data = ProductCreate(
        name="Sweatpants",
        base_sku="SP-001",
        description="Comfortable sweatpants for everyday wear.",
        category_id=None,
    )
    product = product_service.create_product(db, data=create_data)

    # 2. ACT
    product_service.delete_product(db, product_id=product.id)

    # 3. ASSERT
    # Al ser un borrado lógico, validamos que la propiedad is_active cambie a False
    deleted_product = product_service.get_product(db, product_id=product.id)
    assert deleted_product.is_active is False

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

def create_test_product_for_variants(db):
    data = ProductCreate(
        name="Remera Básica",
        base_sku="REM-BASE",
        description="Remera de algodón",
        category_id=None
    )
    return product_service.create_product(db, data=data)

def setup_attributes(db):
    talle_type = AttributeType(name="Talle")
    color_type = AttributeType(name="Color")
    db.add_all([talle_type, color_type])
    db.commit()

    val_s = AttributeValue(attribute_type_id=talle_type.id, value="S")
    val_m = AttributeValue(attribute_type_id=talle_type.id, value="M")
    val_rojo = AttributeValue(attribute_type_id=color_type.id, value="Rojo")
    val_azul = AttributeValue(attribute_type_id=color_type.id, value="Azul")
    db.add_all([val_s, val_m, val_rojo, val_azul])
    db.commit()

    # Refrescamos todo
    db.refresh(val_s)
    db.refresh(val_m)
    db.refresh(val_rojo)
    db.refresh(val_azul)

    return [val_s, val_m], [val_rojo, val_azul]

def test_build_sku_success(db):
    # 1. ARRANGE
    product = create_test_product_for_variants(db)
    talles, colores = setup_attributes(db)

    # 2. ACT
    sku = product_service._build_sku(product.base_sku, [talles[0].id, colores[0].id], db)

    # 3. ASSERT
    # Verifica que el sku base se concatene con el valor de los atributos ordenados por ID
    assert sku == f"{product.base_sku}-{talles[0].value.upper()}-{colores[0].value.upper()}"

def test_add_variant_success(db):
    # 1. ARRANGE
    product = create_test_product_for_variants(db)
    talles, colores = setup_attributes(db)
    data = VariantCreate(
        attribute_value_ids=[talles[0].id, colores[0].id],
        sale_price=100.0,
        cost_price=50.0,
        reorder_point=10
    )

    # 2. ACT
    variant = product_service.add_variant(db, product_id=product.id, data=data)

    # 3. ASSERT
    assert variant.id is not None
    assert variant.sku == f"{product.base_sku}-{talles[0].value.upper()}-{colores[0].value.upper()}"
    assert variant.sale_price == 100.0

def test_add_variant_duplicate(db):
    # 1. ARRANGE
    product = create_test_product_for_variants(db)
    talles, colores = setup_attributes(db)
    data = VariantCreate(
        attribute_value_ids=[talles[0].id, colores[0].id],
        sale_price=100.0,
        cost_price=50.0,
        reorder_point=10
    )

    product_service.add_variant(db, product_id=product.id, data=data)

    # 2. ACT & 3. ASSERT
    with pytest.raises(HTTPException) as exception_info:
        product_service.add_variant(db, product_id=product.id, data=data)

    assert exception_info.value.status_code == 400
    assert "Ya existe la variante" in exception_info.value.detail

def test_generate_variants_success(db):
    # 1. ARRANGE
    product = create_test_product_for_variants(db)
    talles, colores = setup_attributes(db)
    data = GenerateVariantsRequest(
        attribute_combinations=[
            [t.id for t in talles],
            [c.id for c in colores]
        ],
        base_sale_price=150.0,
        base_cost_price=70.0,
        reorder_point=5
    )

    # 2. ACT
    variants = product_service.generate_variants(db, product_id=product.id, data=data)

    # 3. ASSERT
    assert len(variants) == 4 # 2 talles * 2 colores = 4 combinaciones
    skus = [v.sku for v in variants]
    assert f"{product.base_sku}-S-ROJO" in skus
    assert f"{product.base_sku}-M-AZUL" in skus

def test_update_variant_success(db):
    # 1. ARRANGE
    product = create_test_product_for_variants(db)
    talles, colores = setup_attributes(db)

    # Crear primera variante
    create_data = VariantCreate(
        attribute_value_ids=[talles[0].id],
        sale_price=100.0,
        cost_price=50.0,
        reorder_point=10
    )
    variant = product_service.add_variant(db, product_id=product.id, data=create_data)

    # 2. ACT
    update_data = VariantUpdate(sale_price=250.0, cost_price=90.0)
    updated_variant = product_service.update_variant(db, variant_id=variant.id, data=update_data)

    # 3. ASSERT
    assert updated_variant.id == variant.id
    assert updated_variant.sale_price == 250.0
    assert updated_variant.cost_price == 90.0
    assert updated_variant.reorder_point == 10 # Se mantiene intacto, no lo tocamos.
