"""
/api/facturas — generación, consulta y descarga de facturas.
"""

from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Factura, DetalleFactura, Venta, DetalleVenta, Usuario
from app.security import get_current_user, require_permission
from app.schemas import FacturaCreate, FacturaOut

router = APIRouter(prefix="/api/facturas", tags=["Facturas"])

ROLES_STAFF = {"admin", "administrador", "empleado", "vendedor"}


def _generar_numero_factura(db: Session) -> str:
    from sqlalchemy import func
    max_id = db.query(func.max(Factura.id)).scalar() or 0
    return f"NT-{max_id + 1:06d}"


@router.get("")
def listar_facturas(
    cliente: str = Query(default=None),
    fecha: str = Query(default=None),
    estado: str = Query(default=None),
    usuario_actual: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    es_staff = str(usuario_actual.get("rol", "")).lower() in ROLES_STAFF

    consulta = db.query(Factura)

    if not es_staff:
        consulta = consulta.filter(Factura.usuario_id == usuario_actual["id"])

    if cliente:
        consulta = consulta.filter(Factura.cliente_nombre.ilike(f"%{cliente}%"))

    if fecha:
        try:
            from datetime import timedelta
            fecha_obj = datetime.strptime(fecha, "%Y-%m-%d")
            fecha_fin = fecha_obj + timedelta(days=1)
            consulta = consulta.filter(
                Factura.fecha_factura >= fecha_obj,
                Factura.fecha_factura < fecha_fin,
            )
        except ValueError:
            pass

    if estado:
        consulta = consulta.filter(Factura.estado == estado)

    facturas = consulta.order_by(Factura.id.desc()).all()

    resultado = []
    for f in facturas:
        resultado.append({
            "id": f.id,
            "numero_factura": f.numero_factura,
            "venta_id": f.venta_id,
            "usuario_id": f.usuario_id,
            "cliente_nombre": f.cliente_nombre,
            "cliente_documento": f.cliente_documento,
            "cliente_correo": f.cliente_correo,
            "subtotal": float(f.subtotal),
            "impuestos": float(f.impuestos),
            "descuento": float(f.descuento),
            "total": float(f.total),
            "estado": f.estado,
            "fecha_factura": f.fecha_factura.isoformat() if f.fecha_factura else None,
        })

    return {"facturas": resultado}


@router.post("", status_code=201)
def crear_factura(
    datos: FacturaCreate,
    usuario_actual: dict = Depends(require_permission("facturas.crear")),
    db: Session = Depends(get_db),
):
    numero = _generar_numero_factura(db)

    subtotal = datos.subtotal or 0
    impuestos = datos.impuestos or 0
    descuento = datos.descuento or 0
    total = datos.total or 0

    if datos.venta_id:
        venta = db.query(Venta).filter(Venta.id == datos.venta_id).first()
        if not venta:
            raise HTTPException(status_code=404, detail={"mensaje": "Venta no encontrada"})
        subtotal = float(venta.subtotal)
        impuestos = float(venta.impuestos)
        descuento = float(venta.descuento)
        total = float(venta.total)
        if not datos.cliente_nombre:
            datos.cliente_nombre = venta.cliente_nombre
        if not datos.cliente_documento:
            datos.cliente_documento = venta.cliente_documento
        if not datos.cliente_correo:
            datos.cliente_correo = venta.cliente_correo

    factura = Factura(
        numero_factura=numero,
        venta_id=datos.venta_id,
        usuario_id=usuario_actual["id"],
        cliente_nombre=datos.cliente_nombre,
        cliente_documento=datos.cliente_documento,
        cliente_correo=datos.cliente_correo,
        cliente_direccion=datos.cliente_direccion,
        subtotal=subtotal,
        impuestos=impuestos,
        descuento=descuento,
        total=total,
        estado="Emitida",
        observaciones=datos.observaciones,
    )

    if datos.venta_id:
        venta = db.query(Venta).filter(Venta.id == datos.venta_id).first()
        if venta:
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

    if datos.items and not datos.venta_id:
        for item in datos.items:
            item_subtotal = item.precio_unitario * item.cantidad
            factura.detalles.append(
                DetalleFactura(
                    tipo=item.tipo,
                    item_id=item.item_id,
                    item_nombre=item.item_nombre,
                    cantidad=item.cantidad,
                    precio_unitario=item.precio_unitario,
                    subtotal=item_subtotal,
                )
            )

    db.add(factura)
    db.commit()
    db.refresh(factura)

    return {"mensaje": "Factura creada correctamente", "numero_factura": numero, "facturaId": factura.id}


@router.get("/{factura_id}")
def obtener_factura(
    factura_id: int,
    usuario_actual: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    factura = db.query(Factura).filter(Factura.id == factura_id).first()
    if not factura:
        raise HTTPException(status_code=404, detail={"mensaje": "Factura no encontrada"})

    return {
        "id": factura.id,
        "numero_factura": factura.numero_factura,
        "venta_id": factura.venta_id,
        "usuario_id": factura.usuario_id,
        "cliente_nombre": factura.cliente_nombre,
        "cliente_documento": factura.cliente_documento,
        "cliente_correo": factura.cliente_correo,
        "cliente_direccion": factura.cliente_direccion,
        "subtotal": float(factura.subtotal),
        "impuestos": float(factura.impuestos),
        "descuento": float(factura.descuento),
        "total": float(factura.total),
        "estado": factura.estado,
        "observaciones": factura.observaciones,
        "fecha_factura": factura.fecha_factura.isoformat() if factura.fecha_factura else None,
        "detalles": [
            {
                "tipo": d.tipo,
                "item_nombre": d.item_nombre,
                "cantidad": d.cantidad,
                "precio_unitario": d.precio_unitario,
                "subtotal": d.subtotal,
            }
            for d in factura.detalles
        ],
    }


@router.get("/{factura_id}/pdf")
def descargar_factura_pdf(
    factura_id: int,
    usuario_actual: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    from app.factura_pdf import generar_factura_pdf_desde_factura

    factura = db.query(Factura).filter(Factura.id == factura_id).first()
    if not factura:
        raise HTTPException(status_code=404, detail={"mensaje": "Factura no encontrada"})

    pdf_bytes = generar_factura_pdf_desde_factura(factura)

    return StreamingResponse(
        iter([pdf_bytes]),
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={factura.numero_factura}.pdf"},
    )


@router.patch("/{factura_id}/estado")
def actualizar_estado_factura(
    factura_id: int,
    estado: str = Query(...),
    usuario_actual: dict = Depends(require_permission("facturas.ver")),
    db: Session = Depends(get_db),
):
    factura = db.query(Factura).filter(Factura.id == factura_id).first()
    if not factura:
        raise HTTPException(status_code=404, detail={"mensaje": "Factura no encontrada"})

    factura.estado = estado
    db.commit()

    return {"mensaje": "Estado de factura actualizado", "estado": estado}
