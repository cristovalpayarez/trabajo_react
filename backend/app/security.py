"""
Todo lo relacionado con "quién eres y qué puedes hacer":

- Hashing de contraseñas (bcrypt) y emisión/verificación de JWT.
- Dependencias de FastAPI para leer el JWT de cada request (autenticación)
  y para exigir un permiso concreto según el rol (autorización), respaldado
  en las tablas roles / permisos / rol_permisos de la base de datos.

Antes esto vivía repartido en dos archivos (security.py + deps.py); se
unificó aquí porque son la misma responsabilidad: seguridad de principio a
fin, desde que se genera el token hasta que se valida en cada endpoint.

bcrypt genera hashes con el mismo formato sin importar el lenguaje, así que
las contraseñas de usuarios creados con el backend anterior (Node.js +
bcryptjs) se siguen verificando correctamente aquí.
"""

from datetime import datetime, timedelta, timezone
from typing import Any

from fastapi import Depends, HTTPException, Request, status
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from app.database import get_db, get_settings
from app.models import Permiso, Rol, RolPermiso

settings = get_settings()

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


# ==========================================
# ROLES: nombres equivalentes
#
# La base de datos puede tener los roles escritos como 'admin' /
# 'empleado' / 'cliente' o como 'Administrador' / 'Empleado' / 'Cliente'
# (según cómo se haya cargado el script SQL). Estas reglas permiten que el
# código reconozca las dos formas y no dependa de mayúsculas ni del idioma.
# ==========================================

EQUIVALENCIAS_ROL = {
    "admin": "admin",
    "administrador": "admin",
    "administradora": "admin",
    "empleado": "empleado",
    "empleada": "empleado",
    "vendedor": "empleado",
    "vendedora": "empleado",
    "employee": "empleado",
    "cliente": "cliente",
    "customer": "cliente",
    "usuario": "cliente",
}


def normalizar_rol(nombre: str | None) -> str:
    """Devuelve el nombre canónico del rol (admin / empleado / cliente)."""
    clave = str(nombre or "").strip().lower()
    return EQUIVALENCIAS_ROL.get(clave, clave)


def buscar_rol(db: Session, nombre: str) -> "Rol | None":
    """Busca un rol soportando mayúsculas, acentos de idioma y sinónimos."""
    objetivo = normalizar_rol(nombre)
    for rol in db.query(Rol).all():
        if normalizar_rol(rol.nombre) == objetivo:
            return rol
    return None


# ==========================================
# CONTRASEÑAS
# ==========================================


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    try:
        return pwd_context.verify(password, password_hash)
    except ValueError:
        return False


# ==========================================
# JWT
# ==========================================


def create_access_token(data: dict[str, Any]) -> str:
    to_encode = data.copy()
    expira = datetime.now(timezone.utc) + timedelta(seconds=settings.jwt_expires_seconds)
    to_encode.update({"exp": expira})
    return jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)


def decode_access_token(token: str) -> dict[str, Any] | None:
    try:
        return jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
    except JWTError:
        return None


# ==========================================
# DEPENDENCIAS: autenticación (¿quién eres?)
# ==========================================


def get_current_user(request: Request) -> dict:
    """Extrae y valida el JWT del encabezado Authorization: Bearer <token>."""
    auth_header = request.headers.get("Authorization")

    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"mensaje": "Token no proporcionado"},
        )

    token = auth_header.split(" ", 1)[1]
    payload = decode_access_token(token)

    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"mensaje": "Token inválido o expirado"},
        )

    return payload  # {"id": ..., "correo": ..., "rol": ..., "exp": ...}


# ==========================================
# DEPENDENCIAS: autorización (¿qué puedes hacer?)
# ==========================================


def require_permission(codigo: str):
    """
    Devuelve una dependencia que exige que el rol del usuario autenticado
    tenga el permiso `codigo` (según la tabla rol_permisos). Es la versión
    en base de datos de los antiguos middlewares requireAdmin/requireStaff.
    """

    def verificador(
        usuario_actual: dict = Depends(get_current_user),
        db: Session = Depends(get_db),
    ) -> dict:
        rol_usuario = buscar_rol(db, usuario_actual.get("rol", ""))

        tiene_permiso = (
            rol_usuario is not None
            and db.query(RolPermiso)
            .join(Permiso, Permiso.id == RolPermiso.permiso_id)
            .filter(RolPermiso.rol_id == rol_usuario.id, Permiso.codigo == codigo)
            .first()
            is not None
        )

        if not tiene_permiso:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={"mensaje": "No tienes permisos para realizar esta operación"},
            )

        return usuario_actual

    return verificador
