"""
/api/checkout — confirmación de pedido con generación de factura PDF y envío por correo.

Este endpoint extiende el flujo de pago: al crear el pedido también
- registra la VENTA de los productos comprados desde el sitio web
  (requisito 1 del quinto avance),
- genera su FACTURA de venta (requisito 7), de modo que los dashboards,
  los reportes y el módulo de facturación muestren las ventas reales, y
- genera un PDF de factura que se envía al correo del cliente.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.email_utils import enviar_factura_pdf
from app.models import (
    Carrito,
    CarritoItem,
    DetallePedido,
    DetalleVenta,
    Pedido,
    Producto,
    Usuario,
    Venta,
)
from app.schemas import PedidoCreate
from app.security import get_current_user

router = APIRouter(prefix="/api/checkout", tags=["Checkout"])


@router.post("/", status_code=201)
def checkout_con_factura(
    datos: PedidoCreate,
    usuario_actual: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    usuario_id = usuario_actual["id"]

    carrito = db.query(Carrito).filter(Carrito.usuario_id == usuario_id).first()
    if not carrito:
        raise HTTPException(status_code=400, detail={"mensaje": "No hay carrito para este usuario"})

    items_carrito = db.query(CarritoItem).filter(CarritoItem.carrito_id == carrito.id).all()
    if not items_carrito:
        raise HTTPException(status_code=400, detail={"mensaje": "El carrito está vacío"})

    db.refresh(carrito.usuario)

    total = 0.0
    detalles_pedido: list[DetallePedido] = []

    for item in items_carrito:
        producto = item.producto
        if producto.stock < item.cantidad:
            raise HTTPException(
                status_code=409,
                detail={
                    "mensaje": f"Stock insuficiente para '{producto.nombre}'. Disponible: {producto.stock}"
                },
            )

        total += float(producto.precio) * item.cantidad
        detalles_pedido.append(
            DetallePedido(
                producto_id=producto.id,
                producto_nombre=producto.nombre,
                precio_unitario=producto.precio,
                cantidad=item.cantidad,
            )
        )
        producto.stock -= item.cantidad

    pedido = Pedido(
        usuario_id=usuario_id,
        total=total,
        estado="Pendiente",
        direccion_envio=datos.direccion_envio or carrito.usuario.direccion,
        factura_enviada=False,
    )
    pedido.detalles = detalles_pedido
    db.add(pedido)
    db.commit()
    db.refresh(pedido)

    carrito.items.clear()
    db.commit()

    usuario = carrito.usuario
    db.refresh(usuario)

    # ============================================================
    # La compra del sitio web queda registrada como VENTA (requisito 1)
    # y genera automáticamente su FACTURA (requisito 7), para que los
    # dashboards, los reportes y el historial de ventas muestren las
    # ventas reales hechas por los clientes.
    # ============================================================
    from app.routers.ventas import _crear_factura_desde_venta

    subtotal_venta = float(total)
    impuestos_venta = round(subtotal_venta * 0.19, 2)
    total_venta = round(subtotal_venta + impuestos_venta, 2)

    venta = Venta(
        usuario_id=usuario_id,
        cliente_nombre=f"{usuario.nombre} {usuario.apellido}".strip(),
        cliente_documento=usuario.numero_documento,
        cliente_correo=usuario.correo,
        subtotal=subtotal_venta,
        impuestos=impuestos_venta,
        descuento=0,
        total=total_venta,
        estado="Completada",
        observaciones=f"Venta generada desde el sitio web (pedido #{pedido.id})",
    )

    for detalle in pedido.detalles:
        venta.detalles.append(
            DetalleVenta(
                tipo="producto",
                item_id=detalle.producto_id,
                item_nombre=detalle.producto_nombre,
                cantidad=detalle.cantidad,
                precio_unitario=float(detalle.precio_unitario),
                descuento=0,
                subtotal=float(detalle.precio_unitario) * detalle.cantidad,
            )
        )

    db.add(venta)
    db.commit()
    db.refresh(venta)

    factura = _crear_factura_desde_venta(db, venta, usuario_id)

    factura_enviada = enviar_factura_pdf(usuario.correo, usuario.nombre, pedido.id, total)
    if factura_enviada:
        pedido.factura_enviada = True
        db.commit()
    else:
        print(f"[checkout] Factura pendiente para pedido {pedido.id}, usuario {usuario.correo}")

    return {
        "mensaje": "Pedido creado correctamente",
        "pedidoId": pedido.id,
        "total": total,
        "ventaId": venta.id,
        "facturaId": factura.id,
        "numero_factura": factura.numero_factura,
        "total_con_iva": total_venta,
        "estado": pedido.estado,
        "factura_enviada": pedido.factura_enviada,
        "factura_aviso": "La factura se enviará a tu correo cuando el servidor tenga configuradas las credenciales de correo (EMAIL_USER/EMAIL_PASSWORD)"
        if not factura_enviada
        else None,
        "cliente": {
            "nombre": f"{usuario.nombre} {usuario.apellido}",
            "correo": usuario.correo,
        },
    }
