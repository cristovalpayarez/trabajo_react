"""
Esquemas Pydantic: validan TODO lo que entra a la API.
Quinto avance: ventas, facturas, reportes, PQR, chatbot, dashboard.
"""

import re
from datetime import datetime, date
from typing import Literal, Optional

from pydantic import BaseModel, EmailStr, Field, field_validator

# ------------------------------------------------------------------
# Reglas compartidas
# ------------------------------------------------------------------

PASSWORD_REGEX = re.compile(r"^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':\"\\|,.<>/?]).{8,}$")
SOLO_DIGITOS = re.compile(r"^\d+$")

ESTADOS_USUARIO = Literal["Activo", "Inactivo"]
ESTADOS_PEDIDO = Literal["Pendiente", "Procesando", "Enviado", "Entregado", "Cancelado"]
ESTADOS_VENTA = Literal["Completada", "Pendiente", "Cancelada", "Reembolsada"]
ESTADOS_FACTURA = Literal["Emitida", "Pagada", "Anulada", "Vencida"]
ESTADOS_PQR = Literal["Pendiente", "En proceso", "Respondida", "Cerrada"]
TIPOS_PQR = Literal["Peticion", "Queja", "Reclamo"]


def _validar_password_fuerte(password: str) -> str:
    if not PASSWORD_REGEX.match(password):
        raise ValueError(
            "La contraseña debe tener mínimo 8 caracteres, una mayúscula, "
            "un número y un carácter especial"
        )
    return password


# ------------------------------------------------------------------
# AUTENTICACION / REGISTRO
# ------------------------------------------------------------------


class RegistroUsuario(BaseModel):
    nombre: str = Field(min_length=1, max_length=50)
    apellido: str = Field(min_length=1, max_length=50)
    tipo_documento: str = Field(min_length=1, max_length=30)
    numero_documento: str = Field(min_length=1, max_length=50)
    direccion: Optional[str] = Field(default=None, max_length=150)
    telefono: Optional[str] = Field(default=None, max_length=40)
    correo: EmailStr = Field(max_length=100)
    password: str = Field(min_length=8, max_length=64)

    @field_validator("numero_documento", "telefono")
    @classmethod
    def solo_digitos(cls, valor: str | None) -> str | None:
        if valor is None or valor == "":
            return valor
        if not SOLO_DIGITOS.match(valor):
            raise ValueError("Este campo solo admite números")
        return valor

    @field_validator("password")
    @classmethod
    def password_fuerte(cls, valor: str) -> str:
        return _validar_password_fuerte(valor)


class LoginRequest(BaseModel):
    correo: EmailStr
    password: str = Field(min_length=1)


class UsuarioResumen(BaseModel):
    id: int
    nombre: str
    apellido: str
    correo: str
    rol: str
    direccion: Optional[str] = None
    telefono: Optional[str] = None


class LoginResponse(BaseModel):
    mensaje: str
    token: str
    usuario: UsuarioResumen


class ForgotPasswordRequest(BaseModel):
    correo: EmailStr


class VerifyResetCodeRequest(BaseModel):
    correo: EmailStr
    codigo: str = Field(min_length=6, max_length=6)


class ResetPasswordRequest(BaseModel):
    correo: EmailStr
    codigo: str = Field(min_length=6, max_length=6)
    nuevaPassword: str = Field(min_length=6, max_length=64)


class ActualizarPerfilRequest(BaseModel):
    nombre: str = Field(min_length=1, max_length=50)
    apellido: str = Field(min_length=1, max_length=50)
    direccion: Optional[str] = Field(default=None, max_length=150)
    telefono: Optional[str] = Field(default=None, max_length=40)

    @field_validator("telefono")
    @classmethod
    def telefono_digitos(cls, valor: str | None) -> str | None:
        if valor is None or valor == "":
            return valor
        if not SOLO_DIGITOS.match(valor):
            raise ValueError("El teléfono solo admite números")
        return valor


# ------------------------------------------------------------------
# USUARIOS (panel administrativo)
# ------------------------------------------------------------------


class UsuarioListado(BaseModel):
    id: int
    nombre: str
    apellido: str
    tipo_documento: str
    numero_documento: str
    direccion: Optional[str] = None
    telefono: Optional[str] = None
    correo: str
    estado: str
    fecha_creacion: Optional[datetime] = None
    rol: Optional[str] = None

    model_config = {"from_attributes": True}


