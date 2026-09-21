"""
/api/ventas — registro, consulta, historial y reportes de ventas.

Cada venta registrada genera automáticamente su factura de venta
(requisito 7 del quinto avance), así los módulos de facturación y los
dashboards quedan alimentados con información real.
"""

import random
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import (
    DetalleFactura, DetalleVenta, Factura, Producto, Servicio, Usuario, Venta,
)
from app.security import get_current_user, require_permission
from app.schemas import ActualizarEstadoVenta, DetalleVentaIn, VentaCreate, VentaOut

router = APIRouter(prefix="/api/ventas", tags=["Ventas"])

ROLES_STAFF = {"admin", "administrador", "empleado", "vendedor"}


# ============================================================
# FACTURACIÓN AUTOMÁTICA
# ============================================================


def _siguiente_numero_factura(db: Session) -> str:
    max_id = db.query(func.max(Factura.id)).scalar() or 0
    return f"NT-{max_id + 1:06d}"


def _crear_factura_desde_venta(db: Session, venta: Venta, usuario_id: int) -> Factura:
    """Genera la factura (y su detalle) a partir de una venta registrada."""
    factura = Factura(
        numero_factura=_siguiente_numero_factura(db),
        venta_id=venta.id,
        usuario_id=usuario_id,
        cliente_nombre=venta.cliente_nombre,
        cliente_documento=venta.cliente_documento,
        cliente_correo=venta.cliente_correo,
        subtotal=float(venta.subtotal),
        impuestos=float(venta.impuestos),
        descuento=float(venta.descuento),
        total=float(venta.total),
        estado="Pagada" if venta.estado == "Completada" else "Emitida",
    )

    for d in venta.detalles:
        factura.detalles.append(
            DetalleFactura(
                tipo=d.tipo,
                item_id=d.item_id,
                item_nombre=d.item_nombre,
                cantidad=d.cantidad,
                precio_unitario=float(d.precio_unitario),
                subtotal=float(d.subtotal),
            )
        )

    db.add(factura)
    db.commit()
    db.refresh(factura)
    return factura


