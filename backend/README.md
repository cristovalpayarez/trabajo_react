# NEXUS TECH · Backend FastAPI (Cuarto Avance)

Backend en **Python + FastAPI** que reemplaza al backend anterior en Node.js/Express,
manteniendo exactamente los mismos endpoints (`/api/auth`, `/api/usuarios`,
`/api/productos`, `/api/pedidos`) y el mismo puerto (**8000**), para que el
frontend en React + Vite siga funcionando **sin cambiar ni una línea de diseño**.

Se agregó además `/api/servicios` y una tabla real de **permisos por rol**
(`roles` → `rol_permisos` → `permisos`) en la base de datos, pedidas como
mínimo por la guía del cuarto avance.

## 1. Requisitos previos

- Python 3.11 o superior instalado en Windows.
- MySQL corriendo (el mismo que ya usabas con phpMyAdmin) con la base de
  datos `tienda_tecnologica`.

## 2. Crear la base de datos

Abre phpMyAdmin → pestaña **SQL** → pega y ejecuta el contenido completo de
`database/schema.sql`. Es seguro volver a ejecutarlo aunque la base ya
exista: usa `CREATE TABLE IF NOT EXISTS` e `INSERT IGNORE`, así que **no
borra** usuarios, productos ni pedidos que ya tengas.

Si tu base de datos actual (creada con el backend en Node.js) tiene la
tabla `pedido_detalles` en vez de `detalle_pedido`, o la columna
`fecha_creacion` en vez de `fecha_pedido` dentro de `pedidos`, descomenta
las dos últimas líneas del script (`RENAME TABLE...` / `ALTER TABLE...`)
antes de ejecutarlo.

## 3. Configurar el entorno virtual de Python

Desde la carpeta `backend/`, en una terminal de Windows (PowerShell o CMD):

```bash
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

## 4. Variables de entorno

El archivo `.env` ya viene con la configuración que tenías en el backend
anterior (mismo host/usuario de MySQL, misma clave JWT, mismas credenciales
de Gmail para el correo de recuperación de contraseña). Revísalo y ajusta
`DB_PASSWORD` si tu MySQL tiene contraseña. **No subas este archivo a un
repositorio público** (ya está listado en `.gitignore`).

Si te falta el archivo, copia la plantilla y completa los valores:

```bash
copy .env.example .env
```

### Chatbot con Inteligencia Artificial (Google Gemini)

Para que el chatbot responda con IA agrega al `.env` la clave de Gemini
(la obtienes gratis en https://aistudio.google.com/app/apikey):

```
GEMINI_API_KEY=tu_clave_privada
GEMINI_MODEL=gemini-2.0-flash
```

- La clave se lee con `get_settings()` desde el `.env`: **nunca** se escribe
  en el código ni se expone al frontend.
- Si no hay clave configurada, el chatbot sigue funcionando con el motor
  local de respuestas (`_respuesta_local`), que responde sobre los mismos
  temas (productos, servicios, pedidos, facturas, PQR, pagos, envíos...).
- El asistente está limitado a la tienda: si le preguntas algo ajeno a
  NEXUS TECH responde que solo puede ayudar con temas de la página.

## 5. Levantar el servidor

```bash
uvicorn app.main:app --reload --port 8000
```

- API: `http://localhost:8000`
- Documentación interactiva (Swagger): `http://localhost:8000/docs`
- Prueba de conexión a MySQL: `http://localhost:8000/test-db`

Con el backend en marcha, corre el frontend como siempre (`npm run dev`
dentro de `frontend/`) — no necesita ningún cambio, sigue apuntando a
`http://localhost:8000/api/...`.

## 6. Endpoints disponibles

### Autenticación (`/api/auth`)
| Método | Ruta | Acceso |
|---|---|---|
| POST | `/api/auth/register` | Público (registro de cliente) |
| POST | `/api/auth/register/empleado` | Admin |
| POST | `/api/auth/login` | Público |
| POST | `/api/auth/forgot-password` | Público |
| POST | `/api/auth/verify-reset-code` | Público |
| POST | `/api/auth/reset-password` | Público |

### Usuarios (`/api/usuarios`)
| Método | Ruta | Acceso |
|---|---|---|
| PUT | `/api/usuarios/perfil` | Usuario autenticado (sus propios datos) |
| GET | `/api/usuarios` | Admin / Empleado |
| GET | `/api/usuarios/{id}` | Admin / Empleado |
| PUT | `/api/usuarios/{id}` | Admin (edita cualquier usuario) |
| PATCH | `/api/usuarios/{id}/estado` | Admin / Empleado |
| PATCH | `/api/usuarios/{id}/rol` | Admin (asigna rol: admin / vendedor / empleado / cliente) |
| POST | `/api/usuarios/empleados` | Admin |
| DELETE | `/api/usuarios/{id}` | Admin |

### Productos (`/api/productos`)
| Método | Ruta | Acceso |
|---|---|---|
| GET | `/api/productos` | Público |
| GET | `/api/productos/{id}` | Público |
| POST | `/api/productos` | Admin / Empleado |
| PUT | `/api/productos/{id}` | Admin / Empleado |
| DELETE | `/api/productos/{id}` | Admin / Empleado |

