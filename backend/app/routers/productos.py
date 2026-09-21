"""
/api/productos — catálogo público (GET) y gestión (POST/PUT/DELETE) para
administradores/empleados. Espejo de productController.js.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.models import Categoria, Producto
from app.security import require_permission
from app.schemas import ProductoIn

router = APIRouter(prefix="/api/productos", tags=["Productos"])


def _resolver_categoria_id(db: Session, categoria_id: int | None, categoria_nombre: str | None) -> int | None:
    valor = categoria_id if categoria_id not in (None, "") else categoria_nombre
    if valor in (None, ""):
        return None

    try:
        numero = int(valor)
        if numero > 0:
            return numero
    except (TypeError, ValueError):
        pass

    nombre = str(valor).strip()
    if not nombre:
        return None

    categoria = db.query(Categoria).filter(Categoria.nombre == nombre).first()
    if categoria:
        return categoria.id

    nueva = Categoria(nombre=nombre)
    db.add(nueva)
    db.flush()
    return nueva.id


def _serializar(producto: Producto) -> dict:
    return {
        "id": producto.id,
        "categoria_id": producto.categoria_id,
        "nombre": producto.nombre,
        "marca": producto.marca,
        "modelo": producto.modelo,
        "descripcion": producto.descripcion,
        "precio": float(producto.precio),
        "stock": producto.stock,
        "imagen": producto.imagen,
        "estado": producto.estado,
        "fecha_creacion": producto.fecha_creacion,
        "categoria": producto.categoria.nombre if producto.categoria else None,
    }


@router.get("")
def obtener_productos(db: Session = Depends(get_db)):
    productos = (
        db.query(Producto).options(joinedload(Producto.categoria)).order_by(Producto.id.desc()).all()
    )
    return {"productos": [_serializar(p) for p in productos]}


@router.get("/{producto_id}")
def obtener_producto(producto_id: int, db: Session = Depends(get_db)):
    producto = (
        db.query(Producto)
        .options(joinedload(Producto.categoria))
        .filter(Producto.id == producto_id)
        .first()
    )
    if not producto:
        raise HTTPException(status_code=404, detail={"mensaje": "Producto no encontrado"})
    return _serializar(producto)


@router.post("", status_code=201, dependencies=[Depends(require_permission("productos.crear"))])
def crear_producto(datos: ProductoIn, db: Session = Depends(get_db)):
    categoria_id = _resolver_categoria_id(db, datos.categoria_id, datos.categoria)
    if not categoria_id:
        raise HTTPException(status_code=400, detail={"mensaje": "Los campos obligatorios están incompletos"})

    producto = Producto(
        categoria_id=categoria_id,
        nombre=datos.nombre,
        marca=datos.marca,
        modelo=datos.modelo,
        descripcion=datos.descripcion,
        precio=datos.precio,
        stock=datos.stock,
        imagen=datos.imagen,
        estado=datos.estado or "Activo",
    )
    db.add(producto)
    db.commit()
    db.refresh(producto)

    return {"mensaje": "Producto creado correctamente", "producto": _serializar(producto)}


@router.put("/{producto_id}", dependencies=[Depends(require_permission("productos.editar"))])
def actualizar_producto(producto_id: int, datos: ProductoIn, db: Session = Depends(get_db)):
    producto = db.query(Producto).filter(Producto.id == producto_id).first()
    if not producto:
        raise HTTPException(status_code=404, detail={"mensaje": "Producto no encontrado"})

    categoria_id = _resolver_categoria_id(db, datos.categoria_id, datos.categoria)
    if not categoria_id:
        raise HTTPException(status_code=400, detail={"mensaje": "Los campos obligatorios están incompletos"})

    producto.categoria_id = categoria_id
    producto.nombre = datos.nombre
    producto.marca = datos.marca
    producto.modelo = datos.modelo
    producto.descripcion = datos.descripcion
    producto.precio = datos.precio
    producto.stock = datos.stock
    producto.imagen = datos.imagen
    producto.estado = datos.estado or "Activo"
    db.commit()
    db.refresh(producto)

    return {"mensaje": "Producto actualizado correctamente", "producto": _serializar(producto)}


@router.delete("/{producto_id}", dependencies=[Depends(require_permission("productos.eliminar"))])
def eliminar_producto(producto_id: int, db: Session = Depends(get_db)):
    producto = db.query(Producto).filter(Producto.id == producto_id).first()
    if not producto:
        raise HTTPException(status_code=404, detail={"mensaje": "Producto no encontrado"})

    db.delete(producto)
    db.commit()

    return {"mensaje": "Producto eliminado correctamente"}
