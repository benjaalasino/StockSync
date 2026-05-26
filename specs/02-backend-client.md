# 02 — Backend: módulo Clientes

## Archivos a crear

### `backend/app/models/client.py`

```python
from sqlalchemy import Boolean, Column, DateTime, Integer, String
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class Client(Base):
    __tablename__ = "clients"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=True)
    phone = Column(String, nullable=True)
    address = Column(String, nullable=True)
    notes = Column(String, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    sales = relationship("Sale", back_populates="client")
```

---

### `backend/app/schemas/client.py`

```python
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr


class ClientCreate(BaseModel):
    full_name: str
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    notes: Optional[str] = None


class ClientUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    notes: Optional[str] = None
    is_active: Optional[bool] = None


class ClientResponse(BaseModel):
    id: int
    full_name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    notes: Optional[str] = None
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True
```

---

### `backend/app/services/client_service.py`

```python
from typing import List, Optional

from fastapi import HTTPException
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.models.client import Client
from app.schemas.client import ClientCreate, ClientUpdate


def get_clients(db: Session, search: Optional[str] = None) -> List[Client]:
    query = db.query(Client).filter(Client.is_active == True)
    if search:
        term = f"%{search}%"
        query = query.filter(
            or_(
                Client.full_name.ilike(term),
                Client.email.ilike(term),
            )
        )
    return query.order_by(Client.full_name).all()


def get_client(db: Session, client_id: int) -> Client:
    client = db.query(Client).filter(Client.id == client_id, Client.is_active == True).first()
    if not client:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    return client


def create_client(db: Session, data: ClientCreate) -> Client:
    if data.email:
        existing = db.query(Client).filter(Client.email == data.email).first()
        if existing:
            raise HTTPException(status_code=409, detail="Ya existe un cliente con ese email")
    client = Client(**data.model_dump())
    db.add(client)
    db.commit()
    db.refresh(client)
    return client


def update_client(db: Session, client_id: int, data: ClientUpdate) -> Client:
    client = get_client(db, client_id)
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(client, field, value)
    db.commit()
    db.refresh(client)
    return client


def delete_client(db: Session, client_id: int) -> Client:
    client = get_client(db, client_id)
    client.is_active = False
    db.commit()
    db.refresh(client)
    return client
```

---

### `backend/app/api/v1/clients.py`

```python
from typing import List, Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user, require_admin
from app.models.user import User
from app.schemas.client import ClientCreate, ClientResponse, ClientUpdate
from app.services import client_service

router = APIRouter()


@router.get("/", response_model=List[ClientResponse])
def list_clients(
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return client_service.get_clients(db, search=search)


@router.post("/", response_model=ClientResponse, status_code=201)
def create_client(
    data: ClientCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return client_service.create_client(db, data)


@router.get("/{client_id}", response_model=ClientResponse)
def get_client(
    client_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return client_service.get_client(db, client_id)


@router.patch("/{client_id}", response_model=ClientResponse)
def update_client(
    client_id: int,
    data: ClientUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    return client_service.update_client(db, client_id, data)


@router.delete("/{client_id}", response_model=ClientResponse)
def delete_client(
    client_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    return client_service.delete_client(db, client_id)
```

---

## Archivos a modificar

### `backend/app/models/__init__.py` (o donde se importen los modelos)

Agregar el import del nuevo modelo para que Alembic lo detecte:

```python
from app.models.client import Client  # agregar esta línea
```

### `backend/app/api/v1/router.py`

```python
from app.api.v1 import clients  # agregar import

# dentro de donde se incluyen los routers:
router.include_router(clients.router, prefix="/clients", tags=["clients"])
```
