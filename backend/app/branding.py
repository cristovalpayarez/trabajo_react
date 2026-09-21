"""
Identidad visual de NEXUS TECH para documentos generados (PDF y Excel).

Replica el lenguaje visual de la página web:
- Logo: hexágono con la "N" estilizada (ver frontend/src/components/NexusLogo.jsx)
- Paleta: fondo oscuro #020b1a, acentos neón violeta #b535f6 y cian #2bf2fb
"""

from functools import lru_cache

from reportlab.lib import colors
from reportlab.pdfbase.pdfmetrics import stringWidth

# ----- Paleta web (objetos Color de reportlab) -----
COLOR_FONDO = colors.HexColor("#020b1a")
COLOR_PANEL = colors.HexColor("#0b1226")
COLOR_PANEL_ALT = colors.HexColor("#070e1f")
COLOR_NEON_BLUE = colors.HexColor("#2bf2fb")
COLOR_CYAN = colors.HexColor("#22d3ee")
COLOR_VIOLET = colors.HexColor("#b535f6")
COLOR_TEXTO = colors.HexColor("#e2e8f0")
COLOR_TEXTO_SUAVE = colors.HexColor("#94a3b8")
COLOR_BORDE = colors.HexColor("#1e293b")

# ----- Paleta para openpyxl (hex sin #) -----
XL_FONDO = "020B1A"
XL_PANEL = "0B1226"
XL_PANEL_ALT = "070E1F"
XL_CYAN = "2BF2FB"
XL_VIOLET = "B535F6"
XL_TEXTO = "E2E8F0"
XL_SUAVE = "94A3B8"
XL_BORDE = "1E293B"
XL_BLANCO = "FFFFFF"
XL_VERDE = "34D399"
XL_AMBAR = "FBBF24"
XL_ROJO = "F87171"

TEXTO_TAGLINE = "Tecnología de vanguardia para tu vida"


def dibujar_logo_nexus(canvas, x, y, escala=1.0, centrado=False):
    """Dibuja el logo hexagonal con la N junto al texto "NEXUS TECH".

    Args:
        canvas: canvas de reportlab.
        x: posición horizontal (borde izquierdo, o centro si centrado=True).
        y: línea base del texto "NEXUS TECH".
        escala: 1.0 ≈ hexágono de 24pt con texto de 19pt.
        centrado: si True, x se interpreta como el centro del conjunto.

    Returns:
        El ancho total dibujado (logo + separación + texto).
    """
    cian = COLOR_NEON_BLUE
    violeta = COLOR_VIOLET

    lado = 24.0 * escala      # tamaño de la caja del logo (60 unidades svg)
    fuente = 19.0 * escala    # tamaño del texto
    gap = 7.0 * escala        # separación logo-texto
    f = lado / 60.0           # factor svg → pdf

    ancho_texto = (
        stringWidth("NEXUS", "Helvetica-Bold", fuente)
        + 0.55 * fuente
        + stringWidth("TECH", "Helvetica-Bold", fuente)
    )
    ancho_total = lado + gap + ancho_texto
    x0 = (x - ancho_total / 2.0) if centrado else x
    # Borde inferior de la caja del logo, centrado con la mitad alta del texto
    yb = y + 0.30 * fuente - lado / 2.0

    canvas.saveState()

    # Hexágono exterior (coordenadas SVG volteadas a PDF)
    hexagono = canvas.beginPath()
    hexagono.moveTo(x0 + 30 * f, yb + 57 * f)
    hexagono.lineTo(x0 + 54 * f, yb + 44 * f)
    hexagono.lineTo(x0 + 54 * f, yb + 16 * f)
    hexagono.lineTo(x0 + 30 * f, yb + 3 * f)
    hexagono.lineTo(x0 + 6 * f, yb + 16 * f)
    hexagono.lineTo(x0 + 6 * f, yb + 44 * f)
    hexagono.close()
    canvas.setStrokeColor(cian)
    canvas.setLineWidth(4 * f)
    canvas.setLineJoin(1)
    canvas.drawPath(hexagono, stroke=1, fill=0)

    # "N" estilizada
    n_path = canvas.beginPath()
    n_path.moveTo(x0 + 18 * f, yb + 18 * f)
    n_path.lineTo(x0 + 18 * f, yb + 42 * f)
    n_path.lineTo(x0 + 42 * f, yb + 18 * f)
    n_path.lineTo(x0 + 42 * f, yb + 42 * f)
    canvas.setStrokeColor(violeta)
    canvas.setLineWidth(5 * f)
    canvas.setLineCap(1)
    canvas.drawPath(n_path, stroke=1, fill=0)

    # Punto central
    canvas.setFillColor(cian)
    canvas.circle(x0 + 30 * f, yb + 30 * f, 3 * f, stroke=0, fill=1)

    # Texto a la derecha del logo
    canvas.setFont("Helvetica-Bold", fuente)
    canvas.setFillColor(colors.white)
    cursor = x0 + lado + gap
    canvas.drawString(cursor, y, "NEXUS")
    cursor += stringWidth("NEXUS", "Helvetica-Bold", fuente) + 0.55 * fuente
    canvas.setFillColor(cian)
    canvas.drawString(cursor, y, "TECH")

    canvas.restoreState()
    return ancho_total


