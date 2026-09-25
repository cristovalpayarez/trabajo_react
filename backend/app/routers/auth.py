"""
/api/auth — registro, login y recuperación de contraseña.

Es el equivalente directo de src/controllers/authController.js del backend
en Node.js: mismas rutas, mismos nombres de campos JSON (correo, mensaje,
usuario, token...) para que React no necesite ningún cambio.
"""

import random
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.database import get_db, get_settings
from app.email_utils import correo_configurado, enviar_codigo_recuperacion
from app.models import Rol, Usuario
from app.schemas import (
    ForgotPasswordRequest,
    LoginRequest,
    LoginResponse,
    RegistroUsuario,
    ResetPasswordRequest,
    UsuarioResumen,
    VerifyResetCodeRequest,
)
from app.security import (
    buscar_rol,
    create_access_token,
    hash_password,
    require_permission,
    verify_password,
)

router = APIRouter(prefix="/api/auth", tags=["Autenticación"])

settings = get_settings()


def _registrar_con_rol(datos: RegistroUsuario, nombre_rol: str, db: Session) -> Usuario:
    correo_normalizado = datos.correo.strip().lower()
    documento_normalizado = datos.numero_documento.strip()

    existente = (
        db.query(Usuario)
        .filter(or_(Usuario.correo == correo_normalizado, Usuario.numero_documento == documento_normalizado))
        .first()
    )
    if existente:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={"mensaje": "El correo o número de documento ya está registrado"},
        )

    # buscar_rol acepta 'cliente'/'Cliente', 'empleado'/'Empleado', etc., así
    # que el registro funciona sin importar cómo estén escritos los roles.
    rol = buscar_rol(db, nombre_rol)
    if not rol:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"mensaje": "El rol solicitado no está configurado"},
        )

    usuario = Usuario(
        nombre=datos.nombre,
        apellido=datos.apellido,
        tipo_documento=datos.tipo_documento,
        numero_documento=documento_normalizado,
        direccion=datos.direccion,
        telefono=datos.telefono,
        correo=correo_normalizado,
        password_hash=hash_password(datos.password),
        rol_id=rol.id,
        estado="Activo",
    )
    db.add(usuario)
    db.commit()
    db.refresh(usuario)
    return usuario


@router.post("/register", status_code=status.HTTP_201_CREATED)
def register(datos: RegistroUsuario, db: Session = Depends(get_db)):
    usuario = _registrar_con_rol(datos, "cliente", db)
    return {"mensaje": "Usuario registrado correctamente", "usuarioId": usuario.id}


@router.post(
    "/register/empleado",
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_permission("empleados.crear"))],
)
def register_empleado(datos: RegistroUsuario, db: Session = Depends(get_db)):
    usuario = _registrar_con_rol(datos, "empleado", db)
    return {"mensaje": "Usuario registrado correctamente", "usuarioId": usuario.id}


@router.post("/login", response_model=LoginResponse)
def login(datos: LoginRequest, db: Session = Depends(get_db)):
    correo_normalizado = datos.correo.strip().lower()

    usuario = (
        db.query(Usuario).join(Rol, Rol.id == Usuario.rol_id).filter(Usuario.correo == correo_normalizado).first()
    )

    if not usuario or not verify_password(datos.password, usuario.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"mensaje": "Correo o contraseña incorrectos"},
        )

    if usuario.estado != "Activo":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"mensaje": "Esta cuenta está desactivada. Contacta al administrador."},
        )

    token = create_access_token({"id": usuario.id, "correo": usuario.correo, "rol": usuario.rol.nombre})

    return {
        "mensaje": "Inicio de sesión exitoso",
        "token": token,
        "usuario": {
            "id": usuario.id,
            "nombre": usuario.nombre,
            "apellido": usuario.apellido,
            "correo": usuario.correo,
            "rol": usuario.rol.nombre,
        },
    }


