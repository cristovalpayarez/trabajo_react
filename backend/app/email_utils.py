"""
Envío de correo: código de recuperación de contraseña y factura en PDF.

Usa SMTP (por defecto Gmail) con las credenciales EMAIL_USER /
EMAIL_PASSWORD. El host, puerto y TLS son configurables (EMAIL_HOST,
EMAIL_PORT, EMAIL_STARTTLS). Si el envío falla (o no hay credenciales),
el código igual queda guardado en la base de datos y se imprime en la
consola del servidor, para no bloquear las pruebas locales.
"""

import smtplib
from email.mime.base import MIMEBase
from email.encoders import encode_base64
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from app.database import get_settings

settings = get_settings()


def correo_configurado() -> bool:
    """True si hay credenciales de correo en la configuración."""
    return bool(settings.EMAIL_USER and settings.EMAIL_PASSWORD)


def _crear_conexion_smtp() -> smtplib.SMTP:
    """Abre la conexión SMTP y hace login con las credenciales configuradas."""
    servidor = smtplib.SMTP(settings.EMAIL_HOST, settings.EMAIL_PORT, timeout=15)
    if settings.EMAIL_STARTTLS:
        servidor.starttls()
    servidor.login(settings.EMAIL_USER, settings.EMAIL_PASSWORD)
    return servidor


def _plantilla_texto(nombre: str, codigo: str) -> str:
    """Versión en texto plano del correo.

    Se envía junto a la versión HTML (multipart/alternative) porque los
    correos que solo llevan HTML tienen más probabilidad de caer en spam.
    """
    return (
        f"NEXUS TECH\n\n"
        f"Hola {nombre},\n\n"
        "Recibimos una solicitud para recuperar la contraseña de tu cuenta.\n"
        f"Tu código de recuperación es: {codigo}\n\n"
        "Este código es válido durante 10 minutos.\n"
        "Si tú no solicitaste este cambio, puedes ignorar este mensaje.\n"
    )


