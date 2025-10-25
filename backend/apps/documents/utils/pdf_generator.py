import io
import os
from datetime import datetime
from PyPDF2 import PdfReader, PdfWriter
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from django.conf import settings


def generate_dohoda_pdf(prax):
    import io, os
    from datetime import datetime
    from PyPDF2 import PdfReader, PdfWriter
    from reportlab.pdfgen import canvas
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.units import mm
    from django.conf import settings

    firma = prax.firma
    student = prax.student
    garant = prax.garant
    datum_zaciatku = prax.datum_zaciatku.strftime('%d.%m.%Y')
    datum_konca = prax.datum_konca.strftime('%d.%m.%Y')
    datum_dnes = datetime.now().strftime('%d.%m.%Y')

    template_path = os.path.join(settings.BASE_DIR, "apps/documents/templates/Dohoda_o_odbornej_praxi.pdf")
    existing_pdf = PdfReader(open(template_path, "rb"))
    output = PdfWriter()

    packet = io.BytesIO()
    can = canvas.Canvas(packet, pagesize=A4)
    can.setFont("Helvetica", 10.5)

    # 🔹 Firma (presne do poľa)
    can.drawString(130 * mm, 197 * mm, firma.nazov)
    can.drawString(130 * mm, 191 * mm, firma.adresa)

    # 🔹 Študent
    can.drawString(125 * mm, 177 * mm, f"{student.meno} {student.priezvisko}")
    can.drawString(125 * mm, 172 * mm, student.adresa)
    can.drawString(125 * mm, 167 * mm, student.email)

    # 🔹 Garant
    if garant:
        can.drawString(125 * mm, 158 * mm, f"Garant: {garant.meno} {garant.priezvisko}")

    # 🔹 Termíny
    can.drawString(120 * mm, 142 * mm, datum_zaciatku)
    can.drawString(160 * mm, 142 * mm, datum_konca)

    # 🔹 V Nitre, dňa…
    can.drawString(72 * mm, 112 * mm, f"V Nitre, dňa {datum_dnes}")

    # 🔹 Meno študenta do podpisovej časti
    can.drawString(145 * mm, 70 * mm, f"{student.meno} {student.priezvisko}")

    can.save()
    packet.seek(0)
    overlay_pdf = PdfReader(packet)

    first_page = existing_pdf.pages[0]
    first_page.merge_page(overlay_pdf.pages[0])
    output.add_page(first_page)

    for i in range(1, len(existing_pdf.pages)):
        output.add_page(existing_pdf.pages[i])

    output_dir = os.path.join(settings.MEDIA_ROOT, "dohody")
    os.makedirs(output_dir, exist_ok=True)
    output_path = os.path.join(output_dir, f"dohoda_prax_{prax.id}.pdf")

    with open(output_path, "wb") as f:
        output.write(f)

    buffer = io.BytesIO()
    output.write(buffer)
    buffer.seek(0)

    return buffer, output_path
