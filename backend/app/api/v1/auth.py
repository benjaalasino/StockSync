"""Endpoints de autenticación."""

from fastapi import APIRouter, Depends, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.limiter import limiter
from app.core.security import get_current_user
from app.schemas.auth import TokenResponse
from app.schemas.user import UserResponse
from app.services.auth_service import auth_service

router = APIRouter()


@router.post("/login", response_model=TokenResponse)
@limiter.limit("10/minute")
def login(
    request: Request,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    """Inicia sesión y retorna un JWT de acceso. Máximo 10 intentos por minuto."""
    token = auth_service.authenticate(db, email=form_data.username, password=form_data.password)
    return TokenResponse(access_token=token)


@router.get("/me", response_model=UserResponse)
def get_me(current_user=Depends(get_current_user)):
    """Retorna el perfil del usuario autenticado."""
    return current_user