def _plantilla_html(nombre: str, codigo: str) -> str:
    return f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;
                padding: 30px; background: #111827; color: white; border-radius: 15px;">
        <h1 style="color: #2bf2fb; text-align: center;">NEXUS TECH</h1>
        <h2>Recuperación de contraseña</h2>
        <p>Hola {nombre},</p>
        <p>Recibimos una solicitud para recuperar la contraseña de tu cuenta.</p>
        <p>Tu código de recuperación es:</p>
        <div style="text-align: center; font-size: 36px; font-weight: bold;
                    letter-spacing: 8px; color: #b535f6; padding: 20px;">
            {codigo}
        </div>
        <p>Este código es válido durante <strong>10 minutos</strong>.</p>
        <p>Si tú no solicitaste este cambio, puedes ignorar este mensaje.</p>
    </div>
    """


def enviar_codigo_recuperacion(destinatario: str, nombre: str, codigo: str) -> bool:
    """Envía el código de recuperación.

    Devuelve True solo si el correo salió realmente. Si no hay credenciales
    o el envío falla, devuelve False e imprime un mensaje de respaldo en
    consola (el código también queda guardado en la base de datos).
    """
    if not correo_configurado():
        print(f"[email] EMAIL_USER/EMAIL_PASSWORD no configurados. Código para {destinatario}: {codigo}")
        print("[email] Configura EMAIL_USER y EMAIL_PASSWORD en backend/.env (local) o en las Variables de Railway.")
        return False

    mensaje = MIMEMultipart("alternative")
    mensaje["Subject"] = "Código para recuperar tu contraseña"
    mensaje["From"] = f"Nexus Tech <{settings.EMAIL_USER}>"
    mensaje["To"] = destinatario
    mensaje.attach(MIMEText(_plantilla_texto(nombre, codigo), "plain", "utf-8"))
    mensaje.attach(MIMEText(_plantilla_html(nombre, codigo), "html", "utf-8"))

    try:
        with _crear_conexion_smtp() as servidor:
            # sendmail NO lanza excepción cuando el servidor rechaza al
            # destinatario: devuelve un diccionario {correo: (código, motivo)}.
            # Si se ignora, el endpoint respondía "código enviado" aunque el
            # correo nunca se hubiera aceptado.
            rechazados = servidor.sendmail(settings.EMAIL_USER, destinatario, mensaje.as_string())
    except Exception as error:  # noqa: BLE001 - no debe tumbar el endpoint
        print(f"[email] No se pudo enviar el correo a {destinatario}: {error}")
        print(f"[email] Código de recuperación (respaldo en consola): {codigo}")
        return False

    if rechazados:
        print(f"[email] El servidor rechazó al destinatario {destinatario}: {rechazados}")
        print(f"[email] Código de recuperación (respaldo en consola): {codigo}")
        return False

    print(f"[email] Código de recuperación enviado a {destinatario}")
    return True


def enviar_factura_pdf(destinatario: str, nombre: str, pedido_id: int, total: float) -> bool:
    """Envía la factura PDF al correo del cliente.

    Devuelve True solo si el correo salió realmente; False si faltan las
    credenciales EMAIL_USER/EMAIL_PASSWORD o si el envío falló (así el
    checkout sabe si debe marcar factura_enviada).
    """
    if not correo_configurado():
        print(f"[email] EMAIL_USER/EMAIL_PASSWORD no configurados. Factura pendiente para {destinatario}")
        print("[email] Para enviar facturas por correo, agrega EMAIL_USER y EMAIL_PASSWORD en backend/.env")
        return False

    from app.factura_pdf import generar_factura_pdf
    from app.database import SessionLocal
    from app.models import Pedido, Usuario

    db = SessionLocal()
    try:
        pedido = db.query(Pedido).filter(Pedido.id == pedido_id).first()
        if not pedido:
            print(f"[email] Pedido {pedido_id} no encontrado para enviar factura")
            return False

        usuario = db.query(Usuario).filter(Usuario.id == pedido.usuario_id).first()
        pdf_bytes = generar_factura_pdf(pedido, usuario)
    finally:
        db.close()

    mensaje = MIMEMultipart("mixed")
    mensaje["Subject"] = f"Factura #{pedido_id} - NEXUS TECH"
    mensaje["From"] = f"NEXUS TECH <{settings.EMAIL_USER}>"
    mensaje["To"] = destinatario

    cuerpo_html = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;
                padding: 30px; background: #111827; color: white; border-radius: 15px;">
        <h1 style="color: #2bf2fb; text-align: center;">NEXUS TECH</h1>
        <h2>Tu factura #{pedido_id} está adjunta</h2>
        <p>Hola {nombre},</p>
        <p>Gracias por tu compra. Adjuntamos tu factura electrónica.</p>
        <p style="color: #2bf2fb;"><b>Total facturado: ${total:,.2f} COP</b></p>
        <p>Puedes descargar el PDF de esta factura desde tu cuenta.</p>
        <p style="margin-top: 30px; color: #6B7280; font-size: 11px;">
            Este es un mensaje automático. Por favor, no respondas este correo.
        </p>
    </div>
    """

    mensaje.attach(MIMEText(cuerpo_html, "html"))

    parte_pdf = MIMEBase("application", "pdf")
    parte_pdf.set_payload(pdf_bytes)
    encode_base64(parte_pdf)
    parte_pdf.add_header(
        "Content-Disposition",
        f"attachment; filename=factura_{pedido_id}.pdf",
    )
    mensaje.attach(parte_pdf)

    try:
        with _crear_conexion_smtp() as servidor:
            rechazados = servidor.sendmail(settings.EMAIL_USER, destinatario, mensaje.as_string())
    except Exception as error:
        print(f"[email] Error enviando factura #{pedido_id} a {destinatario}: {error}")
        return False

    if rechazados:
        print(f"[email] El servidor rechazó al destinatario {destinatario}: {rechazados}")
        return False

    print(f"[email] Factura #{pedido_id} enviada a {destinatario}")
    return True