### Servicios (`/api/servicios`) — nuevo, entidad mínima pedida por la guía
| Método | Ruta | Acceso |
|---|---|---|
| GET | `/api/servicios` | Público |
| GET | `/api/servicios/{id}` | Público |
| POST | `/api/servicios` | Admin / Empleado |
| PUT | `/api/servicios/{id}` | Admin / Empleado |
| DELETE | `/api/servicios/{id}` | Admin / Empleado |

### Pedidos (`/api/pedidos`)
| Método | Ruta | Acceso |
|---|---|---|
| GET | `/api/pedidos` | Usuario autenticado (los suyos; Admin/Empleado ven todos) |
| POST | `/api/pedidos` | Usuario autenticado |
| PATCH / PUT | `/api/pedidos/{id}/estado` | Admin / Empleado |

### Ventas (`/api/ventas`) — quinto avance
| Método | Ruta | Acceso |
|---|---|---|
| GET | `/api/ventas` | Staff ve todas; cliente solo las suyas (filtros: `fecha_inicio`, `fecha_fin`, `cliente`, `estado`) |
| POST | `/api/ventas` | Usuario autenticado. Registra la venta **y genera su factura automáticamente** |
| POST | `/api/ventas/demo?cantidad=15` | Admin / Empleado. Crea ventas de ejemplo repartidas en los últimos 60 días para alimentar los gráficos y reportes |
| GET | `/api/ventas/{id}` | Usuario autenticado |
| GET | `/api/ventas/reporte-diario?fecha=YYYY-MM-DD` | Admin / Empleado |
| GET | `/api/ventas/estadisticas` | Usuario autenticado |
| PATCH | `/api/ventas/{id}/estado` | Admin / Empleado |

### Facturas (`/api/facturas`) — quinto avance
| Método | Ruta | Acceso |
|---|---|---|
| GET | `/api/facturas` | Staff ve todas; cliente solo las suyas (filtros: `cliente`, `fecha`, `estado`) |
| POST | `/api/facturas` | Admin / Empleado |
| GET | `/api/facturas/{id}/pdf` | Usuario autenticado (descarga la factura en PDF) |
| PATCH | `/api/facturas/{id}/estado?estado=Pagada` | Admin / Empleado |

### Reportes (`/api/reportes`) — quinto avance
| Método | Ruta | Acceso |
|---|---|---|
| GET | `/api/reportes/ventas/pdf` | Admin / Empleado (`fecha` o `fecha_inicio` + `fecha_fin`) |
| GET | `/api/reportes/ventas/excel` | Admin / Empleado (`.xlsx` con columnas para analizar) |

El reporte **PDF** usa el mismo diseño de la página (fondo oscuro, franjas neón
violeta/cian, tarjetas de indicadores y tabla de ventas).

### PQR (`/api/pqr`) — quinto avance
| Método | Ruta | Acceso |
|---|---|---|
| GET | `/api/pqr` | Staff ve todas; cliente solo las suyas |
| POST | `/api/pqr` | Usuario autenticado |
| GET | `/api/pqr/{id}` | Dueño o staff |
| PUT | `/api/pqr/{id}/responder` | Admin / Empleado |
| PATCH | `/api/pqr/{id}/estado` | Admin / Empleado |

### Dashboard (`/api/dashboard`) — quinto avance
| Método | Ruta | Acceso |
|---|---|---|
| GET | `/api/dashboard/stats` | Admin / Empleado (cards: usuarios, productos, servicios, ventas, facturas, PQR, ventas y facturación de hoy) |
| GET | `/api/dashboard/ventas-por-dia?dias=30` | Usuario autenticado (gráfico de barras) |
| GET | `/api/dashboard/ventas-por-mes?meses=12` | Usuario autenticado (gráfico lineal) |
| GET | `/api/dashboard/stats-ventas` | Usuario autenticado |

### Chatbot con IA (`/api/chatbot`) — quinto avance
| Método | Ruta | Acceso |
|---|---|---|
| POST | `/api/chatbot/mensajes` | Público (`{ "mensaje": "...", "sesion_id": "..." }`) |
| GET | `/api/chatbot/conversaciones/{sesion_id}` | Público (historial de la conversación) |

El chatbot usa **Google Gemini** cuando `GEMINI_API_KEY` está en el `.env` y,
si no, responde con el motor local de reglas. En ambos casos solo contesta
temas de NEXUS TECH y su página web.

## 7. Cómo funciona la autenticación y los permisos

- El login devuelve un JWT firmado con `JWT_SECRET` (payload: `id`, `correo`, `rol`).
- Cada request a un endpoint protegido debe enviar `Authorization: Bearer <token>`.
- Los permisos ya no están "quemados" en el código como listas de roles: viven
  en las tablas `roles`, `permisos` y `rol_permisos` (creadas por `schema.sql`).
  Por ejemplo, el rol `empleado` tiene el permiso `productos.crear` pero NO
  `usuarios.eliminar`. Puedes revisar o modificar estos permisos directamente
  desde phpMyAdmin sin tocar el código Python.
