# 04 — Frontend: tipos TypeScript y cliente API

## `frontend/src/types/index.ts`

Agregar al final del archivo (no reemplazar lo existente):

```typescript
// ─── Clientes ────────────────────────────────────────────────────────────────

export interface Client {
  id: number
  full_name: string
  email?: string
  phone?: string
  address?: string
  notes?: string
  is_active: boolean
  created_at: string
}

export interface ClientCreate {
  full_name: string
  email?: string
  phone?: string
  address?: string
  notes?: string
}

export interface ClientUpdate extends Partial<ClientCreate> {
  is_active?: boolean
}
```

Modificar la interfaz `Sale` existente para agregar los campos de cliente:

```typescript
// En la interfaz Sale existente, agregar:
export interface Sale {
  // ... campos que ya existen ...
  client_id?: number
  client_name?: string
}

// En SaleCreate (si existe, si no crearla):
export interface SaleCreate {
  items: SaleItemCreate[]
  notes?: string
  client_id?: number
}
```

---

## `frontend/src/services/api.ts`

Agregar el namespace `clientsApi` junto a los demás:

```typescript
import type { Client, ClientCreate, ClientUpdate } from '../types'

// Agregar junto a los otros namespaces (authApi, productsApi, etc.):
export const clientsApi = {
  list(search?: string): Promise<Client[]> {
    const params = search ? { search } : {}
    return api.get('/clients/', { params }).then(r => r.data)
  },

  get(id: number): Promise<Client> {
    return api.get(`/clients/${id}`).then(r => r.data)
  },

  create(data: ClientCreate): Promise<Client> {
    return api.post('/clients/', data).then(r => r.data)
  },

  update(id: number, data: ClientUpdate): Promise<Client> {
    return api.patch(`/clients/${id}`, data).then(r => r.data)
  },

  delete(id: number): Promise<Client> {
    return api.delete(`/clients/${id}`).then(r => r.data)
  },
}
```

También actualizar `salesApi.create` para aceptar `client_id`:

```typescript
// El método create de salesApi ya debería aceptar SaleCreate,
// que ahora incluye client_id. Si el tipo estaba hardcodeado, actualizarlo:
export const salesApi = {
  // ...existente...
  create(data: SaleCreate): Promise<Sale> {
    return api.post('/stock/sales', data).then(r => r.data)
  },
  // también agregar list si no existe:
  list(): Promise<Sale[]> {
    return api.get('/stock/sales').then(r => r.data)
  },
}
```

> **Nota**: verificar si `GET /stock/sales` existe en el backend. Si no existe, hay que agregarlo al router de stock (ver sección al final de este archivo).

---

## Backend: agregar endpoint GET /stock/sales (si no existe)

En `backend/app/api/v1/stock.py`, agregar:

```python
@router.get("/sales", response_model=List[SaleResponse])
def list_sales(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    sales = db.query(Sale).order_by(Sale.created_at.desc()).all()
    return sales
```

Y en `backend/app/services/stock_service.py`:

```python
def get_sales(db: Session) -> List[Sale]:
    return db.query(Sale).order_by(Sale.created_at.desc()).all()
```
