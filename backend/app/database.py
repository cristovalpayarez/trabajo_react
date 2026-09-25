"""
Todo lo relacionado con "cómo hablamos con el mundo de afuera": leer la
configuración (.env) y abrir la conexión SQL con SQLAlchemy.

Antes esto vivía repartido en dos archivos (config.py + database.py); se
unificó aquí porque son la misma responsabilidad: la configuración solo
existe para poder construir la conexión.
"""

import re
from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict
from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker


# ==========================================
# CONFIGURACIÓN (variables de entorno / .env)
# ==========================================


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # Servidor
    PORT: int = 3000

    # Base de datos: en producción (Railway) se provee DATABASE_URL completa.
    # En desarrollo local se pueden usar las variables sueltas (DB_HOST, etc.).
    DATABASE_URL: str = ""
    DB_HOST: str = "localhost"
    DB_USER: str = "root"
    DB_PASSWORD: str = ""
    DB_NAME: str = "tienda_tecnologica"
    DB_PORT: int = 3306

    # CORS: orígenes permitidos, separados por comas. "*" permite cualquiera.
    CORS_ORIGINS: str = "*"

    # JWT
    JWT_SECRET: str = "clave_secreta_temporal"
    JWT_EXPIRES_IN: str = "2h"
    JWT_ALGORITHM: str = "HS256"

    # Correo (recuperación de contraseña). Por defecto Gmail SMTP, pero el
    # host/puerto/TLS son configurables para otros proveedores de correo.
    EMAIL_HOST: str = "smtp.gmail.com"
    EMAIL_PORT: int = 587
    EMAIL_STARTTLS: bool = True
    EMAIL_USER: str = ""
    EMAIL_PASSWORD: str = ""

    # IA (Chatbot) — la clave vive SOLO en el .env, nunca en el código
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-2.0-flash"

    @property
    def database_url(self) -> str:
        # 1) Si existe DATABASE_URL (Railway) se usa tal cual, normalizando
        #    esquemas de MySQL que SQLAlchemy no entiende directamente.
        if self.DATABASE_URL:
            url = self.DATABASE_URL.strip()
            if url.startswith("mysql://"):
                url = url.replace("mysql://", "mysql+pymysql://", 1)
            elif url.startswith("mysql2://"):
                url = url.replace("mysql2://", "mysql+pymysql://", 1)
            return url
        # 2) Fallback: construirla desde las variables sueltas (local)
        return (
            f"mysql+pymysql://{self.DB_USER}:{self.DB_PASSWORD}"
            f"@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}?charset=utf8mb4"
        )

    @property
    def cors_origins(self) -> list[str]:
        return [origen.strip() for origen in self.CORS_ORIGINS.split(",") if origen.strip()]

    @property
    def jwt_expires_seconds(self) -> int:
        """Convierte '2h', '30m', '3600s' o '3600' (segundos) a segundos."""
        valor = str(self.JWT_EXPIRES_IN).strip().lower()
        coincidencia = re.match(r"^(\d+)\s*([hms]?)$", valor)
        if not coincidencia:
            return 7200  # 2 horas por defecto
        cantidad, unidad = coincidencia.groups()
        cantidad = int(cantidad)
        if unidad == "h":
            return cantidad * 3600
        if unidad == "m":
            return cantidad * 60
        return cantidad


@lru_cache
def get_settings() -> Settings:
    return Settings()


# ==========================================
# CONEXIÓN SQL (equivalente al pool de mysql2
# que usaba src/config/db.js en el backend en Node.js)
# ==========================================

settings = get_settings()

engine = create_engine(
    settings.database_url,
    pool_pre_ping=True,
    pool_recycle=1800,
    pool_size=10,
    max_overflow=5,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def get_db():
    """Dependencia de FastAPI: entrega una sesión de base de datos por request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
