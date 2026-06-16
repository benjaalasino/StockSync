from datetime import datetime

from pydantic import BaseModel, EmailStr


class ClientCreate(BaseModel):
    full_name: str
    email: EmailStr | None = None
    phone: str | None = None
    address: str | None = None
    notes: str | None = None


class ClientUpdate(BaseModel):
    full_name: str | None = None
    email: EmailStr | None = None
    phone: str | None = None
    address: str | None = None
    notes: str | None = None
    is_active: bool | None = None


class ClientResponse(BaseModel):
    id: int
    full_name: str
    email: str | None = None
    phone: str | None = None
    address: str | None = None
    notes: str | None = None
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True
