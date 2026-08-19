from io import BytesIO
from datetime import datetime

from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.platypus import (
    HRFlowable,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)


def generate_sale_deed_pdf(sale_data: dict) -> BytesIO:
    """Generate a styled PDF Sale Deed / Invoice agreement using ReportLab.
    
    sale_data dictionary structure:
    {
        "sale_id": str,
        "sale_date": str,
        "car_number": str,
        "make": str,
        "model": str,
        "year": int,
        "color": str,
        "engine_number": str,
        "chassis_number": str,
        "seller_name": str,
        "seller_cnic": str,
        "seller_phone": str,
        "buyer_name": str,
        "buyer_cnic": str,
        "buyer_phone": str,
        "buyer_address": str,
        "purchase_price": float,
        "total_repair_cost": float,
        "total_cost_basis": float,
        "final_sale_price": float,
        "net_profit": float,
        "payment_type": str,
        "employee_name": str,
    }
    """
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36,
    )

    story = []
    styles = getSampleStyleSheet()

    # Custom Color Palette
    PRIMARY_COLOR = colors.HexColor("#1A365D")  # Deep Navy
    SECONDARY_COLOR = colors.HexColor("#2B6CB0") # Slate Blue
    ACCENT_COLOR = colors.HexColor("#C53030")    # Crimson Accent
    TEXT_DARK = colors.HexColor("#2D3748")       # Dark Charcoal
    BG_LIGHT = colors.HexColor("#F7FAFC")        # Off-white

    # Custom Typography Styles
    title_style = ParagraphStyle(
        "DocTitle",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=20,
        leading=24,
        textColor=PRIMARY_COLOR,
        alignment=1,  # Center
    )
    subtitle_style = ParagraphStyle(
        "DocSubtitle",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=10,
        leading=14,
        textColor=SECONDARY_COLOR,
        alignment=1,
    )
    section_heading = ParagraphStyle(
        "SectionHeading",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=12,
        leading=16,
        textColor=PRIMARY_COLOR,
        spaceAfter=6,
    )
    cell_bold = ParagraphStyle(
        "CellBold",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=9,
        leading=12,
        textColor=TEXT_DARK,
    )
    cell_regular = ParagraphStyle(
        "CellRegular",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=9,
        leading=12,
        textColor=TEXT_DARK,
    )

    # 1. Header
    story.append(Paragraph("SK MOTORS - OFFICIAL SALE DEED", title_style))
    story.append(Spacer(1, 4))
    story.append(
        Paragraph(
            f"Reference #: {sale_data.get('sale_id', 'N/A')} | Date: {sale_data.get('sale_date', datetime.utcnow().strftime('%Y-%m-%d'))}",
            subtitle_style,
        )
    )
    story.append(Spacer(1, 10))
    story.append(HRFlowable(width="100%", thickness=2, color=PRIMARY_COLOR, spaceAfter=15))

    # 2. Parties Information (Buyer & Seller)
    story.append(Paragraph("1. PARTIES TO THE AGREEMENT", section_heading))
    
    parties_data = [
        [
            Paragraph("<b>SELLER (PREVIOUS OWNER) DETAILS</b>", cell_bold),
            Paragraph("<b>BUYER (NEW OWNER) DETAILS</b>", cell_bold),
        ],
        [
            Paragraph(
                f"<b>Name:</b> {sale_data.get('seller_name', 'N/A')}<br/>"
                f"<b>CNIC:</b> {sale_data.get('seller_cnic', 'N/A')}<br/>"
                f"<b>Phone:</b> {sale_data.get('seller_phone', 'N/A')}",
                cell_regular,
            ),
            Paragraph(
                f"<b>Name:</b> {sale_data.get('buyer_name', 'N/A')}<br/>"
                f"<b>CNIC:</b> {sale_data.get('buyer_cnic', 'N/A')}<br/>"
                f"<b>Phone:</b> {sale_data.get('buyer_phone', 'N/A')}<br/>"
                f"<b>Address:</b> {sale_data.get('buyer_address', 'N/A')}",
                cell_regular,
            ),
        ],
    ]
    parties_table = Table(parties_data, colWidths=[260, 260])
    parties_table.setStyle(
        TableStyle([
            ("BACKGROUND", (0, 0), (1, 0), BG_LIGHT),
            ("TEXTCOLOR", (0, 0), (1, 0), PRIMARY_COLOR),
            ("ALIGN", (0, 0), (-1, -1), "LEFT"),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.lightgrey),
            ("BOX", (0, 0), (-1, -1), 1, PRIMARY_COLOR),
            ("TOPPADDING", (0, 0), (-1, -1), 6),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ])
    )
    story.append(parties_table)
    story.append(Spacer(1, 15))

    # 3. Vehicle Specifications
    story.append(Paragraph("2. VEHICLE SPECIFICATIONS", section_heading))
    vehicle_data = [
        [
            Paragraph("<b>Registration No:</b>", cell_bold),
            Paragraph(str(sale_data.get("car_number", "N/A")), cell_regular),
            Paragraph("<b>Make / Model:</b>", cell_bold),
            Paragraph(f"{sale_data.get('make', '')} {sale_data.get('model', '')}", cell_regular),
        ],
        [
            Paragraph("<b>Year:</b>", cell_bold),
            Paragraph(str(sale_data.get("year", "N/A")), cell_regular),
            Paragraph("<b>Color:</b>", cell_bold),
            Paragraph(str(sale_data.get("color", "N/A")), cell_regular),
        ],
        [
            Paragraph("<b>Engine Number:</b>", cell_bold),
            Paragraph(str(sale_data.get("engine_number", "N/A")), cell_regular),
            Paragraph("<b>Chassis Number:</b>", cell_bold),
            Paragraph(str(sale_data.get("chassis_number", "N/A")), cell_regular),
        ],
    ]
    vehicle_table = Table(vehicle_data, colWidths=[130, 130, 130, 130])
    vehicle_table.setStyle(
        TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), BG_LIGHT),
            ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.lightgrey),
            ("BOX", (0, 0), (-1, -1), 1, SECONDARY_COLOR),
            ("TOPPADDING", (0, 0), (-1, -1), 6),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ])
    )
    story.append(vehicle_table)
    story.append(Spacer(1, 15))

    # 4. Financial & Payment Summary
    story.append(Paragraph("3. FINANCIAL SUMMARY & PAYMENT TERMS", section_heading))
    
    fin_data = [
        [Paragraph("<b>Item Description</b>", cell_bold), Paragraph("<b>Amount (PKR)</b>", cell_bold)],
        [Paragraph("Final Vehicle Sale Price", cell_regular), Paragraph(f"PKR {sale_data.get('final_sale_price', 0.0):,.2f}", cell_bold)],
        [Paragraph("Payment Method", cell_regular), Paragraph(str(sale_data.get("payment_type", "FULL_PAYMENT")), cell_regular)],
        [Paragraph("Sold By Agent", cell_regular), Paragraph(str(sale_data.get("employee_name", "Authorized Officer")), cell_regular)],
    ]
    fin_table = Table(fin_data, colWidths=[360, 160])
    fin_table.setStyle(
        TableStyle([
            ("BACKGROUND", (0, 0), (1, 0), SECONDARY_COLOR),
            ("TEXTCOLOR", (0, 0), (1, 0), colors.white),
            ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.lightgrey),
            ("BOX", (0, 0), (-1, -1), 1, SECONDARY_COLOR),
            ("ALIGN", (1, 0), (1, -1), "RIGHT"),
            ("TOPPADDING", (0, 0), (-1, -1), 6),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ])
    )
    story.append(fin_table)
    story.append(Spacer(1, 20))

    # 5. Terms & Signature Blocks
    story.append(Paragraph("4. DECLARATION & SIGNATURES", section_heading))
    terms_text = (
        "I, the buyer, confirm that I have inspected the vehicle and accept it in its current condition. "
        "SK MOTORS guarantees that the vehicle registration papers and vehicle history provided are authentic."
    )
    story.append(Paragraph(terms_text, cell_regular))
    story.append(Spacer(1, 40))

    sig_data = [
        [
            Paragraph("________________________<br/><b>Buyer Signature</b>", cell_bold),
            Paragraph("________________________<br/><b>Seller Signature</b>", cell_bold),
            Paragraph("________________________<br/><b>Authorized Officer</b>", cell_bold),
        ]
    ]
    sig_table = Table(sig_data, colWidths=[170, 170, 180])
    sig_table.setStyle(
        TableStyle([
            ("ALIGN", (0, 0), (-1, -1), "CENTER"),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ])
    )
    story.append(sig_table)

    doc.build(story)
    buffer.seek(0)
    return buffer