def dibujar_tagline(canvas, x, y, escala=1.0, centrado=False):
    """Dibuja el eslogan de la marca bajo el logo."""
    fuente = 9.0 * escala
    if centrado:
        x = x - stringWidth(TEXTO_TAGLINE, "Helvetica-Oblique", fuente) / 2.0
    canvas.saveState()
    canvas.setFont("Helvetica-Oblique", fuente)
    canvas.setFillColor(COLOR_TEXTO_SUAVE)
    canvas.drawString(x, y, TEXTO_TAGLINE)
    canvas.restoreState()


def dibujar_linea_neon(canvas, x, y, ancho, grosor=2.5):
    """Línea degradada violeta → cian, como las de la página."""
    canvas.saveState()
    canvas.setFillColor(COLOR_VIOLET)
    canvas.rect(x, y, ancho / 2.0, grosor, stroke=0, fill=1)
    canvas.setFillColor(COLOR_NEON_BLUE)
    canvas.rect(x + ancho / 2.0, y, ancho / 2.0, grosor, stroke=0, fill=1)
    canvas.restoreState()


# ============================================================
# LOGO PNG (para Excel / documentos que solo aceptan imágenes)
# ============================================================


@lru_cache(maxsize=1)
def generar_logo_png(escala: int = 4) -> bytes:
    """Genera el logo de NEXUS TECH como PNG transparente.

    Réplica del isotipo de la web (frontend/src/components/NexusLogo.jsx):
    hexágono con borde degradado violeta→cian, "N" violeta y punto cian,
    junto al texto "NEXUS TECH".
    """
    from io import BytesIO

    from PIL import Image, ImageDraw, ImageFont

    caja = 120 * escala          # caja del hexágono (60 unidades svg x2)
    ancho_texto_aprox = 340 * escala
    W = caja + 20 * escala + ancho_texto_aprox
    H = caja + 20 * escala
    ox, oy = 10 * escala, 10 * escala
    f = caja / 60.0

    def _fuente(tamano: int):
        for ruta in ("C:/Windows/Fonts/arialbd.ttf", "C:/Windows/Fonts/segoeuib.ttf"):
            try:
                return ImageFont.truetype(ruta, tamano)
            except OSError:
                continue
        return ImageFont.load_default()

    # --- Gradiente diagonal violeta → cian (pincel para el contorno) ---
    grad = Image.new("RGB", (W, H))
    d_grad = ImageDraw.Draw(grad)
    violeta = (181, 53, 246)
    cian = (43, 242, 251)
    for x in range(W):
        for y_bloque in range(0, H, max(1, H // 8)):
            t = min(1.0, (x / W * 0.65) + (y_bloque / H * 0.35))
            color = tuple(int(violeta[i] + (cian[i] - violeta[i]) * t) for i in range(3))
            d_grad.line([(x, y_bloque), (x, min(H, y_bloque + max(1, H // 8)))], fill=color)

    logo = Image.new("RGBA", (W, H), (0, 0, 0, 0))

    # Contorno del hexágono como máscara, pintado con el gradiente
    mask = Image.new("L", (W, H), 0)
    d_mask = ImageDraw.Draw(mask)
    hex_pts = [
        (ox + 30 * f, oy + 3 * f),
        (ox + 54 * f, oy + 16 * f),
        (ox + 54 * f, oy + 44 * f),
        (ox + 30 * f, oy + 57 * f),
        (ox + 6 * f, oy + 44 * f),
        (ox + 6 * f, oy + 16 * f),
    ]
    d_mask.line(hex_pts + [hex_pts[0]], fill=255, width=int(4 * f), joint="curve")
    logo.paste(grad, (0, 0), mask)

    d = ImageDraw.Draw(logo)

    # "N" estilizada en violeta
    n_pts = [
        (ox + 18 * f, oy + 42 * f),
        (ox + 18 * f, oy + 18 * f),
        (ox + 42 * f, oy + 42 * f),
        (ox + 42 * f, oy + 18 * f),
    ]
    d.line(n_pts, fill=violeta + (255,), width=int(5 * f), joint="curve")

    # Punto central cian
    r = 3 * f
    d.ellipse(
        [ox + 30 * f - r, oy + 30 * f - r, ox + 30 * f + r, oy + 30 * f + r],
        fill=cian + (255,),
    )

    # Texto NEXUS TECH
    fuente_tam = int(38 * escala)
    fuente = _fuente(fuente_tam)
    y_texto = oy + caja / 2 - fuente_tam * 0.55
    x_texto = ox + caja + 20 * escala
    d.text((x_texto, y_texto), "NEXUS", font=fuente, fill=(255, 255, 255, 255))
    ancho_nexus = d.textlength("NEXUS", font=fuente)
    d.text(
        (x_texto + ancho_nexus + 10 * escala, y_texto),
        "TECH",
        font=fuente,
        fill=cian + (255,),
    )

    # Recorte al contenido real
    caja_contenido = logo.getbbox()
    if caja_contenido:
        logo = logo.crop(caja_contenido)

    buffer = BytesIO()
    logo.save(buffer, format="PNG")
    return buffer.getvalue()
