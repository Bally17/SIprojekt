import io
import os
from datetime import datetime, date
from django.conf import settings

try:
    from reportlab.pdfgen import canvas
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.units import mm
except ImportError:  # pragma: no cover - optional dependency in dev env
    canvas = None
    A4 = None
    mm = None

try:
    from PyPDF2 import PdfReader, PdfWriter
except ImportError:  # pragma: no cover - optional dependency in dev env
    PdfReader = None
    PdfWriter = None


def generate_dohoda_pdf(prax):
    """
    Vygeneruje PDF dohodu o odbornej praxi pre danú prax.
    Automaticky konvertuje dátumy z reťazcov a ošetrí None hodnoty v textoch.
    """

    if PdfReader is None or PdfWriter is None or canvas is None or A4 is None or mm is None:
        raise RuntimeError(
            "PyPDF2 a ReportLab sú potrebné na generovanie PDF. Spusti 'pip install PyPDF2 reportlab'."
        )

    firma = prax.firma
    student = prax.student
    garant = getattr(prax, "garant", None)

    # 🔹 Pomocná funkcia – bezpečne vráti reťazec
    def safe_str(value):
        return str(value) if value is not None else ""

    # 🔹 Bezpečné spracovanie dátumov
    def to_date_safe(value):
        if isinstance(value, (datetime, date)):
            return value
        if isinstance(value, str):
            try:
                return datetime.fromisoformat(value).date()
            except ValueError:
                try:
                    return datetime.strptime(value, "%d.%m.%Y").date()
                except ValueError:
                    raise ValueError(f"❌ Neplatný formát dátumu: {value}")
        raise TypeError(f"❌ Neočakávaný typ dátumu: {type(value)}")

    datum_zaciatku = to_date_safe(prax.datum_zaciatku)
    datum_konca = to_date_safe(prax.datum_konca)
    datum_dnes = datetime.now().strftime("%d.%m.%Y")

    zaciatok_str = datum_zaciatku.strftime("%d.%m.%Y")
    koniec_str = datum_konca.strftime("%d.%m.%Y")

    template_path = os.path.join(settings.BASE_DIR, "apps/documents/templates/Dohoda_o_odbornej_praxi.pdf")
    existing_pdf = PdfReader(open(template_path, "rb"))
    output = PdfWriter()

    packet = io.BytesIO()
    can = canvas.Canvas(packet, pagesize=A4)
    can.setFont("Helvetica", 10.5)

    # 🔹 Firma
    can.drawString(130 * mm, 197 * mm, safe_str(firma.nazov))
    can.drawString(130 * mm, 191 * mm, safe_str(firma.adresa))

    # 🔹 Študent
    can.drawString(125 * mm, 177 * mm, safe_str(f"{student.meno} {student.priezvisko}"))
    can.drawString(125 * mm, 172 * mm, safe_str(student.adresa))
    can.drawString(125 * mm, 167 * mm, safe_str(student.email))

    # 🔹 Garant
    if garant:
        can.drawString(125 * mm, 158 * mm, safe_str(f"Garant: {garant.meno} {garant.priezvisko}"))

    # 🔹 Termíny praxe
    can.drawString(120 * mm, 142 * mm, safe_str(zaciatok_str))
    can.drawString(160 * mm, 142 * mm, safe_str(koniec_str))

    # 🔹 Dátum a podpis
    can.drawString(72 * mm, 112 * mm, safe_str(f"V Nitre, dňa {datum_dnes}"))
    can.drawString(145 * mm, 70 * mm, safe_str(f"{student.meno} {student.priezvisko}"))

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

    relative_path = os.path.relpath(output_path, settings.MEDIA_ROOT)
    return buffer, relative_path.replace("\\", "/")
