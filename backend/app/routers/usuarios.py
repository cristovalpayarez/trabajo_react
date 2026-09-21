"""
/api/usuarios — perfil propio, listado, cambio de estado, alta de
empleados y eliminación. Espejo de usuarioController.js.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import or_
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.models import DetallePedido, Pedido, Usuario
from app.schemas import (
    ActualizarEstadoUsuario,
    ActualizarPerfilRequest,
    ActualizarRolUsuario,
    ActualizarUsuarioAdmin,
    RegistroUsuario,
)
from app.security import buscar_rol, get_current_user, require_permission

router = APIRouter(prefix="/api/usuarios", tags=["Usuarios"])


@router.put("/perfil")
def actualizar_perfil(
    datos: ActualizarPerfilRequest,
    usuario_actual: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    usuario = db.query(Usuario).filter(Usuario.id == usuario_actual["id"]).first()
    if not usuario:
        raise HTTPException(status_code=404, detail={"mensaje": "Usuario no encontrado"})

    usuario.nombre = datos.nombre
    usuario.apellido = datos.apellido
    usuario.direccion = datos.direccion
    usuario.telefono = datos.telefono
    db.commit()
    db.refresh(usuario)

    return {
        "mensaje": "Datos actualizados correctamente",
        "usuario": {
            "id": usuario.id,
            "nombre": usuario.nombre,
            "apellido": usuario.apellido,
            "correo": usuario.correo,
            "direccion": usuario.direccion,
            "telefono": usuario.telefono,
            "rol": usuario.rol.nombre,
        },
    }


@router.get("", dependencies=[Depends(require_permission("usuarios.ver"))])
def listar_usuarios(db: Session = Depends(get_db)):
    usuarios = (
        db.query(Usuario).options(joinedload(Usuario.rol)).order_by(Usuario.id.desc()).all()
    )
    return {"usuarios": [_serializar_usuario(u) for u in usuarios]}


def _serializar_usuario(u: Usuario) -> dict:
    return {
        "id": u.id,
        "nombre": u.nombre,
        "apellido": u.apellido,
        "tipo_documento": u.tipo_documento,
        "numero_documento": u.numero_documento,
        "direccion": u.direccion,
        "telefono": u.telefono,
        "correo": u.correo,
        "estado": u.estado,
        "fecha_creacion": u.fecha_creacion,
        "rol": u.rol.nombre if u.rol else None,
    }


@router.get("/{usuario_id}", dependencies=[Depends(require_permission("usuarios.ver"))])
def obtener_usuario(usuario_id: int, db: Session = Depends(get_db)):
    usuario = (
        db.query(Usuario).options(joinedload(Usuario.rol)).filter(Usuario.id == usuario_id).first()
    )
    if not usuario:
        raise HTTPException(status_code=404, detail={"mensaje": "Usuario no encontrado"})
    return _serializar_usuario(usuario)


@router.put("/{usuario_id}", dependencies=[Depends(require_permission("usuarios.editar"))])
def actualizar_usuario_admin(usuario_id: int, datos: ActualizarUsuarioAdmin, db: Session = Depends(get_db)):
    usuario = db.query(Usuario).filter(Usuario.id == usuario_id).first()
    if not usuario:
        raise HTTPException(status_code=404, detail={"mensaje": "Usuario no encontrado"})

    correo_normalizado = datos.correo.strip().lower()
    documento_normalizado = datos.numero_documento.strip()

    duplicado = (
        db.query(Usuario)
        .filter(
            Usuario.id != usuario_id,
            or_(Usuario.correo == correo_normalizado, Usuario.numero_documento == documento_normalizado),
        )
        .first()
    )
    if duplicado:
        raise HTTPException(
            status_code=409,
            detail={"mensaje": "El correo o número de documento ya está registrado por otro usuario"},
        )

    usuario.nombre = datos.nombre
    usuario.apellido = datos.apellido
    usuario.tipo_documento = datos.tipo_documento
    usuario.numero_documento = documento_normalizado
    usuario.direccion = datos.direccion
    usuario.telefono = datos.telefono
    usuario.correo = correo_normalizado
    db.commit()
    db.refresh(usuario)

    return {"mensaje": "Usuario actualizado correctamente", "usuario": _serializar_usuario(usuario)}


@router.patch("/{usuario_id}/estado", dependencies=[Depends(require_permission("usuarios.gestionar_estado"))])
def actualizar_estado_usuario(
    usuario_id: int,
    datos: ActualizarEstadoUsuario,
    usuario_actual: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if usuario_id == int(usuario_actual["id"]):
        raise HTTPException(status_code=400, detail={"mensaje": "No puedes desactivar tu propia cuenta"})

    usuario = db.query(Usuario).filter(Usuario.id == usuario_id).first()
    if not usuario:
        raise HTTPException(status_code=404, detail={"mensaje": "Usuario no encontrado"})

    usuario.estado = datos.estado
    db.commit()

    return {"mensaje": "Estado del usuario actualizado", "estado": datos.estado}


@router.patch("/{usuario_id}/rol", dependencies=[Depends(require_permission("usuarios.editar"))])
def cambiar_rol_usuario(
    usuario_id: int,
    datos: ActualizarRolUsuario,
    usuario_actual: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Asigna un rol (admin / vendedor / empleado / cliente) a un usuario."""
    if usuario_id == int(usuario_actual["id"]):
        raise HTTPException(status_code=400, detail={"mensaje": "No puedes cambiar tu propio rol"})

    usuario = db.query(Usuario).filter(Usuario.id == usuario_id).first()
    if not usuario:
        raise HTTPException(status_code=404, detail={"mensaje": "Usuario no encontrado"})

    rol = buscar_rol(db, datos.rol)
    if not rol:
        raise HTTPException(status_code=400, detail={"mensaje": "El rol indicado no existe"})

    usuario.rol_id = rol.id
    db.commit()
    db.refresh(usuario)

    return {"mensaje": "Rol actualizado correctamente", "usuario": _serializar_usuario(usuario)}


@router.post(
    "/empleados",
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_permission("empleados.crear"))],
)
def registrar_empleado(datos: RegistroUsuario, db: Session = Depends(get_db)):
    from app.routers.auth import _registrar_con_rol  # evita import circular al cargar módulos

    usuario = _registrar_con_rol(datos, "empleado", db)
    return {"mensaje": "Usuario registrado correctamente", "usuarioId": usuario.id}


@router.delete("/{usuario_id}", dependencies=[Depends(require_permission("usuarios.eliminar"))])
def eliminar_usuario(
    usuario_id: int,
    usuario_actual: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if usuario_id == int(usuario_actual["id"]):
        raise HTTPException(status_code=400, detail={"mensaje": "No puedes eliminar tu propia cuenta"})

    usuario = db.query(Usuario).filter(Usuario.id == usuario_id).first()
    if not usuario:
        raise HTTPException(status_code=404, detail={"mensaje": "Usuario no encontrado"})

    # Elimina primero el detalle y los pedidos del usuario (equivalente a la
    # transacción que hacía Node con connection.beginTransaction()).
    pedido_ids = [p.id for p in db.query(Pedido.id).filter(Pedido.usuario_id == usuario_id).all()]
    if pedido_ids:
        db.query(DetallePedido).filter(DetallePedido.pedido_id.in_(pedido_ids)).delete(synchronize_session=False)
        db.query(Pedido).filter(Pedido.usuario_id == usuario_id).delete(synchronize_session=False)

    db.delete(usuario)
    db.commit()

    return {"mensaje": "Usuario eliminado correctamente"}
