"""
Generación de facturas PDF para pedidos.

Usa reportlab para crear un PDF profesional con:
- Encabezado de la empresa (NEXUS TECH)
- Datos del cliente
- Detalle de productos
- Totales
- Fecha del pedido
"""

from datetime import datetime
from io import BytesIO

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import cm, mm
from reportlab.platypus import (
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

from app.branding import dibujar_linea_neon, dibujar_logo_nexus


def generar_factura_pdf(pedido: "Pedido", usuario: "Usuario") -> bytes:
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=20 * mm,
        leftMargin=20 * mm,
        topMargin=20 * mm,
        bottomMargin=20 * mm,
    )

    styles = getSampleStyleSheet()
    elements = []

    # El logo y la línea neón se dibujan en el encabezado de la página
    # (ver _encabezado_factura).
    elements.append(Spacer(1, 1.2 * cm))

    datos_header = [
        ["FECHA", datetime.now().strftime("%d/%m/%Y %H:%M")],
        ["NUMERO PEDIDO", f"#{pedido.id}"],
        ["ESTADO", pedido.estado],
    ]

    header_table = Table(datos_header, colWidths=[6 * cm, 10 * cm])
    header_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (0, -1), colors.HexColor("#F3F4F6")),
                ("TEXTCOLOR", (0, 0), (0, -1), colors.HexColor("#374151")),
                ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
                ("FONTNAME", (1, 0), (1, -1), "Helvetica"),
                ("FONTSIZE", (0, 0), (-1, -1), 10),
                ("ALIGN", (0, 0), (0, -1), "RIGHT"),
                ("ALIGN", (1, 0), (1, -1), "LEFT"),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#E5E7EB")),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ]
        )
    )
    elements.append(header_table)
    elements.append(Spacer(1, 0.5 * cm))

    cliente_style = ParagraphStyle(
        "ClienteLabel", parent=styles["Normal"], fontSize=12, leading=15,
        fontName="Helvetica-Bold", textColor=colors.HexColor("#b535f6"), spaceAfter=5,
    )
    elements.append(Paragraph("DATOS DEL CLIENTE", cliente_style))

    cliente_data = [
        ["Nombre completo:", f"{usuario.nombre} {usuario.apellido}"],
        ["Correo electrónico:", usuario.correo],
        ["Tipo de documento:", usuario.tipo_documento],
        ["Número de documento:", usuario.numero_documento],
    ]

    if usuario.direccion:
        cliente_data.append(["Dirección de envío:", usuario.direccion])

    cliente_table = Table(cliente_data, colWidths=[6 * cm, 10 * cm])
    cliente_table.setStyle(
        TableStyle(
            [
                ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
                ("FONTNAME", (1, 0), (1, -1), "Helvetica"),
                ("FONTSIZE", (0, 0), (-1, -1), 10),
                ("TEXTCOLOR", (0, 0), (0, -1), colors.HexColor("#374151")),
                ("TEXTCOLOR", (1, 0), (1, -1), colors.HexColor("#111827")),
                ("ALIGN", (0, 0), (0, -1), "RIGHT"),
                ("ALIGN", (1, 0), (1, -1), "LEFT"),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("TOPPADDING", (0, 0), (-1, -1), 4),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
                ("LINEBELOW", (0, 0), (-1, -1), 0.5, colors.HexColor("#E5E7EB")),
            ]
        )
    )
    elements.append(cliente_table)
    elements.append(Spacer(1, 0.8 * cm))

    productos_header = ParagraphStyle(
        "ProductosHeader", parent=styles["Normal"], fontSize=12, leading=15,
        fontName="Helvetica-Bold", textColor=colors.HexColor("#b535f6"), spaceAfter=10,
    )
    elements.append(Paragraph("DETALLE DE PRODUCTOS / SERVICIOS", productos_header))

    header_fila = [
        Paragraph("<b>#</b>", styles["Normal"]),
        Paragraph("<b>Producto</b>", styles["Normal"]),
        Paragraph("<b>Marca</b>", styles["Normal"]),
        Paragraph("<b>Cant.</b>", styles["Normal"]),
        Paragraph("<b>P. Unit.</b>", styles["Normal"]),
        Paragraph("<b>Subtotal</b>", styles["Normal"]),
    ]

    filas = [header_fila]
    for idx, detalle in enumerate(pedido.detalles, start=1):
        filas.append(
            [
                Paragraph(str(idx), styles["Normal"]),
                Paragraph(detalle.producto_nombre, styles["Normal"]),
                Paragraph(detalle.producto.marca if detalle.producto else "-", styles["Normal"]),
                Paragraph(str(detalle.cantidad), styles["Normal"]),
                Paragraph(f"${float(detalle.precio_unitario):,.2f}", styles["Normal"]),
                Paragraph(f"${float(detalle.precio_unitario * detalle.cantidad):,.2f}", styles["Normal"]),
            ]
        )

    detalle_table = Table(filas, colWidths=[1 * cm, 5 * cm, 2.5 * cm, 1.2 * cm, 2.2 * cm, 2.5 * cm])
    detalle_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#111827")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, 0), 10),
                ("ALIGN", (0, 0), (-1, 0), "CENTER"),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#D1D5DB")),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#F9FAFB")]),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
                ("ALIGN", (0, 1), (0, -1), "CENTER"),
                ("ALIGN", (3, 1), (5, -1), "RIGHT"),
            ]
        )
    )
    elements.append(detalle_table)
    elements.append(Spacer(1, 0.8 * cm))

    total_grand = float(pedido.total)
    total_data = [
        ["", ""],
        ["SUBTOTAL", f"${total_grand:,.2f}"],
        ["IVA (19%)", f"${total_grand * 0.19:,.2f}"],
        ["TOTAL CON IVA", f"${total_grand * 1.19:,.2f}"],
    ]

    total_table = Table(total_data, colWidths=[9 * cm, 5 * cm])
    total_table.setStyle(
        TableStyle(
            [
                ("SPAN", (0, 0), (-1, 0)),
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#F3F4F6")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.HexColor("#9CA3AF")),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica"),
                ("FONTSIZE", (0, 0), (-1, 0), 9),
                ("ALIGN", (0, 0), (-1, 0), "CENTER"),
                ("FONTNAME", (0, 1), (0, -1), "Helvetica"),
                ("FONTNAME", (1, 1), (1, -1), "Helvetica-Bold"),
                ("FONTSIZE", (0, 1), (-1, -1), 10),
                ("TEXTCOLOR", (0, 1), (0, -1), colors.HexColor("#374151")),
                ("TEXTCOLOR", (1, 1), (1, -1), colors.HexColor("#111827")),
                ("ALIGN", (0, 1), (0, -1), "RIGHT"),
                ("ALIGN", (1, 1), (1, -1), "RIGHT"),
                ("VALIGN", (0, 1), (-1, -1), "MIDDLE"),
                ("GRID", (0, 1), (-1, -1), 0.5, colors.HexColor("#E5E7EB")),
                ("TOPPADDING", (0, 1), (-1, -1), 7),
                ("BOTTOMPADDING", (0, 1), (-1, -1), 7),
                ("BACKGROUND", (0, -1), (-1, -1), colors.HexColor("#111827")),
                ("TEXTCOLOR", (0, -1), (-1, -1), colors.white),
                ("FONTNAME", (0, -1), (-1, -1), "Helvetica-Bold"),
            ]
        )
    )
    elements.append(total_table)
    elements.append(Spacer(1, 0.8 * cm))

    pie_style = ParagraphStyle(
        "Pie", parent=styles["Normal"], fontSize=9,
        fontName="Helvetica", textColor=colors.HexColor("#6B7280"), alignment=1,
    )
    elements.append(Paragraph("Gracias por tu compra. Para cualquier consulta, contactanos.", pie_style))
    elements.append(Spacer(1, 0.2 * cm))
    elements.append(Paragraph("contacto@nexustech.com.co  |  +57 304 469 7238", pie_style))
    elements.append(Spacer(1, 0.3 * cm))
    elements.append(Paragraph("Este documento es una factura electronica valida para fines de compra.", pie_style))

    doc.build(elements, onFirstPage=_encabezado_factura)
    buffer.seek(0)
    return buffer.read()