class ActualizarEstadoUsuario(BaseModel):
    estado: ESTADOS_USUARIO


class ActualizarRolUsuario(BaseModel):
    rol: Literal["admin", "vendedor", "empleado", "cliente"]


class ActualizarUsuarioAdmin(BaseModel):
    nombre: str = Field(min_length=1, max_length=50)
    apellido: str = Field(min_length=1, max_length=50)
    tipo_documento: str = Field(min_length=1, max_length=30)
    numero_documento: str = Field(min_length=1, max_length=50)
    direccion: Optional[str] = Field(default=None, max_length=150)
    telefono: Optional[str] = Field(default=None, max_length=40)
    correo: EmailStr = Field(max_length=100)

    @field_validator("numero_documento", "telefono")
    @classmethod
    def solo_digitos(cls, valor: str | None) -> str | None:
        if valor is None or valor == "":
            return valor
        if not SOLO_DIGITOS.match(valor):
            raise ValueError("Este campo solo admite números")
        return valor


# ------------------------------------------------------------------
# PRODUCTOS
# ------------------------------------------------------------------


class ProductoIn(BaseModel):
    categoria_id: Optional[int] = None
    categoria: Optional[str] = None
    nombre: str = Field(min_length=1, max_length=255)
    marca: str = Field(min_length=1, max_length=120)
    modelo: Optional[str] = Field(default=None, max_length=120)
    descripcion: Optional[str] = None
    precio: float = Field(gt=0)
    stock: int = Field(ge=0)
    imagen: Optional[str] = None
    estado: Optional[ESTADOS_USUARIO] = "Activo"


class ProductoOut(BaseModel):
    id: int
    categoria_id: Optional[int] = None
    categoria: Optional[str] = None
    nombre: str
    marca: str
    modelo: Optional[str] = None
    descripcion: Optional[str] = None
    precio: float
    stock: int
    imagen: Optional[str] = None
    estado: str
    fecha_creacion: Optional[datetime] = None


# ------------------------------------------------------------------
# SERVICIOS
# ------------------------------------------------------------------


class ServicioIn(BaseModel):
    nombre: str = Field(min_length=1, max_length=255)
    descripcion: Optional[str] = None
    precio: float = Field(gt=0)
    duracion_estimada: Optional[str] = Field(default=None, max_length=80)
    imagen: Optional[str] = None
    estado: Optional[ESTADOS_USUARIO] = "Activo"


class ServicioOut(BaseModel):
    id: int
    nombre: str
    descripcion: Optional[str] = None
    precio: float
    duracion_estimada: Optional[str] = None
    imagen: Optional[str] = None
    estado: str
    fecha_creacion: Optional[datetime] = None

    model_config = {"from_attributes": True}


# ------------------------------------------------------------------
# PEDIDOS
# ------------------------------------------------------------------


class PedidoItemIn(BaseModel):
    producto_id: int = Field(gt=0)
    cantidad: int = Field(gt=0)


class PedidoCreate(BaseModel):
    items: Optional[list[PedidoItemIn]] = Field(default=None)
    direccion_envio: Optional[str] = Field(default=None, max_length=255)


class ActualizarEstadoPedido(BaseModel):
    estado: ESTADOS_PEDIDO


# ------------------------------------------------------------------
# VENTAS (Quinto Avance)
# ------------------------------------------------------------------


class DetalleVentaIn(BaseModel):
    tipo: Literal["producto", "servicio"] = "producto"
    item_id: Optional[int] = None
    item_nombre: str = Field(min_length=1, max_length=255)
    cantidad: int = Field(gt=0, default=1)
    precio_unitario: float = Field(gt=0)
    descuento: float = Field(ge=0, default=0)


class VentaCreate(BaseModel):
    cliente_nombre: Optional[str] = Field(default=None, max_length=200)
    cliente_documento: Optional[str] = Field(default=None, max_length=50)
    cliente_correo: Optional[str] = Field(default=None, max_length=190)
    items: list[DetalleVentaIn] = Field(min_length=1)
    descuento: float = Field(ge=0, default=0)
    observaciones: Optional[str] = None


