"""
Punto de entrada del backend FastAPI.

Arranca en el puerto 8000 para que el frontend (que tiene la URL
'http://127.0.0.1:8000/api/...' escrita en AuthContext, ProductContext,
Login, RegisterModal, RecoverPassword, AdminDashboard, EmployeeDashboard,
EmployeeForm) siga funcionando SIN modificar ni una línea de React.
"""

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.database import engine, get_settings
from app.routers import (
    auth, carrito, checkout, chatbot, dashboard, facturas, 
    pedidos, pqr, productos, reportes, servicios, usuarios, ventas,
)

settings = get_settings()

app = FastAPI(
    title="NEXUS TECH · API",
    description="Backend FastAPI para la tienda tecnológica (cuarto avance: React + Vite + FastAPI).",
    version="1.0.0",
)

# ==========================================
# MIDDLEWARES
# ==========================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==========================================
# MANEJO DE ERRORES: el frontend siempre lee `data.mensaje`,
# así que toda respuesta de error debe traer ese campo.
# ==========================================


@app.exception_handler(StarletteHTTPException)
async def manejar_http_exception(request: Request, exc: StarletteHTTPException):
    detalle = exc.detail
    if isinstance(detalle, dict) and "mensaje" in detalle:
        contenido = detalle
    elif isinstance(detalle, str):
        contenido = {"mensaje": detalle}
    else:
        contenido = {"mensaje": str(detalle)}
    return JSONResponse(status_code=exc.status_code, content=contenido)


@app.exception_handler(RequestValidationError)
async def manejar_validation_error(request: Request, exc: RequestValidationError):
    errores = exc.errors()

    # exc.errors() puede traer objetos no serializables (p. ej. la excepción
    # original dentro de "ctx" cuando un @field_validator levanta ValueError),
    # así que se arma una versión plana y 100% serializable para el detalle.
    detalle = [
        {
            "campo": ".".join(str(parte) for parte in error.get("loc", []) if parte != "body"),
            "mensaje": error.get("msg"),
            "tipo": error.get("type"),
        }
        for error in errores
    ]

    mensaje = "Datos inválidos"
    if detalle:
        primero = detalle[0]
        mensaje = f"{primero['campo']}: {primero['mensaje']}" if primero["campo"] else primero["mensaje"]

    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"mensaje": mensaje, "detalle": detalle},
    )


# ==========================================
# RUTAS
# ==========================================

app.include_router(auth.router)
app.include_router(usuarios.router)
app.include_router(productos.router)
app.include_router(servicios.router)
app.include_router(carrito.router)
app.include_router(checkout.router)
app.include_router(pedidos.router)
app.include_router(ventas.router)
app.include_router(facturas.router)
app.include_router(reportes.router)
app.include_router(pqr.router)
app.include_router(dashboard.router)
app.include_router(chatbot.router)


@app.get("/")
def raiz():
    return {"mensaje": "Backend de la tienda tecnológica funcionando (FastAPI)"}


@app.get("/test-db")
def test_db():
    try:
        with engine.connect() as conexion:
            resultado = conexion.execute(text("SELECT 1 + 1 AS resultado")).mappings().first()
        return {"mensaje": "Conexión con MySQL exitosa", "resultado": resultado["resultado"]}
    except Exception as error:  # noqa: BLE001
        return JSONResponse(
            status_code=500,
            content={"mensaje": "No se pudo conectar con MySQL", "error": str(error)},
        )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app.main:app", host="0.0.0.0", port=settings.PORT, reload=True)
