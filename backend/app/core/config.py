"""Configuración central de la aplicación usando variables de entorno."""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # App
    APP_NAME: str = "StockSync"
    APP_VERSION: str = "0.1.0"
    DEBUG: bool = False

    # Base de datos
    DATABASE_URL: str = "postgresql://stocksync:stocksync@db:5432/stocksync"

    # JWT
    SECRET_KEY: str = "changeme-use-a-strong-secret-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 8  # 8 horas

    # CORS
    CORS_ORIGINS: list[str] = ["http://localhost:5173", "http://localhost:3000"]

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
