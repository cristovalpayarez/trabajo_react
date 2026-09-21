"""
Configuración centralizada del backend.

La implementación vive en database.py; este archivo existe por
compatibilidad con los imports existentes (`from app.config import ...`).
Todos los valores sensibles (credenciales de base de datos, clave del JWT,
credenciales de correo) se leen desde variables de entorno (.env) y nunca
quedan escritos directamente en el código fuente.
"""

from app.database import Settings, get_settings

__all__ = ["Settings", "get_settings"]
