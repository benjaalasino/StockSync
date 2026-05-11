"""Endpoints de gestión de usuarios (solo Admin)."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import require_admin
from app.schemas.user import UserCreate, UserResponse
from app.services.auth_service import auth_service

router = APIRouter()


@router.get("/", response_model=list[UserResponse])
def list_users(
    db: Session = Depends(get_db),
    _=Depends(require_admin),
):
    """REQ-F05: Solo Admin puede listar usuarios."""
    return auth_service.get_users(db)


@router.post("/", response_model=UserResponse, status_code=201)
def create_user(
    data: UserCreate,
    db: Session = Depends(get_db),
    _=Depends(require_admin),
):
    """REQ-F05: Solo Admin puede crear usuarios."""
    return auth_service.create_user(db, data)
