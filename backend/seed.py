"""
Seed inicial: usuarios, categorías, atributos, proveedores y productos con stock.
Run: docker compose run --rm backend python seed.py
"""
import itertools
import sys

from app.core.database import SessionLocal
from app.core.security import hash_password
from app.models.product import AttributeType, AttributeValue, Category, Product, ProductVariant
from app.models.stock import MovementType, StockMovement
from app.models.supplier import Supplier
from app.models.user import User, UserRole
from sqlalchemy.orm import Session


def seed_users(db: Session) -> User:
    for email, full_name, password, role in [
        ("admin@stocksync.com", "Administrador", "Password2026!", UserRole.ADMIN),
        ("operador@stocksync.com", "Operador Demo", "Operador2026!", UserRole.OPERATOR),
    ]:
        if not db.query(User).filter_by(email=email).first():
            db.add(User(full_name=full_name, email=email, hashed_password=hash_password(password), role=role, is_active=True))
    db.flush()
    return db.query(User).filter_by(email="admin@stocksync.com").first()


def seed_categories(db: Session) -> dict:
    for name in ["Remeras", "Pantalones", "Zapatillas", "Camperas", "Accesorios"]:
        if not db.query(Category).filter_by(name=name).first():
            db.add(Category(name=name))
    db.flush()
    return {c.name: c for c in db.query(Category).all()}


def seed_attributes(db: Session) -> dict:
    specs = {"Talle": ["XS", "S", "M", "L", "XL"], "Color": ["Negro", "Blanco", "Rojo", "Azul", "Verde"]}
    result = {}
    for type_name, values in specs.items():
        at = db.query(AttributeType).filter_by(name=type_name).first()
        if not at:
            at = AttributeType(name=type_name)
            db.add(at)
            db.flush()
        avs = []
        for val in values:
            av = db.query(AttributeValue).filter_by(attribute_type_id=at.id, value=val).first()
            if not av:
                av = AttributeValue(attribute_type_id=at.id, value=val)
                db.add(av)
                db.flush()
            avs.append(av)
        result[type_name] = avs
    return result


def seed_suppliers(db: Session) -> None:
    for name, contact, email, phone in [
        ("InforTech S.A.", "Juan García", "contacto@infortech.com", "351-555-0100"),
        ("TextilModa S.R.L.", "María López", "ventas@textilmoda.com", "351-555-0200"),
    ]:
        if not db.query(Supplier).filter_by(name=name).first():
            db.add(Supplier(name=name, contact_name=contact, email=email, phone=phone))
    db.flush()


def _sku(base: str, combo: tuple) -> str:
    return "-".join([base] + [v.value[:3].upper() for v in combo])


def seed_products(db: Session, cats: dict, attrs: dict, admin: User) -> None:
    talles = attrs["Talle"]   # XS S M L XL
    colores = attrs["Color"]  # Negro Blanco Rojo Azul Verde

    # (name, base_sku, category, attr_groups, sale_price, cost_price, reorder_point, initial_stock)
    specs = [
        ("Remera Básica",       "REM-BAS",  cats["Remeras"],    [talles[1:4], colores[:3]], 4500,  2000,  10, 15),
        ("Jean Recto",          "JEAN-REC", cats["Pantalones"], [talles[1:4]],              12000, 6000,  8,  20),
        ("Campera Rompeviento", "CAMP-ROM", cats["Camperas"],   [talles[1:4], colores[:2]], 18000, 9000,  5,   3),
        ("Zapatilla Running",   "ZAP-RUN",  cats["Zapatillas"], [talles],                   35000, 18000, 5,   4),
        ("Accesorio Varios",    "ACC-VAR",  cats["Accesorios"], [talles[:1]],               2000,  800,  15,  12),
    ]

    for name, base_sku, cat, attr_groups, price, cost, reorder, stock in specs:
        product = db.query(Product).filter_by(base_sku=base_sku).first()
        if not product:
            product = Product(name=name, base_sku=base_sku, category_id=cat.id, is_active=True)
            db.add(product)
            db.flush()

        for combo in itertools.product(*attr_groups):
            sku = _sku(base_sku, combo)
            if not db.query(ProductVariant).filter_by(sku=sku).first():
                variant = ProductVariant(
                    product_id=product.id, sku=sku,
                    sale_price=price, cost_price=cost,
                    reorder_point=reorder, is_active=True,
                )
                db.add(variant)
                db.flush()
                for av in combo:
                    variant.attribute_values.append(av)
                db.add(StockMovement(
                    variant_id=variant.id, user_id=admin.id,
                    movement_type=MovementType.PURCHASE,
                    quantity=stock, unit_cost=cost, notes="Stock inicial",
                ))
    db.flush()


def main() -> None:
    db = SessionLocal()
    try:
        print("→ Usuarios...")
        admin = seed_users(db)
        print("→ Categorías...")
        cats = seed_categories(db)
        print("→ Atributos...")
        attrs = seed_attributes(db)
        print("→ Proveedores...")
        seed_suppliers(db)
        print("→ Productos y stock...")
        seed_products(db, cats, attrs, admin)
        db.commit()
        print("✓ Seed completado exitosamente")
        print("\nCredenciales de acceso:")
        print("  Admin:    admin@stocksync.com / Password2026!")
        print("  Operador: operador@stocksync.com / Operador2026!")
    except Exception as e:
        db.rollback()
        print(f"✗ Error: {e}", file=sys.stderr)
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
