"""
Servicio de Stock y Kardex.

REQ-F02: Kardex transaccional inmutable.
REQ-F03: Validación de stock antes de venta (sin saldos negativos, concurrencia segura).
REQ-F04: Alertas de punto de reorden.
REQ-F05: Ajustes de inventario solo para Admin.
REQ-NF01: Aislamiento transaccional con SELECT FOR UPDATE para evitar race conditions.
"""

from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.product import Product, ProductVariant
from app.models.stock import (
    MovementType,
    PurchaseOrder,
    PurchaseOrderItem,
    PurchaseOrderStatus,
    Sale,
    SaleItem,
    StockMovement,
)
from app.models.supplier import Supplier
from app.models.user import User
from app.schemas.stock import (
    PurchaseOrderCreate,
    SaleCreate,
    StockAdjustmentRequest,
    StockSummary,
    SupplierCreate,
)


class StockService:

    # ---------------------------------------------------------------------------
    # Kardex helpers
    # ---------------------------------------------------------------------------

    def get_current_stock(self, db: Session, variant_id: int) -> int:
        """
        REQ-F02: El stock se calcula como sumatoria de todos los movimientos.
        NUNCA se edita un campo 'stock' directamente.
        """
        result = (
            db.query(func.coalesce(func.sum(StockMovement.quantity), 0))
            .filter(StockMovement.variant_id == variant_id)
            .scalar()
        )
        return int(result)

    def get_stock_summary(self, db: Session, variant_id: int) -> StockSummary:
        variant = db.query(ProductVariant).filter(ProductVariant.id == variant_id).first()
        if not variant:
            raise HTTPException(status_code=404, detail="Variante no encontrada")
        stock = self.get_current_stock(db, variant_id)
        return StockSummary(
            variant_id=variant_id,
            variant_sku=variant.sku,
            current_stock=stock,
            reorder_point=variant.reorder_point,
            below_reorder=stock <= variant.reorder_point,
        )

    def get_movements(
        self, db: Session, variant_id: int, limit: int = 100, offset: int = 0
    ) -> list[StockMovement]:
        return (
            db.query(StockMovement)
            .filter(StockMovement.variant_id == variant_id)
            .order_by(StockMovement.created_at.desc())
            .offset(offset)
            .limit(limit)
            .all()
        )

    def get_bulk_stock(self, db: Session, variant_ids: list[int]) -> dict[int, int]:
        """Devuelve {variant_id: stock_actual} en una sola query agregada. Elimina N+1."""
        if not variant_ids:
            return {}
        rows = (
            db.query(
                StockMovement.variant_id,
                func.coalesce(func.sum(StockMovement.quantity), 0).label("total"),
            )
            .filter(StockMovement.variant_id.in_(variant_ids))
            .group_by(StockMovement.variant_id)
            .all()
        )
        stock_map = {row.variant_id: int(row.total) for row in rows}
        # Variantes sin movimientos tienen stock 0
        for vid in variant_ids:
            stock_map.setdefault(vid, 0)
        return stock_map

    def get_products_with_stock(self, db: Session, skip: int = 0, limit: int = 50) -> list[Product]:
        """Devuelve productos con current_stock por variante resuelto en 2 queries (no N+1)."""
        from app.services.product_service import product_service

        products = product_service.get_products(db, skip=skip, limit=limit)
        variant_ids = [v.id for p in products for v in p.variants]
        stock_map = self.get_bulk_stock(db, variant_ids)
        for product in products:
            for variant in product.variants:
                variant.current_stock = stock_map.get(variant.id, 0)
        return products

    def get_product_with_stock(self, db: Session, product_id: int) -> Product:
        """Devuelve un producto con current_stock en cada variante (2 queries)."""
        from app.services.product_service import product_service

        product = product_service.get_product(db, product_id)
        variant_ids = [v.id for v in product.variants]
        stock_map = self.get_bulk_stock(db, variant_ids)
        for variant in product.variants:
            variant.current_stock = stock_map.get(variant.id, 0)
        return product

    def get_low_stock_alerts(self, db: Session) -> list[StockSummary]:
        """REQ-F04: Variantes en o por debajo del punto de reorden. Una sola query con HAVING."""
        stock_subq = (
            db.query(
                StockMovement.variant_id,
                func.coalesce(func.sum(StockMovement.quantity), 0).label("total"),
            )
            .group_by(StockMovement.variant_id)
            .subquery()
        )

        rows = (
            db.query(
                ProductVariant.id,
                ProductVariant.sku,
                ProductVariant.reorder_point,
                func.coalesce(stock_subq.c.total, 0).label("current_stock"),
            )
            .outerjoin(stock_subq, ProductVariant.id == stock_subq.c.variant_id)
            .filter(
                ProductVariant.is_active.is_(True),
                func.coalesce(stock_subq.c.total, 0) <= ProductVariant.reorder_point,
            )
            .all()
        )

        return [
            StockSummary(
                variant_id=row.id,
                variant_sku=row.sku,
                current_stock=int(row.current_stock),
                reorder_point=row.reorder_point,
                below_reorder=True,
            )
            for row in rows
        ]

    # ---------------------------------------------------------------------------
    # Stock adjustment (Admin only — REQ-F05)
    # ---------------------------------------------------------------------------

    def adjust_stock(
        self, db: Session, data: StockAdjustmentRequest, user: User
    ) -> StockMovement:
        """Ajuste manual de stock. Solo Admin. Genera movimiento de compensación."""
        variant = db.query(ProductVariant).filter(ProductVariant.id == data.variant_id).first()
        if not variant:
            raise HTTPException(status_code=404, detail="Variante no encontrada")

        movement_type = (
            MovementType.ADJUSTMENT_IN if data.quantity > 0 else MovementType.ADJUSTMENT_OUT
        )
        movement = StockMovement(
            variant_id=data.variant_id,
            user_id=user.id,
            movement_type=movement_type,
            quantity=data.quantity,
            notes=data.notes,
        )
        db.add(movement)
        db.commit()
        db.refresh(movement)
        return movement

    # ---------------------------------------------------------------------------
    # Sales — REQ-F03 (concurrencia segura con SELECT FOR UPDATE)
    # ---------------------------------------------------------------------------

    def create_sale(self, db: Session, data: SaleCreate, user: User) -> Sale:
        """
        REQ-F03 + REQ-NF01: Valida disponibilidad y registra la venta de forma
        atómica usando SELECT FOR UPDATE para prevenir race conditions.
        El rollback ante HTTPException lo gestiona el scope de la sesión de FastAPI.
        """
        sale = Sale(created_by=user.id, notes=data.notes)
        db.add(sale)
        db.flush()

        for item in data.items:
            variant = (
                db.execute(
                    select(ProductVariant)
                    .where(ProductVariant.id == item.variant_id)
                    .with_for_update()
                )
                .scalars()
                .first()
            )
            if not variant or not variant.is_active:
                raise HTTPException(
                    status_code=404,
                    detail=f"Variante {item.variant_id} no encontrada o inactiva",
                )

            current_stock = self.get_current_stock(db, item.variant_id)
            if current_stock < item.quantity:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=(
                        f"Stock insuficiente para SKU '{variant.sku}'. "
                        f"Disponible: {current_stock}, solicitado: {item.quantity}"
                    ),
                )

            db.add(SaleItem(
                sale_id=sale.id,
                variant_id=item.variant_id,
                quantity=item.quantity,
                unit_price=variant.sale_price,
            ))
            db.add(StockMovement(
                variant_id=item.variant_id,
                user_id=user.id,
                movement_type=MovementType.SALE,
                quantity=-item.quantity,
                unit_cost=variant.cost_price,
                reference_type="SALE",
                reference_id=sale.id,
            ))

        db.commit()
        db.refresh(sale)
        return sale

    # ---------------------------------------------------------------------------
    # Purchase Orders
    # ---------------------------------------------------------------------------

    def create_purchase_order(
        self, db: Session, data: PurchaseOrderCreate, user: User
    ) -> PurchaseOrder:
        supplier = db.query(Supplier).filter(Supplier.id == data.supplier_id).first()
        if not supplier:
            raise HTTPException(status_code=404, detail="Proveedor no encontrado")

        order = PurchaseOrder(
            supplier_id=data.supplier_id,
            created_by=user.id,
            notes=data.notes,
        )
        db.add(order)
        db.flush()

        for item in data.items:
            variant = db.query(ProductVariant).filter(ProductVariant.id == item.variant_id).first()
            if not variant:
                db.rollback()
                raise HTTPException(status_code=404, detail=f"Variante {item.variant_id} no encontrada")

            order_item = PurchaseOrderItem(
                purchase_order_id=order.id,
                variant_id=item.variant_id,
                quantity=item.quantity,
                unit_cost=item.unit_cost,
            )
            db.add(order_item)

        db.commit()
        db.refresh(order)
        return order

    def receive_purchase_order(
        self, db: Session, order_id: int, user: User
    ) -> PurchaseOrder:
        """Confirmar recepción: genera movimientos de entrada en el Kardex.
        SELECT FOR UPDATE previene recepción doble concurrente."""
        order = (
            db.execute(
                select(PurchaseOrder)
                .where(PurchaseOrder.id == order_id)
                .with_for_update()
            )
            .scalars()
            .first()
        )
        if not order:
            raise HTTPException(status_code=404, detail="Orden de compra no encontrada")
        if order.status != PurchaseOrderStatus.PENDING:
            raise HTTPException(
                status_code=400,
                detail=f"La orden ya fue procesada (estado: {order.status})",
            )

        for item in order.items:
            movement = StockMovement(
                variant_id=item.variant_id,
                user_id=user.id,
                movement_type=MovementType.PURCHASE,
                quantity=item.quantity,  # Positivo = ingreso
                unit_cost=item.unit_cost,
                reference_type="PURCHASE_ORDER",
                reference_id=order.id,
            )
            db.add(movement)

        order.status = PurchaseOrderStatus.RECEIVED
        order.received_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(order)
        return order

    # ---------------------------------------------------------------------------
    # Suppliers
    # ---------------------------------------------------------------------------

    def get_suppliers(self, db: Session) -> list[Supplier]:
        return db.query(Supplier).filter(Supplier.is_active).all()

    def create_supplier(self, db: Session, data: SupplierCreate) -> Supplier:
        supplier = Supplier(**data.model_dump())
        db.add(supplier)
        db.commit()
        db.refresh(supplier)
        return supplier


stock_service = StockService()