@router.get("")
def listar_ventas(
    fecha_inicio: str = Query(default=None),
    fecha_fin: str = Query(default=None),
    cliente: str = Query(default=None),
    estado: str = Query(default=None),
    usuario_actual: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    es_staff = str(usuario_actual.get("rol", "")).lower() in ROLES_STAFF

    consulta = db.query(Venta).join(Usuario, Usuario.id == Venta.usuario_id)

    if not es_staff:
        consulta = consulta.filter(Venta.usuario_id == usuario_actual["id"])

    if fecha_inicio:
        try:
            fi = datetime.strptime(fecha_inicio, "%Y-%m-%d")
            consulta = consulta.filter(Venta.fecha_venta >= fi)
        except ValueError:
            pass

    if fecha_fin:
        try:
            ff = datetime.strptime(fecha_fin, "%Y-%m-%d") + timedelta(days=1)
            consulta = consulta.filter(Venta.fecha_venta < ff)
        except ValueError:
            pass

    if cliente:
        consulta = consulta.filter(Venta.cliente_nombre.ilike(f"%{cliente}%"))

    if estado:
        consulta = consulta.filter(Venta.estado == estado)

    ventas = consulta.order_by(Venta.id.desc()).all()

    resultado = []
    for venta in ventas:
        detalles_resumen = ", ".join(
            f"{d.item_nombre} x{d.cantidad}" for d in venta.detalles
        )
        resultado.append({
            "id": venta.id,
            "usuario_id": venta.usuario_id,
            "vendedor": f"{venta.usuario.nombre} {venta.usuario.apellido}".strip(),
            "cliente_nombre": venta.cliente_nombre,
            "cliente_documento": venta.cliente_documento,
            "cliente_correo": venta.cliente_correo,
            "subtotal": float(venta.subtotal),
            "impuestos": float(venta.impuestos),
            "descuento": float(venta.descuento),
            "total": float(venta.total),
            "estado": venta.estado,
            "observaciones": venta.observaciones,
            "fecha_venta": venta.fecha_venta.isoformat() if venta.fecha_venta else None,
            "detalles": [
                {
                    "tipo": d.tipo,
                    "item_nombre": d.item_nombre,
                    "cantidad": d.cantidad,
                    "precio_unitario": float(d.precio_unitario),
                    "descuento": float(d.descuento),
                    "subtotal": float(d.subtotal),
                }
                for d in venta.detalles
            ],
        })

    return {"ventas": resultado}


@router.post("", status_code=201)
def crear_venta(
    datos: VentaCreate,
    usuario_actual: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    subtotal = 0.0
    detalles_creados = []

    for item in datos.items:
        item_subtotal = item.precio_unitario * item.cantidad - item.descuento
        subtotal += item_subtotal
        detalles_creados.append(
            DetalleVenta(
                tipo=item.tipo,
                item_id=item.item_id,
                item_nombre=item.item_nombre,
                cantidad=item.cantidad,
                precio_unitario=item.precio_unitario,
                descuento=item.descuento,
                subtotal=item_subtotal,
            )
        )

    impuestos = subtotal * 0.19
    total = subtotal + impuestos - datos.descuento

    venta = Venta(
        usuario_id=usuario_actual["id"],
        cliente_nombre=datos.cliente_nombre,
        cliente_documento=datos.cliente_documento,
        cliente_correo=datos.cliente_correo,
        subtotal=subtotal,
        impuestos=impuestos,
        descuento=datos.descuento,
        total=total,
        estado="Completada",
        observaciones=datos.observaciones,
    )

    for d in detalles_creados:
        venta.detalles.append(d)

    db.add(venta)
    db.commit()
    db.refresh(venta)

    # La factura de venta se genera automáticamente (requisito 7)
    factura = _crear_factura_desde_venta(db, venta, usuario_actual["id"])

    return {
        "mensaje": "Venta registrada correctamente",
        "ventaId": venta.id,
        "total": total,
        "facturaId": factura.id,
        "numero_factura": factura.numero_factura,
    }


@router.post("/demo", status_code=201)
def generar_ventas_demo(
    cantidad: int = Query(default=15, ge=1, le=60),
    usuario_actual: dict = Depends(require_permission("ventas.ver")),
    db: Session = Depends(get_db),
):
    """
    Genera ventas de ejemplo repartidas en los últimos 60 días para que los
    gráficos y los reportes del dashboard se vean con información real.
    Útil para las evidencias del quinto avance.
    """
    productos = db.query(Producto).filter(Producto.estado == "Activo").all()
    servicios = db.query(Servicio).filter(Servicio.estado == "Activo").all()

    if not productos and not servicios:
        raise HTTPException(
            status_code=400,
            detail={"mensaje": "No hay productos ni servicios activos para generar las ventas"},
        )

    clientes_demo = [
        ("Ana María Rodríguez", "1023456789", "ana.rodriguez@correo.com"),
        ("Luis Fernando Gómez", "1034567890", "luis.gomez@correo.com"),
        ("Carla Sofía Ramírez", "1045678901", "carla.ramirez@correo.com"),
        ("Andrés Felipe Torres", "1056789012", "andres.torres@correo.com"),
        ("Juliana Ospina Ríos", "1067890123", "juliana.ospina@correo.com"),
        ("Daniel Esteban Cruz", "1078901234", "daniel.cruz@correo.com"),
        ("Valentina Herrera", "1089012345", "valentina.herrera@correo.com"),
        ("Sebastián Morales", "1090123456", "sebastian.morales@correo.com"),
    ]

    # Se reparte el estado para que los indicadores y filtros tengan variedad
    estados = ["Completada"] * 7 + ["Pendiente"] + ["Completada"] + ["Cancelada"]

    ventas_creadas = 0
    facturas_creadas = 0

    for _ in range(cantidad):
        cliente = random.choice(clientes_demo)
        estado = random.choice(estados)

        items = []
        for _ in range(random.randint(1, 2)):
            if servicios and (not productos or random.random() < 0.3):
                servicio = random.choice(servicios)
                items.append(
                    DetalleVentaIn(
                        tipo="servicio",
                        item_id=servicio.id,
                        item_nombre=servicio.nombre,
                        cantidad=1,
                        precio_unitario=float(servicio.precio),
                        descuento=0,
                    )
                )
            else:
                producto = random.choice(productos)
                items.append(
                    DetalleVentaIn(
                        tipo="producto",
                        item_id=producto.id,
                        item_nombre=producto.nombre,
                        cantidad=random.randint(1, 2),
                        precio_unitario=float(producto.precio),
                        descuento=0,
                    )
                )

        subtotal = sum(i.precio_unitario * i.cantidad - i.descuento for i in items)
        impuestos = subtotal * 0.19
        descuento_venta = round(subtotal * 0.05, 2) if random.random() < 0.25 else 0
        total = subtotal + impuestos - descuento_venta

        venta = Venta(
            usuario_id=usuario_actual["id"],
            cliente_nombre=cliente[0],
            cliente_documento=cliente[1],
            cliente_correo=cliente[2],
            subtotal=subtotal,
            impuestos=impuestos,
            descuento=descuento_venta,
            total=total,
            estado=estado,
            observaciones="Venta de ejemplo generada para las evidencias del dashboard",
            fecha_venta=datetime.now()
            - timedelta(days=random.randint(0, 60), hours=random.randint(0, 10)),
        )

        for item in items:
            venta.detalles.append(
                DetalleVenta(
                    tipo=item.tipo,
                    item_id=item.item_id,
                    item_nombre=item.item_nombre,
                    cantidad=item.cantidad,
                    precio_unitario=item.precio_unitario,
                    descuento=item.descuento,
                    subtotal=item.precio_unitario * item.cantidad - item.descuento,
                )
            )

        db.add(venta)
        db.commit()
        db.refresh(venta)
        ventas_creadas += 1

        if venta.estado != "Cancelada":
            _crear_factura_desde_venta(db, venta, usuario_actual["id"])
            facturas_creadas += 1

    return {
        "mensaje": f"Se generaron {ventas_creadas} ventas de ejemplo",
        "ventas_creadas": ventas_creadas,
        "facturas_creadas": facturas_creadas,
    }


@router.get("/reporte-diario")
def reporte_diario(
    fecha: str = Query(default=None, description="Fecha en formato YYYY-MM-DD"),
    usuario_actual: dict = Depends(require_permission("ventas.reportes")),
    db: Session = Depends(get_db),
):
    if fecha:
        try:
            fecha_obj = datetime.strptime(fecha, "%Y-%m-%d").date()
        except ValueError:
            raise HTTPException(status_code=400, detail={"mensaje": "Formato de fecha inválido. Use YYYY-MM-DD"})
    else:
        fecha_obj = datetime.now().date()

    inicio = datetime.combine(fecha_obj, datetime.min.time())
    fin = inicio + timedelta(days=1)

    ventas = (
        db.query(Venta)
        .filter(Venta.fecha_venta >= inicio, Venta.fecha_venta < fin)
        .order_by(Venta.id.desc())
        .all()
    )

    total_ventas = len(ventas)
    total_ingresos = sum(float(v.total) for v in ventas)

    items = []
    for v in ventas:
        productos = ", ".join(f"{d.item_nombre} x{d.cantidad}" for d in v.detalles)
        items.append({
            "id": v.id,
            "fecha": v.fecha_venta.isoformat() if v.fecha_venta else None,
            "cliente": v.cliente_nombre or "N/A",
            "productos": productos or "Sin detalles",
            "cantidad_total": sum(d.cantidad for d in v.detalles),
            "total": float(v.total),
            "estado": v.estado,
        })

    return {
        "fecha": fecha_obj.isoformat(),
        "total_ventas": total_ventas,
        "total_ingresos": total_ingresos,
        "ventas": items,
    }


@router.get("/estadisticas")
def estadisticas_ventas(
    fecha_inicio: str = Query(default=None),
    fecha_fin: str = Query(default=None),
    usuario_actual: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    consulta = db.query(Venta)

    if fecha_inicio:
        try:
            fi = datetime.strptime(fecha_inicio, "%Y-%m-%d")
            consulta = consulta.filter(Venta.fecha_venta >= fi)
        except ValueError:
            pass

    if fecha_fin:
        try:
            ff = datetime.strptime(fecha_fin, "%Y-%m-%d") + timedelta(days=1)
            consulta = consulta.filter(Venta.fecha_venta < ff)
        except ValueError:
            pass

    ventas = consulta.all()

    total_ventas = len(ventas)
    total_ingresos = sum(float(v.total) for v in ventas)
    ventas_completadas = sum(1 for v in ventas if v.estado == "Completada")
    ventas_canceladas = sum(1 for v in ventas if v.estado == "Cancelada")

    return {
        "total_ventas": total_ventas,
        "total_ingresos": total_ingresos,
        "ventas_completadas": ventas_completadas,
        "ventas_canceladas": ventas_canceladas,
    }


@router.get("/{venta_id}")
def obtener_venta(
    venta_id: int,
    usuario_actual: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    venta = db.query(Venta).filter(Venta.id == venta_id).first()
    if not venta:
        raise HTTPException(status_code=404, detail={"mensaje": "Venta no encontrada"})

    return {
        "id": venta.id,
        "usuario_id": venta.usuario_id,
        "vendedor": f"{venta.usuario.nombre} {venta.usuario.apellido}".strip(),
        "cliente_nombre": venta.cliente_nombre,
        "cliente_documento": venta.cliente_documento,
        "cliente_correo": venta.cliente_correo,
        "subtotal": float(venta.subtotal),
        "impuestos": float(venta.impuestos),
        "descuento": float(venta.descuento),
        "total": float(venta.total),
        "estado": venta.estado,
        "observaciones": venta.observaciones,
        "fecha_venta": venta.fecha_venta.isoformat() if venta.fecha_venta else None,
        "detalles": [
            {
                "tipo": d.tipo,
                "item_nombre": d.item_nombre,
                "cantidad": d.cantidad,
                "precio_unitario": float(d.precio_unitario),
                "descuento": float(d.descuento),
                "subtotal": float(d.subtotal),
            }
            for d in venta.detalles
        ],
    }


@router.patch("/{venta_id}/estado")
def actualizar_estado_venta(
    venta_id: int,
    datos: ActualizarEstadoVenta,
    usuario_actual: dict = Depends(require_permission("ventas.ver")),
    db: Session = Depends(get_db),
):
    venta = db.query(Venta).filter(Venta.id == venta_id).first()
    if not venta:
        raise HTTPException(status_code=404, detail={"mensaje": "Venta no encontrada"})

    venta.estado = datos.estado
    db.commit()

    return {"mensaje": "Estado de venta actualizado", "estado": datos.estado}