- Las contraseñas se guardan con **bcrypt** (nunca en texto plano). Como el
  formato bcrypt es el mismo en Node.js y en Python, los usuarios que ya se
  registraron con el backend anterior pueden seguir iniciando sesión sin
  problema.

## 8. Probar con Postman / Swagger

1. Abre `http://localhost:8000/docs` y prueba cada endpoint ahí mismo, o
   importa la colección en Postman apuntando a `http://localhost:8000`.
2. Flujo sugerido para las evidencias que pide la guía:
   1. `POST /api/auth/register` → crear un cliente.
   2. `POST /api/auth/login` → copiar el `token` de la respuesta.
   3. En Postman, pestaña **Authorization → Bearer Token**, pega el token.
   4. `GET /api/usuarios` con ese token de cliente → debe responder **403**
      (no tiene el permiso `usuarios.ver`). Repite el login con un usuario
      `admin` para ver que sí funciona.
   5. `GET /api/usuarios/{id}` (Admin o Empleado) y `PUT /api/usuarios/{id}`
      (solo Admin: prueba con un token de Empleado y confirma que da **403**)
      → CRUD completo de usuarios.
   6. `POST /api/productos`, `GET /api/productos`, `PUT /api/productos/{id}`,
      `DELETE /api/productos/{id}` → CRUD completo de productos.
   7. `POST /api/pedidos` (con un cliente) → `GET /api/pedidos` (como admin,
      verás todos; como cliente, solo los tuyos) → `PATCH /api/pedidos/{id}/estado`.
   8. Quita el header `Authorization` y repite una ruta protegida → debe
      responder **401 "Token no proporcionado"**.
   9. Cambia una letra del token y repite → debe responder **401 "Token
      inválido o expirado"**.
3. Toma capturas de cada respuesta (200/201, 401, 403, 404, 409) como
   evidencia.

## 9. Primer usuario administrador

No hay una ruta pública para crear administradores (por seguridad). Para
crear el primero:

1. Regístrate normalmente desde el formulario de React (queda como `cliente`).
2. En phpMyAdmin, en la tabla `usuarios`, cambia manualmente el `rol_id` de
   ese usuario al `id` del rol `admin` (tabla `roles`).
3. Vuelve a iniciar sesión: el nuevo token ya traerá el rol `admin` y podrás
   usar `/admin/empleados` para crear empleados desde la propia aplicación.

## 10. Limpieza de archivos que ya no se usan

Esta carpeta `backend/` contiene el proyecto en Python. Si en algún momento
tuviste el backend anterior en Node.js aquí (`server.js`, `package.json`,
`node_modules/`, `src/` en JavaScript, `scripts/import-products.js`), ya no
se usan y puedes borrarlos sin problema.

Además, si reorganizaste el backend en Python siguiendo una versión anterior
de esta guía, es posible que todavía tengas dos archivos que ya se
fusionaron con otros y quedaron obsoletos — bórralos si aparecen:

- `app/config.py` (su contenido ahora vive dentro de `app/database.py`)
- `app/deps.py` (su contenido ahora vive dentro de `app/security.py`)

`database/schema.sql` sí se conserva porque lo usa el backend en Python.

## 11. Estructura del proyecto

```
backend/
├── app/
│   ├── main.py          # arranque de FastAPI, CORS, manejo de errores
│   ├── database.py       # variables de entorno (.env) + conexión SQLAlchemy/MySQL
│   ├── models.py         # tablas (SQLAlchemy ORM)
│   ├── schemas.py        # validación de datos (Pydantic)
│   ├── security.py       # hashing bcrypt + JWT + autenticación/permisos por rol
│   ├── email_utils.py    # correo de recuperación de contraseña
│   └── routers/          # un archivo por grupo de endpoints
│       ├── auth.py
│       ├── usuarios.py
│       ├── productos.py
│       ├── servicios.py
│       └── pedidos.py
├── database/
│   └── schema.sql
├── requirements.txt
├── .env
├── .env.example
└── README.md
```

**Por qué está organizado así:** cada archivo agrupa una sola
responsabilidad, para que sepas dónde buscar sin adivinar:

| Archivo | Qué resuelve |
|---|---|
| `main.py` | El punto de arranque: junta todos los `routers/`, configura CORS y da formato a los errores. Es el único archivo que "conoce" a todos los demás. |
| `database.py` | Todo lo de "hablar con el exterior": leer el `.env` y abrir la conexión a MySQL. |
| `models.py` | Las tablas de la base de datos, como objetos de Python (SQLAlchemy). |
| `schemas.py` | Las reglas de validación de lo que entra/sale por la API (Pydantic) — la guía pide explícitamente separarlo de `models.py`. |
| `security.py` | Todo lo de "quién eres y qué puedes hacer": hashing de contraseñas, generar/leer el JWT, y verificar permisos por rol. |
| `email_utils.py` | Solo el envío del correo de recuperación de contraseña. |
| `routers/` | Los endpoints en sí, uno por entidad (`auth`, `usuarios`, `productos`, `servicios`, `pedidos`), para no mezclar las rutas de todo en un solo archivo gigante. |
                  