def generar_factura_pdf_desde_factura(factura) -> bytes:
    """Genera PDF de una factura de la tabla facturas."""
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=20 * mm,
        leftMargin=20 * mm,
        topMargin=20 * mm,
        bottomMargin=20 * mm,
    )

    styles = getSampleStyleSheet()
    elements = []

    # El logo y la línea neón se dibujan en el encabezado de la página
    # (ver _encabezado_factura).
    elements.append(Spacer(1, 1.2 * cm))

    datos_header = [
        ["NUMERO FACTURA", factura.numero_factura],
        ["FECHA", factura.fecha_factura.strftime("%d/%m/%Y %H:%M") if factura.fecha_factura else "-"],
        ["ESTADO", factura.estado],
    ]
    header_table = Table(datos_header, colWidths=[6 * cm, 10 * cm])
    header_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (0, -1), colors.HexColor("#F3F4F6")),
        ("TEXTCOLOR", (0, 0), (0, -1), colors.HexColor("#374151")),
        ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
        ("FONTNAME", (1, 0), (1, -1), "Helvetica"),
        ("FONTSIZE", (0, 0), (-1, -1), 10),
        ("ALIGN", (0, 0), (0, -1), "RIGHT"),
        ("ALIGN", (1, 0), (1, -1), "LEFT"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#E5E7EB")),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))
    elements.append(header_table)
    elements.append(Spacer(1, 0.5 * cm))

    cliente_style = ParagraphStyle(
        "ClienteLabel", parent=styles["Normal"], fontSize=12, leading=15,
        fontName="Helvetica-Bold", textColor=colors.HexColor("#b535f6"), spaceAfter=5,
    )
    elements.append(Paragraph("DATOS DEL CLIENTE", cliente_style))

    cliente_data = []
    if factura.cliente_nombre:
        cliente_data.append(["Nombre:", factura.cliente_nombre])
    if factura.cliente_documento:
        cliente_data.append(["Documento:", factura.cliente_documento])
    if factura.cliente_correo:
        cliente_data.append(["Correo:", factura.cliente_correo])
    if factura.cliente_direccion:
        cliente_data.append(["Direccion:", factura.cliente_direccion])

    if cliente_data:
        cliente_table = Table(cliente_data, colWidths=[6 * cm, 10 * cm])
        cliente_table.setStyle(TableStyle([
            ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
            ("FONTNAME", (1, 0), (1, -1), "Helvetica"),
            ("FONTSIZE", (0, 0), (-1, -1), 10),
            ("ALIGN", (0, 0), (0, -1), "RIGHT"),
            ("ALIGN", (1, 0), (1, -1), "LEFT"),
            ("TOPPADDING", (0, 0), (-1, -1), 4),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
            ("LINEBELOW", (0, 0), (-1, -1), 0.5, colors.HexColor("#E5E7EB")),
        ]))
        elements.append(cliente_table)

    elements.append(Spacer(1, 0.8 * cm))

    if factura.detalles:
        elements.append(Paragraph("DETALLE DE PRODUCTOS / SERVICIOS", cliente_style))

        header_fila = [
            Paragraph("<b>#</b>", styles["Normal"]),
            Paragraph("<b>Item</b>", styles["Normal"]),
            Paragraph("<b>Tipo</b>", styles["Normal"]),
            Paragraph("<b>Cant.</b>", styles["Normal"]),
            Paragraph("<b>P. Unit.</b>", styles["Normal"]),
            Paragraph("<b>Subtotal</b>", styles["Normal"]),
        ]

        filas = [header_fila]
        for idx, d in enumerate(factura.detalles, start=1):
            filas.append([
                Paragraph(str(idx), styles["Normal"]),
                Paragraph(d.item_nombre, styles["Normal"]),
                Paragraph(d.tipo.capitalize(), styles["Normal"]),
                Paragraph(str(d.cantidad), styles["Normal"]),
                Paragraph(f"${d.precio_unitario:,.2f}", styles["Normal"]),
                Paragraph(f"${d.subtotal:,.2f}", styles["Normal"]),
            ])

        detalle_table = Table(filas, colWidths=[1 * cm, 5 * cm, 2 * cm, 1.2 * cm, 2.2 * cm, 2.5 * cm])
        detalle_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#111827")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, 0), 10),
            ("ALIGN", (0, 0), (-1, 0), "CENTER"),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#D1D5DB")),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#F9FAFB")]),
            ("TOPPADDING", (0, 0), (-1, -1), 6),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ("ALIGN", (0, 1), (0, -1), "CENTER"),
            ("ALIGN", (3, 1), (5, -1), "RIGHT"),
        ]))
        elements.append(detalle_table)

    elements.append(Spacer(1, 0.8 * cm))

    total_data = [
        ["SUBTOTAL", f"${factura.subtotal:,.2f}"],
        ["IVA (19%)", f"${factura.impuestos:,.2f}"],
        ["DESCUENTO", f"$-{factura.descuento:,.2f}"],
        ["TOTAL", f"${factura.total:,.2f}"],
    ]
    total_table = Table(total_data, colWidths=[9 * cm, 5 * cm])
    total_table.setStyle(TableStyle([
        ("FONTNAME", (0, 0), (0, -1), "Helvetica"),
        ("FONTNAME", (1, 1), (1, -1), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 10),
        ("ALIGN", (0, 0), (0, -1), "RIGHT"),
        ("ALIGN", (1, 0), (1, -1), "RIGHT"),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#E5E7EB")),
        ("TOPPADDING", (0, 0), (-1, -1), 7),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
        ("BACKGROUND", (0, -1), (-1, -1), colors.HexColor("#111827")),
        ("TEXTCOLOR", (0, -1), (-1, -1), colors.white),
        ("FONTNAME", (0, -1), (-1, -1), "Helvetica-Bold"),
    ]))
    elements.append(total_table)
    elements.append(Spacer(1, 0.8 * cm))

    pie_style = ParagraphStyle(
        "Pie", parent=styles["Normal"], fontSize=9,
        fontName="Helvetica", textColor=colors.HexColor("#6B7280"), alignment=1,
    )
    elements.append(Paragraph("Gracias por tu compra. NEXUS TECH - contacto@nexustech.com.co", pie_style))

    doc.build(elements, onFirstPage=_encabezado_factura)
    buffer.seek(0)
    return buffer.read()


