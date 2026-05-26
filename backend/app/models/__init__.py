"""Exporta todos los modelos para que Alembic los detecte."""

from app.models.client import Client  # noqa: F401
from app.models.product import (  # noqa: F401
    AttributeType,
    AttributeValue,
    Category,
    Product,
    ProductVariant,
)
from app.models.stock import (  # noqa: F401
    MovementType,
    PurchaseOrder,
    PurchaseOrderItem,
    PurchaseOrderStatus,
    Sale,
    SaleItem,
    StockMovement,
)
from app.models.supplier import Supplier  # noqa: F401
from app.models.user import User, UserRole  # noqa: F401
