"""Document generation helpers (no HTTP dependencies)."""
import io
import os
from datetime import datetime, date

from django.conf import settings

from apps.documents.models import Dokument
from apps.internships.models import Prax
from apps.users.models import User

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
    """Generate the internship agreement PDF and return (buffer, relative_path)."""
    if PdfReader is None or PdfWriter is None or canvas is None or A4 is None or mm is None:
        raise RuntimeError(
            "PyPDF2 a ReportLab sú potrebné na generovanie PDF. Spusti 'pip install PyPDF2 reportlab'."
        )

    firma = prax.firma
    student = prax.student

    def safe_str(value):
        """Return a safe string representation for optional values."""
        return str(value) if value is not None else ""

    def to_date_safe(value):
        """Parse supported date formats into a date object."""
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

    template_path = os.path.join(
        settings.BASE_DIR,
        "resources/documents/templates/Dohoda_o_odbornej_praxi.pdf",
    )
    existing_pdf = PdfReader(open(template_path, "rb"))
    output = PdfWriter()

    overlay_data = {}

    def get_canvas(page_index: int):
        entry = overlay_data.get(page_index)
        if entry is None:
            packet = io.BytesIO()
            can = canvas.Canvas(packet, pagesize=A4)
            can.setFont("Helvetica", 10.5)
            overlay_data[page_index] = {"packet": packet, "canvas": can}
            return can
        entry["canvas"].setFont("Helvetica", 10.5)
        return entry["canvas"]

    first_page = get_canvas(0)
    first_page.drawString(70 * mm, 222 * mm, safe_str(firma.nazov))
    first_page.drawString(105 * mm, 222 * mm, safe_str(firma.adresa))
    company_contact = safe_str(getattr(firma, "kontakt_meno", "") or "")
    if company_contact:
        first_page.drawString(78 * mm, 217 * mm, company_contact)
        first_page.drawString(57 * mm, 31 * mm, company_contact)

    first_page.drawString(120 * mm, 201 * mm, safe_str(f"{student.meno} {student.priezvisko}"))
    first_page.drawString(120 * mm, 197 * mm, safe_str(student.adresa))
    first_page.drawString(120 * mm, 192 * mm, safe_str(student.email))

    first_page.drawString(35 * mm, 152 * mm, safe_str(zaciatok_str))
    first_page.drawString(80 * mm, 152 * mm, safe_str(koniec_str))

    second_page = get_canvas(1)
    second_page.drawString(44 * mm, 89 * mm, safe_str(f"{datum_dnes}"))

    if company_contact:
        second_page = get_canvas(1)
        second_page.drawString(135 * mm, 70 * mm, company_contact)

    second_page = get_canvas(1)
    second_page.drawString(140 * mm, 42 * mm, safe_str(f"{student.meno} {student.priezvisko}"))

    overlays = {}
    for index, data in overlay_data.items():
        data["canvas"].save()
        data["packet"].seek(0)
        overlay_pdf = PdfReader(data["packet"])
        overlays[index] = overlay_pdf.pages[0]

    for i, page in enumerate(existing_pdf.pages):
        if i in overlays:
            page.merge_page(overlays[i])
        output.add_page(page)

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


def generate_dohoda_for_document(document: Dokument, user: User) -> dict:
    """Generate agreement PDF for a document and update it."""
    if not document.prax_id:
        return {"ok": False, "status": 400, "data": {"detail": "Dokument nemá priradenú prax."}}

    try:
        prax = Prax.objects.select_related("firma", "student", "garant").get(id=document.prax_id)
    except Prax.DoesNotExist:
        return {"ok": False, "status": 404, "data": {"detail": "Súvisiaca prax neexistuje."}}

    if getattr(user, "rola", None) != User.ROLE_STUDENT:
        return {"ok": False, "status": 403, "data": {"detail": "Iba študent môže generovať PDF dokument."}}
    if prax.student_id != user.id:
        return {
            "ok": False,
            "status": 403,
            "data": {"detail": "Nemáš oprávnenie generovať dokument pre túto prax."},
        }

    if prax.stav.lower() not in [Prax.STAV_VYTVORENA, Prax.STAV_POTVRDENA]:
        return {
            "ok": False,
            "status": 400,
            "data": {
                "detail": "PDF možno generovať len pre prax v stave 'vytvorena' alebo 'potvrdena'. "
                f"Aktuálny stav: {prax.stav}"
            },
        }

    try:
        pdf_buffer, relative_path = generate_dohoda_pdf(prax)
    except FileNotFoundError as exc:
        return {
            "ok": False,
            "status": 500,
            "data": {"detail": f"Šablóna PDF sa nenašla: {str(exc)}"},
        }
    except Exception as exc:
        return {"ok": False, "status": 500, "data": {"detail": f"❌ Chyba pri generovaní PDF: {str(exc)}"}}

    document.subor_url = relative_path
    document.stav_dokumentu = Dokument.STAV_POTVRDENY
    document.save(update_fields=["subor_url", "stav_dokumentu"])
    pdf_buffer.seek(0)

    return {
        "ok": True,
        "status": 200,
        "data": {
            "buffer": pdf_buffer,
            "filename": f"Dohoda_praxe_{prax.id}.pdf",
        },
    }
