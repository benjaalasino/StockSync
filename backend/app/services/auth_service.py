"""Servicio de autenticación y gestión de usuarios."""

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import create_access_token, hash_password, verify_password
from app.models.user import User
from app.schemas.user import UserCreate


class AuthService:

    def authenticate(self, db: Session, email: str, password: str) -> str:
        """Verifica credenciales y retorna un JWT."""
        user = db.query(User).filter(User.email == email, User.is_active == True).first()
        if not user or not verify_password(password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Email o contraseña incorrectos",
            )
        return create_access_token(subject=user.id)

    def create_user(self, db: Session, data: UserCreate) -> User:
        if db.query(User).filter(User.email == data.email).first():
            raise HTTPException(status_code=400, detail="El email ya está registrado")
        user = User(
            full_name=data.full_name,
            email=data.email,
            hashed_password=hash_password(data.password),
            role=data.role,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        return user

    def get_users(self, db: Session) -> list[User]:
        return db.query(User).filter(User.is_active == True).all()


auth_service = AuthService()
