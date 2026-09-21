-- ============================================================
-- NEXUS TECH · Script de creación de base de datos (MySQL)
-- Quinto avance: React + Vite + FastAPI + IA
-- Ejecutar completo en phpMyAdmin (pestaña SQL) o con:
--   mysql -u root -p < schema.sql
-- Es seguro volver a ejecutarlo: usa IF NOT EXISTS / INSERT IGNORE,
-- así que no borra datos que ya existan.
--
-- Nota: los ids usan INT / BIGINT "con signo" (sin UNSIGNED) para que las
-- llaves foráneas coincidan con las tablas creadas en los avances
-- anteriores. Así el script funciona tanto en una base nueva como en una
-- que ya tenía usuarios, productos y pedidos.
-- ============================================================

CREATE DATABASE IF NOT EXISTS tienda_tecnologica
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE tienda_tecnologica;

-- ------------------------------------------------------------
-- ROLES
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS roles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(50) NOT NULL UNIQUE
);

INSERT IGNORE INTO roles (id, nombre) VALUES
  (1, 'admin'),
  (2, 'vendedor'),
  (3, 'cliente'),
  (4, 'empleado');

-- ------------------------------------------------------------
-- PERMISOS + relación ROL <-> PERMISO
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS permisos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  codigo VARCHAR(80) NOT NULL UNIQUE,
  descripcion VARCHAR(200) NOT NULL
);

INSERT IGNORE INTO permisos (codigo, descripcion) VALUES
  ('usuarios.ver', 'Consultar el listado de usuarios'),
  ('usuarios.editar', 'Editar los datos de cualquier usuario'),
  ('usuarios.gestionar_estado', 'Activar o desactivar usuarios'),
  ('usuarios.eliminar', 'Eliminar usuarios'),
  ('empleados.crear', 'Registrar nuevos empleados'),
  ('productos.crear', 'Crear productos'),
  ('productos.editar', 'Editar productos'),
  ('productos.eliminar', 'Eliminar productos'),
  ('servicios.gestionar', 'Crear, editar y eliminar servicios'),
  ('pedidos.ver_todos', 'Consultar los pedidos de todos los clientes'),
  ('pedidos.actualizar_estado', 'Cambiar el estado de un pedido'),
  ('ventas.ver', 'Consultar el historial de ventas'),
  ('ventas.reportes', 'Generar reportes de ventas'),
  ('facturas.ver', 'Consultar facturas'),
  ('facturas.crear', 'Crear facturas'),
  ('pqr.gestionar', 'Gestionar peticiones, quejas y reclamos'),
  ('dashboard.ver_stats', 'Ver estadísticas del dashboard');

CREATE TABLE IF NOT EXISTS rol_permisos (
  rol_id INT NOT NULL,
  permiso_id INT NOT NULL,
  PRIMARY KEY (rol_id, permiso_id),
  FOREIGN KEY (rol_id) REFERENCES roles(id) ON DELETE CASCADE,
  FOREIGN KEY (permiso_id) REFERENCES permisos(id) ON DELETE CASCADE
);

-- admin / administrador: todos los permisos.
-- Se compara en minúsculas para que funcione sin importar si los roles
-- están guardados como 'admin' o como 'Administrador'.
INSERT IGNORE INTO rol_permisos (rol_id, permiso_id)
SELECT r.id, p.id
FROM roles r
JOIN permisos p
WHERE LOWER(r.nombre) IN ('admin', 'administrador', 'administradora');

-- empleado / vendedor (y variantes en español/inglés)
INSERT IGNORE INTO rol_permisos (rol_id, permiso_id)
SELECT r.id, p.id
FROM roles r
JOIN permisos p ON p.codigo IN (
  'usuarios.ver', 'usuarios.gestionar_estado',
  'productos.crear', 'productos.editar', 'productos.eliminar',
  'servicios.gestionar',
  'pedidos.ver_todos', 'pedidos.actualizar_estado',
  'ventas.ver', 'ventas.reportes', 'facturas.ver', 'facturas.crear',
  'pqr.gestionar', 'dashboard.ver_stats'
)
WHERE LOWER(r.nombre) IN ('empleado', 'empleada', 'vendedor', 'vendedora', 'employee');

-- ------------------------------------------------------------
-- USUARIOS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  apellido VARCHAR(100) NOT NULL,
  tipo_documento VARCHAR(30) NOT NULL,
  numero_documento VARCHAR(50) NOT NULL UNIQUE,
  direccion VARCHAR(255),
  telefono VARCHAR(40),
  correo VARCHAR(190) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  rol_id INT NOT NULL DEFAULT 3,
  estado ENUM('Activo', 'Inactivo') NOT NULL DEFAULT 'Activo',
  reset_code VARCHAR(10),
  reset_code_expires DATETIME,
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_usuarios_rol FOREIGN KEY (rol_id) REFERENCES roles(id)
);

