"""
Modelos SQLAlchemy: la representación en Python de las tablas creadas por
database/schema.sql. Quinto avance: ventas, facturas, PQR, chatbot.
"""

from datetime import datetime

from sqlalchemy import (
    BOOLEAN,
    DECIMAL,
    TIMESTAMP,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
    text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Rol(Base):
    __tablename__ = "roles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    nombre: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)

    usuarios: Mapped[list["Usuario"]] = relationship(back_populates="rol")
    permisos: Mapped[list["Permiso"]] = relationship(
        secondary="rol_permisos", back_populates="roles"
    )


class Permiso(Base):
    __tablename__ = "permisos"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    codigo: Mapped[str] = mapped_column(String(80), unique=True, nullable=False)
    descripcion: Mapped[str] = mapped_column(String(200), nullable=False)

    roles: Mapped[list["Rol"]] = relationship(secondary="rol_permisos", back_populates="permisos")


class RolPermiso(Base):
    __tablename__ = "rol_permisos"

    rol_id: Mapped[int] = mapped_column(ForeignKey("roles.id", ondelete="CASCADE"), primary_key=True)
    permiso_id: Mapped[int] = mapped_column(
        ForeignKey("permisos.id", ondelete="CASCADE"), primary_key=True
    )


class Usuario(Base):
    __tablename__ = "usuarios"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    nombre: Mapped[str] = mapped_column(String(100), nullable=False)
    apellido: Mapped[str] = mapped_column(String(100), nullable=False)
    tipo_documento: Mapped[str] = mapped_column(String(30), nullable=False)
    numero_documento: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    direccion: Mapped[str | None] = mapped_column(String(255), nullable=True)
    telefono: Mapped[str | None] = mapped_column(String(40), nullable=True)
    correo: Mapped[str] = mapped_column(String(190), unique=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    rol_id: Mapped[int] = mapped_column(ForeignKey("roles.id"), nullable=False, default=3)
    estado: Mapped[str] = mapped_column(String(20), nullable=False, default="Activo")
    reset_code: Mapped[str | None] = mapped_column(String(10), nullable=True)
    reset_code_expires: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    fecha_creacion: Mapped[datetime | None] = mapped_column(
        TIMESTAMP, nullable=True, server_default=text("CURRENT_TIMESTAMP")
    )

    rol: Mapped["Rol"] = relationship(back_populates="usuarios")
    pedidos: Mapped[list["Pedido"]] = relationship(back_populates="usuario")
    carrito: Mapped["Carrito | None"] = relationship(back_populates="usuario", uselist=False)
    ventas: Mapped[list["Venta"]] = relationship(back_populates="usuario")
    facturas: Mapped[list["Factura"]] = relationship(back_populates="usuario")
    pqr: Mapped[list["PQR"]] = relationship("PQR", back_populates="usuario", foreign_keys="PQR.usuario_id")


class Categoria(Base):
    __tablename__ = "categorias"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    nombre: Mapped[str] = mapped_column(String(120), unique=True, nullable=False)

    productos: Mapped[list["Producto"]] = relationship(back_populates="categoria")


class Producto(Base):
    __tablename__ = "productos"
    __table_args__ = (UniqueConstraint("categoria_id", "nombre", name="uq_producto_categoria_nombre"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    categoria_id: Mapped[int | None] = mapped_column(
        ForeignKey("categorias.id", ondelete="SET NULL"), nullable=True
    )
    nombre: Mapped[str] = mapped_column(String(255), nullable=False)
    marca: Mapped[str] = mapped_column(String(120), nullable=False)
    modelo: Mapped[str | None] = mapped_column(String(120), nullable=True)
    descripcion: Mapped[str | None] = mapped_column(Text, nullable=True)
    precio: Mapped[float] = mapped_column(DECIMAL(12, 2), nullable=False)
    stock: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    imagen: Mapped[str | None] = mapped_column(Text, nullable=True)
    estado: Mapped[str] = mapped_column(String(20), nullable=False, default="Activo")
    fecha_creacion: Mapped[datetime | None] = mapped_column(
        TIMESTAMP, nullable=True, server_default=text("CURRENT_TIMESTAMP")
    )

    categoria: Mapped["Categoria"] = relationship(back_populates="productos")


class Servicio(Base):
    __tablename__ = "servicios"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    nombre: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    descripcion: Mapped[str | None] = mapped_column(Text, nullable=True)
    precio: Mapped[float] = mapped_column(DECIMAL(12, 2), nullable=False)
    duracion_estimada: Mapped[str | None] = mapped_column(String(80), nullable=True)
    imagen: Mapped[str | None] = mapped_column(Text, nullable=True)
    estado: Mapped[str] = mapped_column(String(20), nullable=False, default="Activo")
    fecha_creacion: Mapped[datetime | None] = mapped_column(
        TIMESTAMP, nullable=True, server_default=text("CURRENT_TIMESTAMP")
    )


class Carrito(Base):
    __tablename__ = "carrito"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    usuario_id: Mapped[int] = mapped_column(ForeignKey("usuarios.id"), nullable=False)
    fecha_actualizacion: Mapped[datetime | None] = mapped_column(
        TIMESTAMP, nullable=True, server_default=text("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP")
    )

    usuario: Mapped["Usuario"] = relationship(back_populates="carrito")
    items: Mapped[list["CarritoItem"]] = relationship(
        back_populates="carrito", cascade="all, delete-orphan"
    )


class CarritoItem(Base):
    __tablename__ = "carrito_item"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    carrito_id: Mapped[int] = mapped_column(ForeignKey("carrito.id", ondelete="CASCADE"), nullable=False)
    producto_id: Mapped[int] = mapped_column(ForeignKey("productos.id", ondelete="CASCADE"), nullable=False)
    cantidad: Mapped[int] = mapped_column(Integer, nullable=False)

    carrito: Mapped["Carrito"] = relationship(back_populates="items")
    producto: Mapped["Producto"] = relationship()


class Pedido(Base):
    __tablename__ = "pedidos"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    usuario_id: Mapped[int] = mapped_column(ForeignKey("usuarios.id"), nullable=False)
    total: Mapped[float] = mapped_column(DECIMAL(12, 2), nullable=False)
    estado: Mapped[str] = mapped_column(String(20), nullable=False, default="Pendiente")
    direccion_envio: Mapped[str | None] = mapped_column(String(255), nullable=True)
    fecha_pedido: Mapped[datetime | None] = mapped_column(
        TIMESTAMP, nullable=True, server_default=text("CURRENT_TIMESTAMP")
    )
    factura_enviada: Mapped[bool] = mapped_column(BOOLEAN, nullable=False, default=False)

    usuario: Mapped["Usuario"] = relationship(back_populates="pedidos")
    detalles: Mapped[list["DetallePedido"]] = relationship(
        back_populates="pedido", cascade="all, delete-orphan"
    )


class DetallePedido(Base):
    __tablename__ = "detalle_pedido"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    pedido_id: Mapped[int] = mapped_column(ForeignKey("pedidos.id", ondelete="CASCADE"), nullable=False)
    producto_id: Mapped[int | None] = mapped_column(
        ForeignKey("productos.id", ondelete="SET NULL"), nullable=True
    )
    producto_nombre: Mapped[str] = mapped_column(String(255), nullable=False)
    precio_unitario: Mapped[float] = mapped_column(DECIMAL(12, 2), nullable=False)
    cantidad: Mapped[int] = mapped_column(Integer, nullable=False)

    pedido: Mapped["Pedido"] = relationship(back_populates="detalles")
    producto: Mapped["Producto | None"] = relationship()


# ============================================================
# QUINTO AVANCE: VENTAS, FACTURAS, PQR, CHATBOT
# ============================================================


class Venta(Base):
    __tablename__ = "ventas"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    usuario_id: Mapped[int] = mapped_column(ForeignKey("usuarios.id"), nullable=False)
    cliente_nombre: Mapped[str | None] = mapped_column(String(200), nullable=True)
    cliente_documento: Mapped[str | None] = mapped_column(String(50), nullable=True)
    cliente_correo: Mapped[str | None] = mapped_column(String(190), nullable=True)
    subtotal: Mapped[float] = mapped_column(DECIMAL(12, 2), nullable=False, default=0)
    impuestos: Mapped[float] = mapped_column(DECIMAL(12, 2), nullable=False, default=0)
    descuento: Mapped[float] = mapped_column(DECIMAL(12, 2), nullable=False, default=0)
    total: Mapped[float] = mapped_column(DECIMAL(12, 2), nullable=False, default=0)
    estado: Mapped[str] = mapped_column(String(20), nullable=False, default="Completada")
    observaciones: Mapped[str | None] = mapped_column(Text, nullable=True)
    fecha_venta: Mapped[datetime | None] = mapped_column(
        TIMESTAMP, nullable=True, server_default=text("CURRENT_TIMESTAMP")
    )

    usuario: Mapped["Usuario"] = relationship(back_populates="ventas")
    detalles: Mapped[list["DetalleVenta"]] = relationship(
        back_populates="venta", cascade="all, delete-orphan"
    )


class DetalleVenta(Base):
    __tablename__ = "detalle_ventas"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    venta_id: Mapped[int] = mapped_column(ForeignKey("ventas.id", ondelete="CASCADE"), nullable=False)
    tipo: Mapped[str] = mapped_column(String(20), nullable=False, default="producto")
    item_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    item_nombre: Mapped[str] = mapped_column(String(255), nullable=False)
    cantidad: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    precio_unitario: Mapped[float] = mapped_column(DECIMAL(12, 2), nullable=False)
    descuento: Mapped[float] = mapped_column(DECIMAL(12, 2), nullable=False, default=0)
    subtotal: Mapped[float] = mapped_column(DECIMAL(12, 2), nullable=False)

    venta: Mapped["Venta"] = relationship(back_populates="detalles")


class Factura(Base):
    __tablename__ = "facturas"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    numero_factura: Mapped[str] = mapped_column(String(30), unique=True, nullable=False)
    venta_id: Mapped[int | None] = mapped_column(
        ForeignKey("ventas.id", ondelete="SET NULL"), nullable=True
    )
    usuario_id: Mapped[int] = mapped_column(ForeignKey("usuarios.id"), nullable=False)
    cliente_nombre: Mapped[str | None] = mapped_column(String(200), nullable=True)
    cliente_documento: Mapped[str | None] = mapped_column(String(50), nullable=True)
    cliente_correo: Mapped[str | None] = mapped_column(String(190), nullable=True)
    cliente_direccion: Mapped[str | None] = mapped_column(String(255), nullable=True)
    subtotal: Mapped[float] = mapped_column(DECIMAL(12, 2), nullable=False, default=0)
    impuestos: Mapped[float] = mapped_column(DECIMAL(12, 2), nullable=False, default=0)
    descuento: Mapped[float] = mapped_column(DECIMAL(12, 2), nullable=False, default=0)
    total: Mapped[float] = mapped_column(DECIMAL(12, 2), nullable=False, default=0)
    estado: Mapped[str] = mapped_column(String(20), nullable=False, default="Emitida")
    observaciones: Mapped[str | None] = mapped_column(Text, nullable=True)
    fecha_factura: Mapped[datetime | None] = mapped_column(
        TIMESTAMP, nullable=True, server_default=text("CURRENT_TIMESTAMP")
    )

    usuario: Mapped["Usuario"] = relationship(back_populates="facturas")
    venta: Mapped["Venta | None"] = relationship()
    detalles: Mapped[list["DetalleFactura"]] = relationship(
        back_populates="factura", cascade="all, delete-orphan"
    )


class DetalleFactura(Base):
    __tablename__ = "detalle_facturas"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    factura_id: Mapped[int] = mapped_column(ForeignKey("facturas.id", ondelete="CASCADE"), nullable=False)
    tipo: Mapped[str] = mapped_column(String(20), nullable=False, default="producto")
    item_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    item_nombre: Mapped[str] = mapped_column(String(255), nullable=False)
    cantidad: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    precio_unitario: Mapped[float] = mapped_column(DECIMAL(12, 2), nullable=False)
    subtotal: Mapped[float] = mapped_column(DECIMAL(12, 2), nullable=False)

    factura: Mapped["Factura"] = relationship(back_populates="detalles")


class PQR(Base):
    __tablename__ = "pqr"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    usuario_id: Mapped[int] = mapped_column(ForeignKey("usuarios.id"), nullable=False)
    tipo: Mapped[str] = mapped_column(String(20), nullable=False, default="Peticion")
    asunto: Mapped[str] = mapped_column(String(255), nullable=False)
    descripcion: Mapped[str] = mapped_column(Text, nullable=False)
    estado: Mapped[str] = mapped_column(String(20), nullable=False, default="Pendiente")
    respuesta: Mapped[str | None] = mapped_column(Text, nullable=True)
    respondido_por: Mapped[int | None] = mapped_column(
        ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True
    )
    fecha_creacion: Mapped[datetime | None] = mapped_column(
        TIMESTAMP, nullable=True, server_default=text("CURRENT_TIMESTAMP")
    )
    fecha_respuesta: Mapped[datetime | None] = mapped_column(TIMESTAMP, nullable=True)

    usuario: Mapped["Usuario"] = relationship("Usuario", back_populates="pqr", foreign_keys=[usuario_id])


class ChatConversacion(Base):
    __tablename__ = "chat_conversaciones"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    usuario_id: Mapped[int | None] = mapped_column(
        ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True
    )
    sesion_id: Mapped[str] = mapped_column(String(100), nullable=False)
    estado: Mapped[str] = mapped_column(String(20), nullable=False, default="activa")
    fecha_creacion: Mapped[datetime | None] = mapped_column(
        TIMESTAMP, nullable=True, server_default=text("CURRENT_TIMESTAMP")
    )

    mensajes: Mapped[list["ChatMensaje"]] = relationship(
        back_populates="conversacion", cascade="all, delete-orphan"
    )


class ChatMensaje(Base):
    __tablename__ = "chat_mensajes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    conversacion_id: Mapped[int] = mapped_column(
        ForeignKey("chat_conversaciones.id", ondelete="CASCADE"), nullable=False
    )
    rol: Mapped[str] = mapped_column(String(20), nullable=False, default="user")
    contenido: Mapped[str] = mapped_column(Text, nullable=False)
    fecha_creacion: Mapped[datetime | None] = mapped_column(
        TIMESTAMP, nullable=True, server_default=text("CURRENT_TIMESTAMP")
    )

    conversacion: Mapped["ChatConversacion"] = relationship(back_populates="mensajes")
