"""
Script de seed idempotente para datos de demo.
Ejecutar una sola vez: python seed.py
El docker-compose lo corre automáticamente al iniciar el backend.
"""

import os
import random
import sys
from datetime import datetime, timedelta

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.core.database import SessionLocal
from app.core.security import hash_password
from app.models.client import Client
from app.models.product import (
    AttributeType,
    AttributeValue,
    Category,
    Product,
    ProductVariant,
    variant_attribute_values,
)
from app.models.stock import MovementType, Sale, SaleItem, StockMovement
from app.models.supplier import Supplier
from app.models.user import User, UserRole


def seed() -> None:
    db = SessionLocal()
    try:
        # Idempotencia: si ya existe el admin, no hacer nada
        if db.query(User).filter_by(email="admin@stocksync.com").first():
            print("✓ Seed ya aplicado — omitiendo")
            return

        print("🌱 Iniciando seed de datos demo...")

        # ── 1. Usuarios ──────────────────────────────────────────────────────
        admin = User(
            full_name="Administrador Demo",
            email="admin@stocksync.com",
            hashed_password=hash_password("Admin1234"),
            role=UserRole.ADMIN,
        )
        operator = User(
            full_name="Operador Demo",
            email="operador@stocksync.com",
            hashed_password=hash_password("Op1234"),
            role=UserRole.OPERATOR,
        )
        db.add_all([admin, operator])
        db.flush()

        # ── 2. Categorías ────────────────────────────────────────────────────
        cat_remeras = Category(name="Remeras", description="Remeras y camisetas")
        cat_pantalones = Category(name="Pantalones", description="Pantalones y jeans")
        cat_accesorios = Category(name="Accesorios", description="Buzos y accesorios")
        db.add_all([cat_remeras, cat_pantalones, cat_accesorios])
        db.flush()

        # ── 3. Tipos de atributo ─────────────────────────────────────────────
        attr_talle = AttributeType(name="Talle")
        attr_color = AttributeType(name="Color")
        db.add_all([attr_talle, attr_color])
        db.flush()

        # ── 4. Valores de atributo ───────────────────────────────────────────
        talle_vals = []
        for v in ["XS", "S", "M", "L", "XL"]:
            av = AttributeValue(attribute_type_id=attr_talle.id, value=v)
            db.add(av)
            talle_vals.append(av)

        color_vals = []
        for v in ["NEGRO", "BLANCO", "ROJO", "AZUL"]:
            av = AttributeValue(attribute_type_id=attr_color.id, value=v)
            db.add(av)
            color_vals.append(av)
        db.flush()

        # ── 5. Proveedores ───────────────────────────────────────────────────
        sup1 = Supplier(
            name="Textiles del Sur S.A.",
            contact_name="Roberto Méndez",
            email="roberto@textilsur.com",
            phone="0351-4567890",
        )
        sup2 = Supplier(
            name="ModaImport SRL",
            contact_name="Valentina Ríos",
            email="valeria@modaimport.com",
            phone="011-5678901",
        )
        db.add_all([sup1, sup2])
        db.flush()

        # ── 6. Productos + variantes ─────────────────────────────────────────
        products_cfg = [
            {
                "name": "Remera Básica",
                "base_sku": "REM-BAS",
                "brand": "BasiX",
                "cat": cat_remeras,
                "sale_price": 2500,
                "cost_price": 1400,
                "talles": talle_vals,
                "colores": color_vals,
            },
            {
                "name": "Remera Oversize",
                "base_sku": "REM-OVR",
                "brand": "UrbanWear",
                "cat": cat_remeras,
                "sale_price": 3200,
                "cost_price": 1800,
                "talles": talle_vals,
                "colores": color_vals,
            },
            {
                "name": "Pantalón Cargo",
                "base_sku": "PNT-CGO",
                "brand": "WorkStyle",
                "cat": cat_pantalones,
                "sale_price": 5800,
                "cost_price": 3200,
                "talles": talle_vals[:4],   # XS S M L (no XL)
                "colores": color_vals[:3],  # NEGRO BLANCO ROJO
            },
            {
                "name": "Buzo Canguro",
                "base_sku": "BUZ-CAN",
                "brand": "CityWear",
                "cat": cat_accesorios,
                "sale_price": 4500,
                "cost_price": 2500,
                "talles": talle_vals,
                "colores": color_vals,
            },
        ]

        all_variants: list[ProductVariant] = []
        random.seed(42)

        for cfg in products_cfg:
            product = Product(
                name=cfg["name"],
                base_sku=cfg["base_sku"],
                brand=cfg["brand"],
                category_id=cfg["cat"].id,
                description=f"Línea {cfg['brand']} — {cfg['name']}",
            )
            db.add(product)
            db.flush()

            for talle in cfg["talles"]:
                for color in cfg["colores"]:
                    sku = f"{cfg['base_sku']}-{talle.value}-{color.value}"
                    variant = ProductVariant(
                        product_id=product.id,
                        sku=sku,
                        sale_price=cfg["sale_price"],
                        cost_price=cfg["cost_price"],
                        reorder_point=5,
                    )
                    db.add(variant)
                    db.flush()

                    # Vincular atributos (tabla asociativa)
                    db.execute(
                        variant_attribute_values.insert().values(
                            variant_id=variant.id, attribute_value_id=talle.id
                        )
                    )
                    db.execute(
                        variant_attribute_values.insert().values(
                            variant_id=variant.id, attribute_value_id=color.id
                        )
                    )

                    all_variants.append(variant)

        db.flush()

        # ── 7. Clientes ──────────────────────────────────────────────────────
        clients_data = [
            ("Laura García", "laura.garcia@gmail.com", "0351-4112233", "Av. Colón 1234, Córdoba"),
            ("Martín López", "martin.lopez@hotmail.com", "011-45678901", "Belgrano 567, Bs. As."),
            ("Sofía Rodríguez", "sofia.r@gmail.com", "0261-3344556", "San Martín 890, Mendoza"),
            ("Diego Fernández", "diego.f@outlook.com", "0381-2233445", "Tucumán 123, Tuc."),
            ("Ana González", "ana.gonzalez@yahoo.com", "0299-1122334", "Roca 456, Neuquén"),
        ]
        clients: list[Client] = []
        for full_name, email, phone, address in clients_data:
            c = Client(full_name=full_name, email=email, phone=phone, address=address)
            db.add(c)
            clients.append(c)
        db.flush()

        # ── 8. Movimientos de stock iniciales (compras) ──────────────────────
        base_date = datetime.utcnow() - timedelta(days=45)
        for variant in all_variants:
            qty = random.randint(20, 60)
            db.add(
                StockMovement(
                    variant_id=variant.id,
                    user_id=admin.id,
                    movement_type=MovementType.PURCHASE,
                    quantity=qty,
                    unit_cost=variant.cost_price,
                    reference_type="SEED",
                    notes="Stock inicial de apertura",
                    created_at=base_date,
                )
            )

        # Algunos con stock bajo para mostrar alertas
        for variant in random.sample(all_variants, k=6):
            # Egreso que deja stock en nivel bajo (2 unidades)
            remaining_qty = random.randint(15, 50)
            db.add(
                StockMovement(
                    variant_id=variant.id,
                    user_id=admin.id,
                    movement_type=MovementType.ADJUSTMENT_OUT,
                    quantity=-remaining_qty,
                    notes="Ajuste correctivo — stock bajo para demo",
                    created_at=base_date + timedelta(days=10),
                )
            )

        db.flush()

        # ── 9. Ventas de muestra ─────────────────────────────────────────────
        sale_variants = all_variants[:9]  # primeras 9 variantes para ventas
        sales_cfg = [
            (clients[0], "Venta presencial — pago efectivo", 0),
            (clients[1], "Venta online — transferencia", 5),
            (None, "Venta mostrador sin cliente registrado", 12),
        ]

        for client, notes, days_ago in sales_cfg:
            sale = Sale(
                created_by=admin.id,
                client_id=client.id if client else None,
                notes=notes,
                created_at=datetime.utcnow() - timedelta(days=days_ago),
            )
            db.add(sale)
            db.flush()

            # 2–3 ítems por venta
            n = random.randint(2, 3)
            chosen = random.sample(sale_variants, k=n)
            for variant in chosen:
                qty = random.randint(1, 3)
                db.add(
                    SaleItem(
                        sale_id=sale.id,
                        variant_id=variant.id,
                        quantity=qty,
                        unit_price=variant.sale_price,
                    )
                )
                db.add(
                    StockMovement(
                        variant_id=variant.id,
                        user_id=admin.id,
                        movement_type=MovementType.SALE,
                        quantity=-qty,
                        reference_type="SALE",
                        reference_id=sale.id,
                        notes=notes,
                        created_at=sale.created_at,
                    )
                )

        db.commit()

        total_variants = len(all_variants)
        print("✅ Seed completado:")
        print(f"   Productos: {len(products_cfg)} (con {total_variants} variantes)")
        print(f"   Clientes: {len(clients_data)}")
        print("   Proveedores: 2")
        print(f"   Ventas: {len(sales_cfg)}")
        print("   ─────────────────────────────────")
        print("   Admin:    admin@stocksync.com  /  Admin1234")
        print("   Operador: operador@stocksync.com  /  Op1234")

    except Exception as e:
        db.rollback()
        print(f"❌ Error durante el seed: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()
