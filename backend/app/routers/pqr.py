"""
/api/pqr — peticiones, quejas y reclamos.
"""

from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import PQR, Usuario
from app.security import get_current_user, require_permission
from app.schemas import ActualizarEstadoPQR, PQRCreate, PQRResponse

router = APIRouter(prefix="/api/pqr", tags=["PQR"])

ROLES_STAFF = {"admin", "administrador", "empleado", "vendedor"}


@router.get("")
def listar_pqr(
    estado: str = Query(default=None),
    tipo: str = Query(default=None),
    usuario_actual: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    es_staff = str(usuario_actual.get("rol", "")).lower() in ROLES_STAFF

    consulta = db.query(PQR).join(Usuario, Usuario.id == PQR.usuario_id)

    if not es_staff:
        consulta = consulta.filter(PQR.usuario_id == usuario_actual["id"])

    if estado:
        consulta = consulta.filter(PQR.estado == estado)
    if tipo:
        consulta = consulta.filter(PQR.tipo == tipo)

    pqr_list = consulta.order_by(PQR.id.desc()).all()

    resultado = []
    for p in pqr_list:
        resultado.append({
            "id": p.id,
            "usuario_id": p.usuario_id,
            "tipo": p.tipo,
            "asunto": p.asunto,
            "descripcion": p.descripcion,
            "estado": p.estado,
            "respuesta": p.respuesta,
            "respondido_por": p.respondido_por,
            "fecha_creacion": p.fecha_creacion.isoformat() if p.fecha_creacion else None,
            "fecha_respuesta": p.fecha_respuesta.isoformat() if p.fecha_respuesta else None,
            "cliente": f"{p.usuario.nombre} {p.usuario.apellido}".strip(),
        })

    return {"pqr": resultado}


@router.post("", status_code=201)
def crear_pqr(
    datos: PQRCreate,
    usuario_actual: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    pqr = PQR(
        usuario_id=usuario_actual["id"],
        tipo=datos.tipo,
        asunto=datos.asunto,
        descripcion=datos.descripcion,
        estado="Pendiente",
    )
    db.add(pqr)
    db.commit()
    db.refresh(pqr)

    return {"mensaje": "PQR registrada correctamente", "pqrId": pqr.id}


@router.get("/{pqr_id}")
def obtener_pqr(
    pqr_id: int,
    usuario_actual: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    pqr = db.query(PQR).filter(PQR.id == pqr_id).first()
    if not pqr:
        raise HTTPException(status_code=404, detail={"mensaje": "PQR no encontrada"})

    es_staff = str(usuario_actual.get("rol", "")).lower() in ROLES_STAFF
    if not es_staff and pqr.usuario_id != usuario_actual["id"]:
        raise HTTPException(status_code=403, detail={"mensaje": "No tienes acceso a esta PQR"})

    return {
        "id": pqr.id,
        "usuario_id": pqr.usuario_id,
        "tipo": pqr.tipo,
        "asunto": pqr.asunto,
        "descripcion": pqr.descripcion,
        "estado": pqr.estado,
        "respuesta": pqr.respuesta,
        "respondido_por": pqr.respondido_por,
        "fecha_creacion": pqr.fecha_creacion.isoformat() if pqr.fecha_creacion else None,
        "fecha_respuesta": pqr.fecha_respuesta.isoformat() if pqr.fecha_respuesta else None,
        "cliente": f"{pqr.usuario.nombre} {pqr.usuario.apellido}".strip(),
    }


@router.put("/{pqr_id}/responder")
def responder_pqr(
    pqr_id: int,
    datos: PQRResponse,
    usuario_actual: dict = Depends(require_permission("pqr.gestionar")),
    db: Session = Depends(get_db),
):
    pqr = db.query(PQR).filter(PQR.id == pqr_id).first()
    if not pqr:
        raise HTTPException(status_code=404, detail={"mensaje": "PQR no encontrada"})

    pqr.respuesta = datos.respuesta
    pqr.estado = "Respondida"
    pqr.respondido_por = usuario_actual["id"]
    pqr.fecha_respuesta = datetime.utcnow()
    db.commit()

    return {"mensaje": "Respuesta registrada correctamente"}


@router.patch("/{pqr_id}/estado")
def actualizar_estado_pqr(
    pqr_id: int,
    datos: ActualizarEstadoPQR,
    usuario_actual: dict = Depends(require_permission("pqr.gestionar")),
    db: Session = Depends(get_db),
):
    pqr = db.query(PQR).filter(PQR.id == pqr_id).first()
    if not pqr:
        raise HTTPException(status_code=404, detail={"mensaje": "PQR no encontrada"})

    pqr.estado = datos.estado
    db.commit()

    return {"mensaje": "Estado actualizado correctamente", "estado": datos.estado}
