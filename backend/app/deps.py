"""
Dependencias de FastAPI para autenticación (JWT) y autorización (permisos
por rol, respaldados en la base de datos: tablas roles / permisos /
rol_permisos).
"""

from fastapi import Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Permiso, Rol, RolPermiso
from app.security import decode_access_token


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
        nombre_rol = str(usuario_actual.get("rol", "")).strip().lower()

        tiene_permiso = (
            db.query(RolPermiso)
            .join(Rol, Rol.id == RolPermiso.rol_id)
            .join(Permiso, Permiso.id == RolPermiso.permiso_id)
            .filter(Rol.nombre == nombre_rol, Permiso.codigo == codigo)
            .first()
        )

        if not tiene_permiso:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={"mensaje": "No tienes permisos para realizar esta operación"},
            )

        return usuario_actual

    return verificador
