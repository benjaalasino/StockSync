from typing import List, Optional

from fastapi import HTTPException
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.models.client import Client
from app.schemas.client import ClientCreate, ClientUpdate


def get_clients(db: Session, search: Optional[str] = None) -> List[Client]:
    query = db.query(Client).filter(Client.is_active == True)  # noqa: E712
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
    client = db.query(Client).filter(Client.id == client_id, Client.is_active == True).first()  # noqa: E712
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