# ============================================================
# DISEÑO DEL REPORTE: mismo lenguaje visual que la página web
# (fondo oscuro #020b1a, acentos neón cian/violeta, tarjetas)
# ============================================================

COLOR_FONDO = colors.HexColor("#020b1a")
COLOR_PANEL = colors.HexColor("#0b1226")
COLOR_PANEL_ALT = colors.HexColor("#070e1f")
COLOR_NEON_BLUE = colors.HexColor("#2bf2fb")
COLOR_CYAN = colors.HexColor("#22d3ee")
COLOR_VIOLET = colors.HexColor("#b535f6")
COLOR_TEXTO = colors.HexColor("#e2e8f0")
COLOR_TEXTO_SUAVE = colors.HexColor("#94a3b8")
COLOR_BORDE = colors.HexColor("#1e293b")


def _pintar_fondo(canvas, doc):
    """Fondo oscuro + logo de la marca + acentos neón, igual que la tienda."""
    canvas.saveState()
    ancho, alto = A4

    canvas.setFillColor(COLOR_FONDO)
    canvas.rect(0, 0, ancho, alto, stroke=0, fill=1)

    # Encabezado: logo hexagonal de NEXUS TECH (el mismo de la web) + línea neón
    dibujar_logo_nexus(canvas, 15 * mm, alto - 13 * mm, escala=0.8)
    dibujar_linea_neon(canvas, 15 * mm, alto - 17.5 * mm, ancho - 30 * mm, grosor=1.5)

    # Franja inferior de contacto
    canvas.setFillColor(COLOR_PANEL)
    canvas.rect(0, 0, ancho, 24, stroke=0, fill=1)
    canvas.setFillColor(COLOR_VIOLET)
    canvas.rect(0, 22, ancho / 2, 2, stroke=0, fill=1)
    canvas.setFillColor(COLOR_NEON_BLUE)
    canvas.rect(ancho / 2, 22, ancho / 2, 2, stroke=0, fill=1)

    canvas.setFont("Helvetica", 7.5)
    canvas.setFillColor(COLOR_TEXTO_SUAVE)
    canvas.drawCentredString(
        ancho / 2, 8,
        "NEXUS TECH · contacto@nexustech.com.co · WhatsApp +57 304 469 7238 · Documento generado automaticamente",
    )

    canvas.restoreState()