class VentaOut(BaseModel):
    id: int
    usuario_id: int
    cliente_nombre: Optional[str] = None
    cliente_documento: Optional[str] = None
    cliente_correo: Optional[str] = None
    subtotal: float
    impuestos: float
    descuento: float
    total: float
    estado: str
    observaciones: Optional[str] = None
    fecha_venta: Optional[datetime] = None
    vendedor: Optional[str] = None
    detalles: list[DetalleVentaIn] = []

    model_config = {"from_attributes": True}


class ActualizarEstadoVenta(BaseModel):
    estado: ESTADOS_VENTA


# ------------------------------------------------------------------
# FACTURAS (Quinto Avance)
# ------------------------------------------------------------------


class FacturaCreate(BaseModel):
    venta_id: Optional[int] = None
    cliente_nombre: Optional[str] = Field(default=None, max_length=200)
    cliente_documento: Optional[str] = Field(default=None, max_length=50)
    cliente_correo: Optional[str] = Field(default=None, max_length=190)
    cliente_direccion: Optional[str] = Field(default=None, max_length=255)
    items: Optional[list[DetalleVentaIn]] = None
    subtotal: Optional[float] = None
    impuestos: Optional[float] = None
    descuento: Optional[float] = None
    total: Optional[float] = None
    observaciones: Optional[str] = None


class FacturaOut(BaseModel):
    id: int
    numero_factura: str
    venta_id: Optional[int] = None
    usuario_id: int
    cliente_nombre: Optional[str] = None
    cliente_documento: Optional[str] = None
    cliente_correo: Optional[str] = None
    cliente_direccion: Optional[str] = None
    subtotal: float
    impuestos: float
    descuento: float
    total: float
    estado: str
    observaciones: Optional[str] = None
    fecha_factura: Optional[datetime] = None

    model_config = {"from_attributes": True}


# ------------------------------------------------------------------
# PQR (Quinto Avance)
# ------------------------------------------------------------------


class PQRCreate(BaseModel):
    tipo: TIPOS_PQR = "Peticion"
    asunto: str = Field(min_length=1, max_length=255)
    descripcion: str = Field(min_length=1)


class PQRResponse(BaseModel):
    respuesta: str = Field(min_length=1)


class PQROut(BaseModel):
    id: int
    usuario_id: int
    tipo: str
    asunto: str
    descripcion: str
    estado: str
    respuesta: Optional[str] = None
    respondido_por: Optional[int] = None
    fecha_creacion: Optional[datetime] = None
    fecha_respuesta: Optional[datetime] = None
    cliente: Optional[str] = None

    model_config = {"from_attributes": True}


class ActualizarEstadoPQR(BaseModel):
    estado: ESTADOS_PQR


# ------------------------------------------------------------------
# CHATBOT (Quinto Avance)
# ------------------------------------------------------------------


class ChatMensajeIn(BaseModel):
    mensaje: str = Field(min_length=1, max_length=2000)
    # Permite que el frontend conserve el hilo de la conversación (historial)
    # entre mensajes; si no llega, el backend crea una sesión nueva.
    sesion_id: Optional[str] = Field(default=None, max_length=100)


class ChatMensajeOut(BaseModel):
    id: int
    rol: str
    contenido: str
    fecha_creacion: Optional[datetime] = None

    model_config = {"from_attributes": True}


class ChatConversacionOut(BaseModel):
    id: int
    sesion_id: str
    estado: str
    fecha_creacion: Optional[datetime] = None
    mensajes: list[ChatMensajeOut] = []

    model_config = {"from_attributes": True}


# ------------------------------------------------------------------
# DASHBOARD / REPORTES (Quinto Avance)
# ------------------------------------------------------------------


class DashboardStats(BaseModel):
    total_usuarios: int = 0
    total_productos: int = 0
    total_servicios: int = 0
    total_ventas: int = 0
    total_facturas: int = 0
    total_pqr: int = 0
    pqr_pendientes: int = 0
    ventas_hoy: float = 0
    facturacion_hoy: float = 0


class ReporteVentaItem(BaseModel):
    id: int
    fecha: Optional[datetime] = None
    cliente: Optional[str] = None
    productos: str
    cantidad_total: int
    total: float
    estado: str


class VentaDiaria(BaseModel):
    fecha: str
    total_ventas: int
    total_ingresos: float


class VentaMensual(BaseModel):
    mes: str
    total_ventas: int
    total_ingresos: float
