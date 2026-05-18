"""Punto de entrada de la aplicación FastAPI."""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.api.v1.router import api_router
from app.core.config import settings
from app.core.limiter import limiter


def _seed_default_user() -> None:
    """Crea el usuario admin por defecto si aún no existe."""
    from app.core.database import SessionLocal
    from app.core.security import hash_password
    from app.models.user import User, UserRole

    db = SessionLocal()
    try:
        if not db.query(User).filter(User.email == "admin@stocksync.com").first():
            db.add(User(
                full_name="Admin StockSync",
                email="admin@stocksync.com",
                hashed_password=hash_password("Admin2026!"),
                role=UserRole.ADMIN,
            ))
            db.commit()
            print("✓ Usuario admin creado: admin@stocksync.com / Admin2026!")
        else:
            print("✓ Usuario admin ya existe, sin cambios.")
    except Exception as exc:
        db.rollback()
        print(f"⚠ Seed ignorado: {exc}")
    finally:
        db.close()


@asynccontextmanager
async def lifespan(app: FastAPI):
    _seed_default_user()
    yield


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Sistema de Gestión de Inventario para Indumentaria",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api/v1")


@app.get("/health", tags=["health"])
def health_check():
    return {"status": "ok", "app": settings.APP_NAME, "version": settings.APP_VERSION}