def _encabezado_factura(canvas, doc):
    """Logo de la marca en la parte superior de las facturas (fondo claro)."""
    canvas.saveState()
    ancho, alto = A4
    dibujar_logo_nexus(canvas, 20 * mm, alto - 16 * mm, escala=0.9)
    dibujar_linea_neon(canvas, 20 * mm, alto - 19 * mm, ancho - 40 * mm, grosor=1.5)
    canvas.restoreState()


def generar_reporte_ventas_pdf(titulo: str, items: list, total_general: float) -> bytes:
    """Reporte de ventas en PDF con la identidad visual de NEXUS TECH."""
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=15 * mm,
        leftMargin=15 * mm,
        topMargin=22 * mm,
        bottomMargin=24 * mm,
    )

    styles = getSampleStyleSheet()
    elements = []

    # El logo y el tagline se dibujan directamente en el fondo de la página
    # (ver _pintar_fondo); aquí solo va el título del reporte.

    titulo_style = ParagraphStyle(
        "TituloOscuro", parent=styles["Normal"], fontSize=14, leading=18,
        fontName="Helvetica-Bold", textColor=COLOR_NEON_BLUE, spaceAfter=3,
    )
    elements.append(Paragraph(titulo, titulo_style))

    fecha_gen = ParagraphStyle(
        "FechaGenOscura", parent=styles["Normal"], fontSize=9,
        fontName="Helvetica", textColor=COLOR_TEXTO_SUAVE, spaceAfter=16,
    )
    elements.append(
        Paragraph(f"Generado: {datetime.now().strftime('%d/%m/%Y %H:%M')}", fecha_gen)
    )

    # ---------- Tarjetas de indicadores (tipo Card del dashboard) ----------
    card_label = ParagraphStyle(
        "CardLabel", parent=styles["Normal"], fontSize=8,
        fontName="Helvetica", textColor=COLOR_TEXTO_SUAVE,
    )
    card_valor_cian = ParagraphStyle(
        "CardCian", parent=styles["Normal"], fontSize=17, leading=21,
        fontName="Helvetica-Bold", textColor=COLOR_NEON_BLUE,
    )
    card_valor_violeta = ParagraphStyle(
        "CardVioleta", parent=styles["Normal"], fontSize=17, leading=21,
        fontName="Helvetica-Bold", textColor=COLOR_VIOLET,
    )
    promedio = (total_general / len(items)) if items else 0

    tarjetas = Table(
        [
            [
                [Paragraph("VENTAS DEL PERIODO", card_label)],
                [Paragraph("INGRESOS TOTALES", card_label)],
                [Paragraph("PROMEDIO POR VENTA", card_label)],
            ],
            [
                [Paragraph(str(len(items)), card_valor_cian)],
                [Paragraph(f"${total_general:,.2f}", card_valor_violeta)],
                [Paragraph(f"${promedio:,.2f}", card_valor_cian)],
            ],
        ],
        colWidths=[6 * cm, 6 * cm, 6 * cm],
    )
    tarjetas.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), COLOR_PANEL),
        ("BOX", (0, 0), (0, -1), 0.8, COLOR_CYAN),
        ("BOX", (1, 0), (1, -1), 0.8, COLOR_VIOLET),
        ("BOX", (2, 0), (2, -1), 0.8, COLOR_CYAN),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("TOPPADDING", (0, 0), (-1, 0), 9),
        ("BOTTOMPADDING", (0, 0), (-1, 0), 0),
        ("TOPPADDING", (0, 1), (-1, 1), 0),
        ("BOTTOMPADDING", (0, 1), (-1, 1), 9),
    ]))
    elements.append(tarjetas)
    elements.append(Spacer(1, 0.7 * cm))

    if not items:
        vacio_style = ParagraphStyle(
            "Vacio", parent=styles["Normal"], fontSize=11,
            fontName="Helvetica", textColor=COLOR_TEXTO, alignment=1,
        )
        elements.append(
            Paragraph("No hay ventas registradas para el periodo seleccionado.", vacio_style)
        )
        doc.build(elements, onFirstPage=_pintar_fondo, onLaterPages=_pintar_fondo)
        buffer.seek(0)
        return buffer.read()

    # ---------- Tabla de detalle ----------
    celda = ParagraphStyle(
        "CeldaOscura", parent=styles["Normal"], fontSize=8, leading=10,
        fontName="Helvetica", textColor=COLOR_TEXTO,
    )
    celda_head = ParagraphStyle(
        "CeldaHead", parent=styles["Normal"], fontSize=8, leading=10,
        fontName="Helvetica-Bold", textColor=COLOR_NEON_BLUE,
    )
    celda_total = ParagraphStyle(
        "CeldaTotal", parent=styles["Normal"], fontSize=8, leading=10,
        fontName="Helvetica-Bold", textColor=colors.white,
    )

    header_fila = [
        Paragraph("#", celda_head),
        Paragraph("FECHA", celda_head),
        Paragraph("CLIENTE", celda_head),
        Paragraph("PRODUCTOS / SERVICIOS", celda_head),
        Paragraph("CANT.", celda_head),
        Paragraph("TOTAL", celda_head),
        Paragraph("ESTADO", celda_head),
    ]

    filas = [header_fila]
    for item in items:
        filas.append([
            Paragraph(str(item["id"]), celda),
            Paragraph(item["fecha"], celda),
            Paragraph(str(item["cliente"]), celda),
            Paragraph(str(item["productos"])[:60], celda),
            Paragraph(str(item["cantidad_total"]), celda),
            Paragraph(f"${item['total']:,.2f}", celda),
            Paragraph(str(item["estado"]), celda),
        ])

    detalle_table = Table(
        filas,
        colWidths=[1 * cm, 2.5 * cm, 2.6 * cm, 4.4 * cm, 1 * cm, 2 * cm, 2 * cm],
        repeatRows=1,
    )
    detalle_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), COLOR_PANEL),
        ("LINEBELOW", (0, 0), (-1, 0), 1, COLOR_CYAN),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("GRID", (0, 0), (-1, -1), 0.4, COLOR_BORDE),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [COLOR_PANEL_ALT, COLOR_PANEL]),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("ALIGN", (0, 0), (-1, 0), "CENTER"),
        ("ALIGN", (0, 1), (0, -1), "CENTER"),
        ("ALIGN", (4, 1), (5, -1), "RIGHT"),
    ]))
    elements.append(detalle_table)
    elements.append(Spacer(1, 0.6 * cm))

    total_data = [[
        Paragraph("TOTAL VENTAS", celda_total),
        Paragraph(str(len(items)), celda_total),
        Paragraph("TOTAL INGRESOS", celda_total),
        Paragraph(f"${total_general:,.2f}", celda_total),
    ]]
    total_table = Table(total_data, colWidths=[4 * cm, 3 * cm, 4 * cm, 3 * cm])
    total_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (1, 0), COLOR_VIOLET),
        ("BACKGROUND", (2, 0), (3, 0), COLOR_CYAN),
        ("TEXTCOLOR", (0, 0), (-1, -1), colors.white),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 10),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
    ]))
    elements.append(total_table)

    doc.build(elements, onFirstPage=_pintar_fondo, onLaterPages=_pintar_fondo)
    buffer.seek(0)
    return buffer.read()
