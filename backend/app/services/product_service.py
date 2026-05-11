"""
Servicio de Productos.
REQ-F01: Creación de Producto Padre y generación automática de SKUs Hijo.
"""

from itertools import product as cartesian_product

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.product import AttributeValue, Category, Product, ProductVariant
from app.schemas.product import (
    GenerateVariantsRequest,
    ProductCreate,
    ProductUpdate,
    VariantCreate,
    VariantUpdate,
)


class ProductService:

    # ---------------------------------------------------------------------------
    # Categories
    # ---------------------------------------------------------------------------

    def get_categories(self, db: Session) -> list[Category]:
        return db.query(Category).filter(Category.is_active == True).all()

    def create_category(self, db: Session, name: str, description: str | None) -> Category:
        existing = db.query(Category).filter(Category.name == name).first()
        if existing:
            raise HTTPException(status_code=400, detail="Ya existe una categoría con ese nombre")
        cat = Category(name=name, description=description)
        db.add(cat)
        db.commit()
        db.refresh(cat)
        return cat

    # ---------------------------------------------------------------------------
    # Products
    # ---------------------------------------------------------------------------

    def get_products(self, db: Session, skip: int = 0, limit: int = 50) -> list[Product]:
        return db.query(Product).filter(Product.is_active == True).offset(skip).limit(limit).all()

    def get_product(self, db: Session, product_id: int) -> Product:
        product = db.query(Product).filter(Product.id == product_id).first()
        if not product:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Producto no encontrado")
        return product

    def create_product(self, db: Session, data: ProductCreate) -> Product:
        existing = db.query(Product).filter(Product.base_sku == data.base_sku).first()
        if existing:
            raise HTTPException(status_code=400, detail=f"Ya existe un producto con SKU base '{data.base_sku}'")

        product = Product(**data.model_dump())
        db.add(product)
        db.commit()
        db.refresh(product)
        return product

    def update_product(self, db: Session, product_id: int, data: ProductUpdate) -> Product:
        product = self.get_product(db, product_id)
        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(product, field, value)
        db.commit()
        db.refresh(product)
        return product

    def delete_product(self, db: Session, product_id: int) -> None:
        """Eliminación lógica — REQ-F05: solo Admin."""
        product = self.get_product(db, product_id)
        product.is_active = False
        db.commit()

    # ---------------------------------------------------------------------------
    # Variants
    # ---------------------------------------------------------------------------

    def _build_sku(self, base_sku: str, attribute_value_ids: list[int], db: Session) -> str:
        values = (
            db.query(AttributeValue)
            .filter(AttributeValue.id.in_(attribute_value_ids))
            .all()
        )
        suffix = "-".join(v.value.upper() for v in sorted(values, key=lambda x: x.id))
        return f"{base_sku}-{suffix}"

    def add_variant(self, db: Session, product_id: int, data: VariantCreate) -> ProductVariant:
        product = self.get_product(db, product_id)
        sku = self._build_sku(product.base_sku, data.attribute_value_ids, db)

        if db.query(ProductVariant).filter(ProductVariant.sku == sku).first():
            raise HTTPException(status_code=400, detail=f"Ya existe la variante con SKU '{sku}'")

        values = (
            db.query(AttributeValue)
            .filter(AttributeValue.id.in_(data.attribute_value_ids))
            .all()
        )

        variant = ProductVariant(
            product_id=product_id,
            sku=sku,
            sale_price=data.sale_price,
            cost_price=data.cost_price,
            reorder_point=data.reorder_point,
            attribute_values=values,
        )
        db.add(variant)
        db.commit()
        db.refresh(variant)
        return variant

    def generate_variants(
        self, db: Session, product_id: int, data: GenerateVariantsRequest
    ) -> list[ProductVariant]:
        """
        REQ-F01: Genera automáticamente el producto cartesiano de los atributos.
        Ejemplo: [[1,2,3], [4,5]] → 6 variantes (S-Rojo, S-Azul, M-Rojo, ...).
        """
        product = self.get_product(db, product_id)
        combinations = list(cartesian_product(*data.attribute_combinations))
        created = []

        for combo in combinations:
            sku = self._build_sku(product.base_sku, list(combo), db)
            if db.query(ProductVariant).filter(ProductVariant.sku == sku).first():
                continue  # Saltar si ya existe

            values = (
                db.query(AttributeValue)
                .filter(AttributeValue.id.in_(combo))
                .all()
            )
            variant = ProductVariant(
                product_id=product_id,
                sku=sku,
                sale_price=data.base_sale_price,
                cost_price=data.base_cost_price,
                reorder_point=data.reorder_point,
                attribute_values=values,
            )
            db.add(variant)
            created.append(variant)

        db.commit()
        for v in created:
            db.refresh(v)
        return created

    def update_variant(
        self, db: Session, variant_id: int, data: VariantUpdate
    ) -> ProductVariant:
        variant = db.query(ProductVariant).filter(ProductVariant.id == variant_id).first()
        if not variant:
            raise HTTPException(status_code=404, detail="Variante no encontrada")
        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(variant, field, value)
        db.commit()
        db.refresh(variant)
        return variant

    def get_variant(self, db: Session, variant_id: int) -> ProductVariant:
        variant = db.query(ProductVariant).filter(ProductVariant.id == variant_id).first()
        if not variant:
            raise HTTPException(status_code=404, detail="Variante no encontrada")
        return variant


product_service = ProductService()
