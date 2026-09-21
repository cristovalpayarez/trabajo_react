"""
/api/servicios — entidad adicional pedida por la guía (mínimo: usuarios,
roles, permisos, productos y servicios). El frontend actual no tiene una
pantalla de servicios, pero el CRUD queda disponible y documentado en
Swagger/Postman para evidenciarlo, sin tocar ninguna vista existente.
"""

from fastapi import APIRouter, Depends, HTTPException

from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Servicio
from app.schemas import ServicioIn, ServicioOut
from app.security import require_permission

router = APIRouter(prefix="/api/servicios", tags=["Servicios"])


@router.get("", response_model=list[ServicioOut])
def obtener_servicios(db: Session = Depends(get_db)):
    return db.query(Servicio).order_by(Servicio.id.desc()).all()


@router.get("/{servicio_id}", response_model=ServicioOut)
def obtener_servicio(servicio_id: int, db: Session = Depends(get_db)):
    servicio = db.query(Servicio).filter(Servicio.id == servicio_id).first()
    if not servicio:
        raise HTTPException(status_code=404, detail={"mensaje": "Servicio no encontrado"})
    return servicio


@router.post("", status_code=201, dependencies=[Depends(require_permission("servicios.gestionar"))])
def crear_servicio(datos: ServicioIn, db: Session = Depends(get_db)):
    existente = db.query(Servicio).filter(Servicio.nombre == datos.nombre).first()
    if existente:
        raise HTTPException(status_code=409, detail={"mensaje": "Ya existe un servicio con ese nombre"})

    servicio = Servicio(**datos.model_dump())
    db.add(servicio)
    db.commit()
    db.refresh(servicio)

    return {"mensaje": "Servicio creado correctamente", "servicio": ServicioOut.model_validate(servicio)}


@router.put("/{servicio_id}", dependencies=[Depends(require_permission("servicios.gestionar"))])
def actualizar_servicio(servicio_id: int, datos: ServicioIn, db: Session = Depends(get_db)):
    servicio = db.query(Servicio).filter(Servicio.id == servicio_id).first()
    if not servicio:
        raise HTTPException(status_code=404, detail={"mensaje": "Servicio no encontrado"})

    for campo, valor in datos.model_dump().items():
        setattr(servicio, campo, valor)
    db.commit()
    db.refresh(servicio)

    return {"mensaje": "Servicio actualizado correctamente", "servicio": ServicioOut.model_validate(servicio)}


@router.delete("/{servicio_id}", dependencies=[Depends(require_permission("servicios.gestionar"))])
def eliminar_servicio(servicio_id: int, db: Session = Depends(get_db)):
    servicio = db.query(Servicio).filter(Servicio.id == servicio_id).first()
    if not servicio:
        raise HTTPException(status_code=404, detail={"mensaje": "Servicio no encontrado"})

    db.delete(servicio)
    db.commit()

    return {"mensaje": "Servicio eliminado correctamente"}