@router.post("/forgot-password")
def forgot_password(datos: ForgotPasswordRequest, db: Session = Depends(get_db)):
    correo_normalizado = datos.correo.strip().lower()
    usuario = db.query(Usuario).filter(Usuario.correo == correo_normalizado).first()

    # Si el correo no está registrado se dice claramente. Antes se respondía
    # siempre "si el correo está registrado, recibirás un código", así que el
    # frontend mostraba "código enviado" y el usuario esperaba para siempre un
    # correo que nunca iba a llegar (un correo mal escrito o una cuenta que no
    # existe, como admin@nexustech.com).
    if not usuario:
        print(f"[auth] Recuperación pedida para un correo no registrado: {correo_normalizado}")
        return {
            "mensaje": (
                "No hay ninguna cuenta registrada con ese correo. "
                "Verifica que esté bien escrito o regístrate primero."
            ),
            "correo_registrado": False,
            "correo_enviado": False,
        }

    codigo = f"{random.randint(100000, 999999)}"
    usuario.reset_code = codigo
    usuario.reset_code_expires = datetime.now(timezone.utc) + timedelta(minutes=10)
    db.commit()

    # Se intenta enviar el correo siempre que haya credenciales configuradas.
    if correo_configurado():
        enviado = enviar_codigo_recuperacion(usuario.correo, usuario.nombre, codigo)
    else:
        print(f"[auth] Sin credenciales de correo. Código para {usuario.correo}: {codigo}")
        enviado = False

    # El código también se muestra en pantalla cuando el correo no se pudo
    # confirmar (modo demostración). Es necesario porque SMTP puede aceptar un
    # destinatario que no existe y devolver el correo después como rebote: sin
    # esto el usuario no tendría forma de completar la recuperación.
    modo_demo = settings.RECUPERACION_MODO_DEMO or not enviado

    if modo_demo:
        if enviado:
            mensaje = (
                "Se envió el código a tu correo. Si no lo ves en unos minutos, "
                "revisa la carpeta de spam; también puedes usar este código aquí (modo demostración)."
            )
        elif correo_configurado():
            print(
                f"[auth] El correo de recuperación NO se entregó a {usuario.correo}. "
                "Revisa EMAIL_USER/EMAIL_PASSWORD y los logs [email] del servidor."
            )
            mensaje = (
                "No se pudo enviar el código por correo en este momento. "
                "Usa el código temporal que se muestra abajo para continuar (modo demostración)."
            )
        else:
            mensaje = (
                "El envío automático de correo no está configurado en este servidor. "
                "Usa el código temporal que se muestra abajo para continuar (modo demostración)."
            )
        return {
            "mensaje": mensaje,
            "correo_registrado": True,
            "correo_enviado": enviado,
            "codigo_temporal": codigo,
        }

    return {
        "mensaje": "Si el correo está registrado, recibirás un código de recuperación.",
        "correo_registrado": True,
        "correo_enviado": True,
    }


@router.post("/verify-reset-code")
def verify_reset_code(datos: VerifyResetCodeRequest, db: Session = Depends(get_db)):
    correo_normalizado = datos.correo.strip().lower()
    codigo_normalizado = datos.codigo.strip()

    usuario = db.query(Usuario).filter(Usuario.correo == correo_normalizado).first()

    if not usuario:
        raise HTTPException(status_code=400, detail={"mensaje": "Código inválido o expirado"})

    if usuario.reset_code != codigo_normalizado:
        raise HTTPException(status_code=400, detail={"mensaje": "Código incorrecto"})

    expira = usuario.reset_code_expires
    if expira and expira.tzinfo is None:
        expira = expira.replace(tzinfo=timezone.utc)

    if not expira or datetime.now(timezone.utc) > expira:
        raise HTTPException(status_code=400, detail={"mensaje": "El código ha expirado. Solicita uno nuevo."})

    return {"mensaje": "Código verificado correctamente"}


@router.post("/reset-password")
def reset_password(datos: ResetPasswordRequest, db: Session = Depends(get_db)):
    correo_normalizado = datos.correo.strip().lower()
    codigo_normalizado = datos.codigo.strip()

    usuario = db.query(Usuario).filter(Usuario.correo == correo_normalizado).first()

    if not usuario:
        raise HTTPException(status_code=400, detail={"mensaje": "Solicitud de recuperación inválida"})

    if usuario.reset_code != codigo_normalizado:
        raise HTTPException(status_code=400, detail={"mensaje": "Código incorrecto"})

    expira = usuario.reset_code_expires
    if expira and expira.tzinfo is None:
        expira = expira.replace(tzinfo=timezone.utc)

    if not expira or datetime.now(timezone.utc) > expira:
        raise HTTPException(status_code=400, detail={"mensaje": "El código ha expirado. Solicita uno nuevo."})

    usuario.password_hash = hash_password(datos.nuevaPassword)
    usuario.reset_code = None
    usuario.reset_code_expires = None
    db.commit()

    return {"mensaje": "Contraseña actualizada correctamente"}
