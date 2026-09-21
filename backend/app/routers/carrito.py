"""
/api/carrito — gestión del carrito de compras del usuario.

Mantiene un carrito persistente por usuario (uno por cuenta) con
agregar / actualizar / eliminar productos. Al confirmar el pedido
se crea el Pedido, se descuenta el stock y se genera la factura PDF
que se envía por correo al cliente.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Carrito, CarritoItem, DetallePedido, Pedido, Producto, Usuario
from app.schemas import PedidoCreate
from app.security import get_current_user

router = APIRouter(prefix="/api/carrito", tags=["Carrito"])


def _obtener_o_crear_carrito(usuario_id: int, db: Session) -> Carrito:
    carrito = db.query(Carrito).filter(Carrito.usuario_id == usuario_id).first()
    if not carrito:
        carrito = Carrito(usuario_id=usuario_id)
        db.add(carrito)
        db.commit()
        db.refresh(carrito)
    return carrito


def _calcular_total(items: list[CarritoItem]) -> float:
    return float(sum(item.producto.precio * item.cantidad for item in items))


@router.get("")
def ver_carrito(usuario_actual: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    carrito = _obtener_o_crear_carrito(usuario_actual["id"], db)
    items = db.query(CarritoItem).filter(CarritoItem.carrito_id == carrito.id).all()

    resultado = []
    for item in items:
        resultado.append(
            {
                "id": item.id,
                "producto_id": item.producto_id,
                "nombre": item.producto.nombre,
                "marca": item.producto.marca,
                "modelo": item.producto.modelo,
                "precio": float(item.producto.precio),
                "cantidad": item.cantidad,
                "subtotal": float(item.producto.precio * item.cantidad),
                "stock_disponible": item.producto.stock,
                "imagen": item.producto.imagen,
                "estado": item.producto.estado,
            }
        )

    return {
        "items": resultado,
        "total": _calcular_total(items),
        "cantidad_total": sum(item.cantidad for item in items),
    }


@router.post("/items")
def agregar_al_carrito(
    producto_id: int,
    cantidad: int = 1,
    usuario_actual: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if cantidad < 1:
        raise HTTPException(status_code=400, detail={"mensaje": "La cantidad debe ser al menos 1"})

    producto = (
        db.query(Producto)
        .filter(Producto.id == producto_id, Producto.estado == "Activo")
        .with_for_update()
        .first()
    )
    if not producto:
        raise HTTPException(status_code=404, detail={"mensaje": "Producto no encontrado o no disponible"})

    carrito = _obtener_o_crear_carrito(usuario_actual["id"], db)
    item_existente = (
        db.query(CarritoItem)
        .filter(CarritoItem.carrito_id == carrito.id, CarritoItem.producto_id == producto_id)
        .first()
    )

    nueva_cantidad = cantidad
    if item_existente:
        nueva_cantidad += item_existente.cantidad

    if nueva_cantidad > producto.stock:
        raise HTTPException(
            status_code=409,
            detail={
                "mensaje": f"Stock insuficiente. Disponible: {producto.stock} unidades."
            },
        )

    if item_existente:
        item_existente.cantidad = nueva_cantidad
    else:
        item_existente = CarritoItem(
            carrito_id=carrito.id,
            producto_id=producto.id,
            cantidad=nueva_cantidad,
        )
        db.add(item_existente)

    db.commit()
    db.refresh(item_existente) if not item_existente.id else None

    return {
        "mensaje": "Producto agregado al carrito",
        "carrito_id": carrito.id,
        "cantidad": nueva_cantidad,
        "subtotal": float(producto.precio * nueva_cantidad),
    }


@router.put("/items/{item_id}")
def actualizar_item_carrito(
    item_id: int,
    cantidad: int,
    usuario_actual: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if cantidad < 1:
        raise HTTPException(status_code=400, detail={"mensaje": "La cantidad debe ser al menos 1"})

    item = (
        db.query(CarritoItem, Producto)
        .join(Producto, Producto.id == CarritoItem.producto_id)
        .filter(CarritoItem.id == item_id)
        .first()
    )
    if not item:
        raise HTTPException(status_code=404, detail={"mensaje": "Item del carrito no encontrado"})

    carrito_item, producto = item
    if carrito_item.carrito.usuario_id != usuario_actual["id"]:
        raise HTTPException(status_code=403, detail={"mensaje": "No tienes permiso para modificar este carrito"})

    if cantidad > producto.stock:
        raise HTTPException(
            status_code=409,
            detail={"mensaje": f"Stock insuficiente. Disponible: {producto.stock} unidades."},
        )

    carrito_item.cantidad = cantidad
    db.commit()

    return {
        "mensaje": "Cantidad actualizada",
        "producto_id": producto.id,
        "cantidad": cantidad,
        "subtotal": float(producto.precio * cantidad),
    }


@router.delete("/items/{item_id}")
def eliminar_item_carrito(
    item_id: int,
    usuario_actual: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    item = (
        db.query(CarritoItem)
        .join(Carrito, Carrito.id == CarritoItem.carrito_id)
        .filter(CarritoItem.id == item_id, Carrito.usuario_id == usuario_actual["id"])
        .first()
    )
    if not item:
        raise HTTPException(status_code=404, detail={"mensaje": "Item del carrito no encontrado"})

    db.delete(item)
    db.commit()

    return {"mensaje": "Producto eliminado del carrito"}


@router.delete("")
def vaciar_carrito(usuario_actual: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    carrito = db.query(Carrito).filter(Carrito.usuario_id == usuario_actual["id"]).first()
    if carrito:
        db.query(CarritoItem).filter(CarritoItem.carrito_id == carrito.id).delete()
        db.commit()

    return {"mensaje": "Carrito vaciado"}


@router.post("/checkout", status_code=201)
def confirmar_pedido(
    datos: PedidoCreate,
    usuario_actual: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    carrito = db.query(Carrito).filter(Carrito.usuario_id == usuario_actual["id"]).first()
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
        usuario_id=usuario_actual["id"],
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

    return {
        "mensaje": "Pedido creado correctamente",
        "pedidoId": pedido.id,
        "total": total,
        "estado": pedido.estado,
        "factura_generada": True,
    }
