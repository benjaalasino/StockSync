# 03 — Backend: modificaciones a Sale para soportar client_id

## Archivos a modificar

### `backend/app/models/stock.py`

En la clase `Sale`, agregar la columna y la relación:

```python
# Agregar el import de ForeignKey si no está
from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Boolean

# Dentro de la clase Sale, agregar junto a los demás campos:
client_id = Column(Integer, ForeignKey("clients.id"), nullable=True, index=True)

# Agregar la relación (junto a las demás relationships de Sale):
client = relationship("Client", back_populates="sales")
```

---

### `backend/app/schemas/stock.py`

**En `SaleCreate`**, agregar:

```python
from typing import List, Optional  # asegurarse que Optional esté importado

class SaleCreate(BaseModel):
    items: List[SaleItemCreate]
    notes: Optional[str] = None
    client_id: Optional[int] = None  # agregar esta línea
```

**En `SaleResponse`**, agregar:

```python
class SaleResponse(BaseModel):
    id: int
    created_by: int
    notes: Optional[str] = None
    is_cancelled: bool
    created_at: datetime
    items: List[SaleItemResponse]
    client_id: Optional[int] = None      # agregar
    client_name: Optional[str] = None    # agregar (denormalizado para UI)

    class Config:
        from_attributes = True
```

---

### `backend/app/services/stock_service.py`

En la función `create_sale()`, al construir el objeto `Sale`:

```python
# Antes (ejemplo aproximado de cómo está):
sale = Sale(
    created_by=user.id,
    notes=data.notes,
)

# Después — agregar client_id:
sale = Sale(
    created_by=user.id,
    notes=data.notes,
    client_id=data.client_id,
)
```

Y al construir `SaleResponse` o al retornar la sale, poblar `client_name`:

```python
# Al retornar, si el ORM tiene la relación cargada:
# SaleResponse lo puede resolver solo si se agrega un @property o se hace eager loading.
# Opción simple: en el router o service, después del commit:

db.refresh(sale)
# sale.client estará disponible si se configura la relación con lazy="select" (default)
# SaleResponse necesita client_name: se puede resolver con un validator o manualmente:

response = SaleResponse.model_validate(sale)
if sale.client:
    response.client_name = sale.client.full_name
return response
```

> **Alternativa más limpia**: agregar un `@property` en el modelo `Sale`:
> ```python
> @property
> def client_name(self) -> Optional[str]:
>     return self.client.full_name if self.client else None
> ```
> Esto permite que `SaleResponse` lo tome automáticamente con `from_attributes = True`.
