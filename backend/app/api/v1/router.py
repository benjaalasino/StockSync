"""Router principal v1 — agrupa todos los sub-routers."""

from fastapi import APIRouter

from app.api.v1 import auth, products, stock, users

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["Autenticación"])
api_router.include_router(users.router, prefix="/users", tags=["Usuarios"])
api_router.include_router(products.router, prefix="/products", tags=["Productos"])
api_router.include_router(stock.router, prefix="/stock", tags=["Stock & Kardex"])