-- ------------------------------------------------------------
-- CATEGORÍAS Y PRODUCTOS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS categorias (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(120) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS productos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  categoria_id INT,
  nombre VARCHAR(255) NOT NULL,
  marca VARCHAR(120) NOT NULL,
  modelo VARCHAR(120),
  descripcion TEXT,
  precio DECIMAL(12, 2) NOT NULL,
  stock INT NOT NULL DEFAULT 0,
  imagen TEXT,
  estado ENUM('Activo', 'Inactivo') NOT NULL DEFAULT 'Activo',
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_producto_categoria_nombre (categoria_id, nombre),
  FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON DELETE SET NULL
);

-- ------------------------------------------------------------
-- SERVICIOS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS servicios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL UNIQUE,
  descripcion TEXT,
  precio DECIMAL(12, 2) NOT NULL,
  duracion_estimada VARCHAR(80),
  imagen TEXT,
  estado ENUM('Activo', 'Inactivo') NOT NULL DEFAULT 'Activo',
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------
-- PEDIDOS Y DETALLE
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pedidos (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NOT NULL,
  total DECIMAL(12, 2) NOT NULL,
  estado ENUM('Pendiente', 'Procesando', 'Enviado', 'Entregado', 'Cancelado') NOT NULL DEFAULT 'Pendiente',
  direccion_envio VARCHAR(255),
  factura_enviada TINYINT(1) NOT NULL DEFAULT 0,
  fecha_pedido TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

CREATE TABLE IF NOT EXISTS detalle_pedido (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  pedido_id BIGINT NOT NULL,
  producto_id INT,
  producto_nombre VARCHAR(255) NOT NULL,
  precio_unitario DECIMAL(12, 2) NOT NULL,
  cantidad INT NOT NULL,
  FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE CASCADE,
  FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE SET NULL
);

-- ------------------------------------------------------------
-- CARRITO DE COMPRAS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS carrito (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NOT NULL,
  fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS carrito_item (
  id INT AUTO_INCREMENT PRIMARY KEY,
  carrito_id INT NOT NULL,
  producto_id INT NOT NULL,
  cantidad INT NOT NULL,
  FOREIGN KEY (carrito_id) REFERENCES carrito(id) ON DELETE CASCADE,
  FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE
);

-- ============================================================
-- QUINTO AVANCE: NUEVAS TABLAS
-- ============================================================

-- ------------------------------------------------------------
-- VENTAS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ventas (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NOT NULL,
  cliente_nombre VARCHAR(200),
  cliente_documento VARCHAR(50),
  cliente_correo VARCHAR(190),
  subtotal DECIMAL(12, 2) NOT NULL DEFAULT 0,
  impuestos DECIMAL(12, 2) NOT NULL DEFAULT 0,
  descuento DECIMAL(12, 2) NOT NULL DEFAULT 0,
  total DECIMAL(12, 2) NOT NULL DEFAULT 0,
  estado ENUM('Completada', 'Pendiente', 'Cancelada', 'Reembolsada') NOT NULL DEFAULT 'Completada',
  observaciones TEXT,
  fecha_venta TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

-- ------------------------------------------------------------
-- DETALLE DE VENTAS (productos y servicios vendidos)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS detalle_ventas (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  venta_id BIGINT NOT NULL,
  tipo ENUM('producto', 'servicio') NOT NULL DEFAULT 'producto',
  item_id INT,
  item_nombre VARCHAR(255) NOT NULL,
  cantidad INT NOT NULL DEFAULT 1,
  precio_unitario DECIMAL(12, 2) NOT NULL,
  descuento DECIMAL(12, 2) NOT NULL DEFAULT 0,
  subtotal DECIMAL(12, 2) NOT NULL,
  FOREIGN KEY (venta_id) REFERENCES ventas(id) ON DELETE CASCADE
);

-- ------------------------------------------------------------
-- FACTURAS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS facturas (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  numero_factura VARCHAR(30) NOT NULL UNIQUE,
  venta_id BIGINT,
  usuario_id INT NOT NULL,
  cliente_nombre VARCHAR(200),
  cliente_documento VARCHAR(50),
  cliente_correo VARCHAR(190),
  cliente_direccion VARCHAR(255),
  subtotal DECIMAL(12, 2) NOT NULL DEFAULT 0,
  impuestos DECIMAL(12, 2) NOT NULL DEFAULT 0,
  descuento DECIMAL(12, 2) NOT NULL DEFAULT 0,
  total DECIMAL(12, 2) NOT NULL DEFAULT 0,
  estado ENUM('Emitida', 'Pagada', 'Anulada', 'Vencida') NOT NULL DEFAULT 'Emitida',
  observaciones TEXT,
  fecha_factura TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (venta_id) REFERENCES ventas(id) ON DELETE SET NULL,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

-- ------------------------------------------------------------
-- DETALLE DE FACTURAS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS detalle_facturas (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  factura_id BIGINT NOT NULL,
  tipo ENUM('producto', 'servicio') NOT NULL DEFAULT 'producto',
  item_id INT,
  item_nombre VARCHAR(255) NOT NULL,
  cantidad INT NOT NULL DEFAULT 1,
  precio_unitario DECIMAL(12, 2) NOT NULL,
  subtotal DECIMAL(12, 2) NOT NULL,
  FOREIGN KEY (factura_id) REFERENCES facturas(id) ON DELETE CASCADE
);

-- ------------------------------------------------------------
-- PQR (Peticiones, Quejas, Reclamos)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pqr (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NOT NULL,
  tipo ENUM('Peticion', 'Queja', 'Reclamo') NOT NULL DEFAULT 'Peticion',
  asunto VARCHAR(255) NOT NULL,
  descripcion TEXT NOT NULL,
  estado ENUM('Pendiente', 'En proceso', 'Respondida', 'Cerrada') NOT NULL DEFAULT 'Pendiente',
  respuesta TEXT,
  respondido_por INT,
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  fecha_respuesta TIMESTAMP NULL,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
  FOREIGN KEY (respondido_por) REFERENCES usuarios(id) ON DELETE SET NULL
);

-- ------------------------------------------------------------
-- CHATBOT: CONVERSACIONES
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS chat_conversaciones (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT,
  sesion_id VARCHAR(100) NOT NULL,
  estado ENUM('activa', 'cerrada') NOT NULL DEFAULT 'activa',
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
);

-- ------------------------------------------------------------
-- CHATBOT: MENSAJES
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS chat_mensajes (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  conversacion_id BIGINT NOT NULL,
  rol ENUM('user', 'assistant', 'system') NOT NULL DEFAULT 'user',
  contenido TEXT NOT NULL,
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (conversacion_id) REFERENCES chat_conversaciones(id) ON DELETE CASCADE
);

-- ============================================================
-- MIGRACIONES (columnas que agregaron los avances 4 y 5)
--
-- Son seguras de volver a ejecutar: cada bloque revisa primero en
-- information_schema si la columna ya existe y, si falta, la crea.
-- Sirven para bases creadas con el esquema viejo (Node.js) donde, por
-- ejemplo, "servicios" todavía no tenía duración ni imagen.
-- ============================================================

SET @existe := (SELECT COUNT(*) FROM information_schema.columns
  WHERE table_schema = DATABASE() AND table_name = 'servicios' AND column_name = 'duracion_estimada');
SET @sql := IF(@existe = 0,
  'ALTER TABLE servicios ADD COLUMN duracion_estimada VARCHAR(80) NULL AFTER precio',
  'DO 0');
PREPARE migracion FROM @sql;
EXECUTE migracion;
DEALLOCATE PREPARE migracion;

SET @existe := (SELECT COUNT(*) FROM information_schema.columns
  WHERE table_schema = DATABASE() AND table_name = 'servicios' AND column_name = 'imagen');
SET @sql := IF(@existe = 0,
  'ALTER TABLE servicios ADD COLUMN imagen TEXT NULL AFTER duracion_estimada',
  'DO 0');
PREPARE migracion FROM @sql;
EXECUTE migracion;
DEALLOCATE PREPARE migracion;

SET @existe := (SELECT COUNT(*) FROM information_schema.columns
  WHERE table_schema = DATABASE() AND table_name = 'servicios' AND column_name = 'fecha_creacion');
SET @sql := IF(@existe = 0,
  'ALTER TABLE servicios ADD COLUMN fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP',
  'DO 0');
PREPARE migracion FROM @sql;
EXECUTE migracion;
DEALLOCATE PREPARE migracion;

-- ============================================================
-- DATOS DE EJEMPLO (catálogo inicial)
-- ============================================================

-- Categorías
INSERT IGNORE INTO categorias (nombre) VALUES
  ('Laptops'),
  ('Smartphones'),
  ('Tablets'),
  ('Accesorios'),
  ('Audífonos'),
  ('Periféricos');

-- Productos
INSERT IGNORE INTO productos (categoria_id, nombre, marca, modelo, descripcion, precio, stock, imagen, estado) VALUES
  (1, 'ASUS ROG Strix SCAR 18', 'ASUS', 'SCAR 18', 'Laptop gaming de alto rendimiento con RTX 4090.', 3499.00, 10, 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTFW5O5MmLMjsY83PKgeWO1ePEFHyrZ6C54Pfe3VYBFTA&s=10', 'Activo'),
  (1, 'MacBook Pro M3 Max 16"', 'Apple', 'M3 Max', 'Workstation profesional Apple con chip M3 Max.', 3899.00, 8, 'https://http2.mlstatic.com/D_NQ_NP_974249-MCO93902598833_102025-O.webp', 'Activo'),
  (1, 'Lenovo Legion Pro 7i', 'Lenovo', 'Legion Pro 7i', 'Laptop gaming Lenovo de alto rendimiento.', 2799.00, 12, 'https://p1-ofp.static.pub//fes/cms/2024/09/12/q6fb2891avf5ok5et6ppuhuuilu0cq939626.png', 'Activo'),
  (1, 'Dell XPS 16 Touch', 'Dell', 'XPS 16', 'Laptop premium con pantalla OLED 4K táctil.', 2499.00, 6, 'https://http2.mlstatic.com/D_NQ_NP_700964-MLA95498135511_102025-O.webp', 'Activo'),
  (2, 'Samsung Galaxy S24 Ultra', 'Samsung', 'S24 Ultra', 'Smartphone premium con cámara de 200MP.', 1299.00, 15, 'https://exitocol.vteximg.com.br/arquivos/ids/34013570/Celular-SAMSUNG-S24-ULTRA-5G-256-GB-12-GB-RAM-GRIS-3489469_a.jpg?v=639192914531030000', 'Activo'),
  (2, 'iPhone 16 Pro Max', 'Apple', 'iPhone 16 Pro Max', 'Smartphone premium Apple con chip A18 Pro.', 1199.00, 20, 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQq4PodP_oS-igeu9RABNl8DzF0RLEArgMfxxKGDlATzA&s=10', 'Activo'),
  (2, 'Xiaomi 14 Ultra', 'Xiaomi', '14 Ultra', 'Smartphone con cámara Leica y Snapdragon 8 Gen 3.', 999.00, 14, 'https://i02.appmifile.com/255_operator_sg/22/02/2024/a4050a1a59f6b0cfa1c175c59d99d432.png', 'Activo'),
  (3, 'Samsung Galaxy Tab S9 Ultra', 'Samsung', 'Tab S9 Ultra', 'Tablet premium de 14.6 pulgadas con S Pen.', 1199.00, 8, 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTutp18LuCE4xQysK_G-oA_Te5oj9kmddzr6jJmeKvG1m4jG1E5ZfyMOKU&s=10', 'Activo'),
  (5, 'ROG Delta S Wireless', 'ASUS', 'ROG Delta S', 'Audífonos gaming inalámbricos con sonido envolvente.', 199.00, 25, 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTjeA6akepx80LceOQs_6vNCOn0gLoZ2b_gp2-2o_MELA&s=10', 'Activo'),
  (6, 'Logitech G Pro X Superlight', 'Logitech', 'G Pro X', 'Mouse gaming inalámbrico ultraligero.', 159.00, 30, 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQaMwA4lQmg9R3X69wnfKkSJS4QD74UM_lTqUT41QeH6Q&s=10', 'Activo'),
  (6, 'ASUS ROG Strix Scope II', 'ASUS', 'Scope II', 'Teclado mecánico gaming con RGB.', 149.00, 20, 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRdysTREkSaYRpuPfiFrohNUENmdv8jNSCrCgbfo8gY1w&s=10', 'Activo'),
  (4, 'Cargador USB-C 100W', 'Genérico', 'USB-C 100W', 'Cargador USB-C de alta potencia para laptops.', 59.00, 50, 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTnLBmxxkqTq6eH82wo8cRio6XRhrP9nDMZWmW9qjPL9w&s', 'Activo');

-- Servicios
INSERT IGNORE INTO servicios (nombre, descripcion, precio, duracion_estimada, imagen, estado) VALUES
  ('Mantenimiento Preventivo', 'Limpieza interna, cambio de pasta térmica y revisión general del equipo.', 80.00, '2-3 horas', NULL, 'Activo'),
  ('Soporte Térmico', 'Diagnóstico y solución de problemas de sobrecalentamiento.', 50.00, '1-2 horas', NULL, 'Activo'),
  ('Instalación de Software', 'Instalación de sistema operativo, drivers y programas esenciales.', 40.00, '1-2 horas', NULL, 'Activo'),
  ('Recuperación de Datos', 'Recuperación de archivos eliminados o perdidos en discos duros/SSD.', 120.00, '24-48 horas', NULL, 'Activo');
