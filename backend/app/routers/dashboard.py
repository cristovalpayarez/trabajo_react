"""
/api/dashboard — estadísticas e indicadores para dashboards.
"""

from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db, get_settings
from app.models import (
    ChatConversacion, DetalleVenta, Factura, PQR, Producto, Servicio,
    Usuario, Venta,
)
from app.security import get_current_user, require_permission

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])

settings = get_settings()


@router.get("/stats")
def estadisticas_generales(
    usuario_actual: dict = Depends(require_permission("dashboard.ver_stats")),
    db: Session = Depends(get_db),
):
    total_usuarios = db.query(func.count(Usuario.id)).scalar() or 0
    total_productos = db.query(func.count(Producto.id)).scalar() or 0
    total_servicios = db.query(func.count(Servicio.id)).scalar() or 0
    total_ventas = db.query(func.count(Venta.id)).scalar() or 0
    total_facturas = db.query(func.count(Factura.id)).scalar() or 0
    total_pqr = db.query(func.count(PQR.id)).scalar() or 0
    pqr_pendientes = db.query(func.count(PQR.id)).filter(PQR.estado == "Pendiente").scalar() or 0

    hoy = datetime.now().date()
    inicio_hoy = datetime.combine(hoy, datetime.min.time())
    fin_hoy = inicio_hoy + timedelta(days=1)

    ventas_hoy = (
        db.query(func.count(Venta.id))
        .filter(Venta.fecha_venta >= inicio_hoy, Venta.fecha_venta < fin_hoy)
        .scalar() or 0
    )

    facturacion_hoy = (
        db.query(func.coalesce(func.sum(Venta.total), 0))
        .filter(Venta.fecha_venta >= inicio_hoy, Venta.fecha_venta < fin_hoy)
        .scalar() or 0
    )

    return {
        "total_usuarios": total_usuarios,
        "total_productos": total_productos,
        "total_servicios": total_servicios,
        "total_ventas": total_ventas,
        "total_facturas": total_facturas,
        "total_pqr": total_pqr,
        "pqr_pendientes": pqr_pendientes,
        "ventas_hoy": int(ventas_hoy),
        "facturacion_hoy": float(facturacion_hoy),
    }


@router.get("/ventas-por-dia")
def ventas_por_dia(
    dias: int = Query(default=30, ge=1, le=365),
    usuario_actual: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    desde = datetime.now() - timedelta(days=dias)

    ventas = (
        db.query(Venta)
        .filter(Venta.fecha_venta >= desde)
        .all()
    )

    data = {}
    for v in ventas:
        if v.fecha_venta:
            dia = v.fecha_venta.strftime("%Y-%m-%d")
            if dia not in data:
                data[dia] = {"fecha": dia, "total_ventas": 0, "total_ingresos": 0}
            data[dia]["total_ventas"] += 1
            data[dia]["total_ingresos"] += float(v.total)

    resultado = sorted(data.values(), key=lambda x: x["fecha"])

    return {"ventas_por_dia": resultado}


@router.get("/ventas-por-mes")
def ventas_por_mes(
    meses: int = Query(default=12, ge=1, le=24),
    usuario_actual: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    desde = datetime.now() - timedelta(days=meses * 30)

    ventas = (
        db.query(Venta)
        .filter(Venta.fecha_venta >= desde)
        .all()
    )

    data = {}
    for v in ventas:
        if v.fecha_venta:
            mes = v.fecha_venta.strftime("%Y-%m")
            if mes not in data:
                data[mes] = {"mes": mes, "total_ventas": 0, "total_ingresos": 0}
            data[mes]["total_ventas"] += 1
            data[mes]["total_ingresos"] += float(v.total)

    resultado = sorted(data.values(), key=lambda x: x["mes"])

    return {"ventas_por_mes": resultado}


@router.get("/stats-ventas")
def stats_ventas(
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

    return {
        "total_ventas": len(ventas),
        "total_ingresos": sum(float(v.total) for v in ventas),
        "ventas_completadas": sum(1 for v in ventas if v.estado == "Completada"),
        "ventas_canceladas": sum(1 for v in ventas if v.estado == "Cancelada"),
    }
