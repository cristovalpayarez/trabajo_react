"""
/api/pedidos — creación de pedidos (con descuento de stock) y consulta /
cambio de estado. Espejo de pedidoController.js.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import DetallePedido, Pedido, Producto, Usuario
from app.security import get_current_user, require_permission
from app.schemas import ActualizarEstadoPedido, PedidoCreate

router = APIRouter(prefix="/api/pedidos", tags=["Pedidos"])

ROLES_STAFF = {"admin", "administrador", "empleado", "vendedor"}


@router.get("")
def listar_pedidos(
    usuario_actual: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    es_staff = str(usuario_actual.get("rol", "")).lower() in ROLES_STAFF

    consulta = db.query(Pedido).join(Usuario, Usuario.id == Pedido.usuario_id)
    if not es_staff:
        consulta = consulta.filter(Pedido.usuario_id == usuario_actual["id"])

    pedidos = consulta.order_by(Pedido.id.desc()).all()

    resultado = []
    for pedido in pedidos:
        productos_resumen = ", ".join(
            f"{detalle.producto_nombre} x{detalle.cantidad}" for detalle in pedido.detalles
        )
        resultado.append(
            {
                "id": pedido.id,
                "usuario_id": pedido.usuario_id,
                "cliente": f"{pedido.usuario.nombre} {pedido.usuario.apellido}".strip(),
                "correo": pedido.usuario.correo,
                "total": float(pedido.total),
                "estado": pedido.estado,
                "fecha_pedido": pedido.fecha_pedido,
                "productos": productos_resumen,
            }
        )

    return {"pedidos": resultado}


@router.post("", status_code=201)
def crear_pedido(
    datos: PedidoCreate,
    usuario_actual: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not datos.items:
        raise HTTPException(status_code=400, detail={"mensaje": "El pedido no tiene productos"})

    total = 0.0
    detalles: list[DetallePedido] = []

    for item in datos.items:
        producto = (
            db.query(Producto)
            .filter(Producto.id == item.producto_id, Producto.estado == "Activo")
            .with_for_update()
            .first()
        )
        if not producto or producto.stock < item.cantidad:
            raise HTTPException(
                status_code=409,
                detail={"mensaje": f"Stock insuficiente para el producto {item.producto_id}"},
            )

        total += float(producto.precio) * item.cantidad
        detalles.append(
            DetallePedido(
                producto_id=producto.id,
                producto_nombre=producto.nombre,
                precio_unitario=producto.precio,
                cantidad=item.cantidad,
            )
        )
        producto.stock -= item.cantidad

    pedido = Pedido(
        usuario_id=usuario_actual["id"],
        total=total,
        estado="Pendiente",
        direccion_envio=datos.direccion_envio,
    )
    pedido.detalles = detalles
    db.add(pedido)
    db.commit()
    db.refresh(pedido)

    return {"mensaje": "Pedido creado correctamente", "pedidoId": pedido.id, "total": total}


@router.patch("/{pedido_id}/estado", dependencies=[Depends(require_permission("pedidos.actualizar_estado"))])
@router.put("/{pedido_id}/estado", dependencies=[Depends(require_permission("pedidos.actualizar_estado"))])
def actualizar_estado_pedido(pedido_id: int, datos: ActualizarEstadoPedido, db: Session = Depends(get_db)):
    pedido = db.query(Pedido).filter(Pedido.id == pedido_id).first()
    if not pedido:
        raise HTTPException(status_code=404, detail={"mensaje": "Pedido no encontrado"})

    pedido.estado = datos.estado
    db.commit()

    return {"mensaje": "Estado actualizado correctamente", "estado": datos.estado}
