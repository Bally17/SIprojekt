"""Document validation and workflow helpers (no HTTP dependencies)."""
import logging
import os

from django.conf import settings
from django.utils import timezone

from apps.documents.models import Dokument
from apps.internships.models import Prax
from apps.users.models import User
from services.documents.storage import generate_presigned_url, upload_file_to_b2
from services.notifications.dispatch import (
    notify_document_reviewed,
    notify_document_reviewed_by_garant,
    notify_document_soft_rejected_by_company,
    notify_document_soft_rejected_by_garant,
    notify_document_hard_rejected_by_garant,
    notify_document_uploaded,
)

logger = logging.getLogger(__name__)


def _fail(message: str, status_code: int) -> dict:
    return {"ok": False, "status": status_code, "data": {"detail": message}}


def _user_is_student(user: User) -> bool:
    return getattr(user, "rola", "").lower() == User.ROLE_STUDENT


def _user_is_firma(user: User) -> bool:
    return getattr(user, "rola", "").lower() == User.ROLE_FIRMA


def _user_is_garant(user: User) -> bool:
    return getattr(user, "rola", "").lower() == User.ROLE_GARANT


def filter_documents_for_user(user: User, queryset):
    """Return role-filtered queryset for document listing."""
    role = getattr(user, "rola", "") or ""

    if role == User.ROLE_GARANT:
        return queryset
    if role == User.ROLE_STUDENT:
        return queryset.filter(prax__student_id=user.id).order_by("-vytvorene_at")
    if role == User.ROLE_FIRMA:
        firma_id = getattr(user, "firma_id", None)
        return queryset.filter(prax__firma_id=firma_id).order_by("-vytvorene_at") if firma_id else queryset.none()
    return queryset.none()


def upload_document_file(document: Dokument, user: User, file_obj) -> dict:
    """Upload a PDF file for allowed roles and update document state."""
    prax = document.prax
    prax_forma = getattr(prax, "forma", Prax.FORMA_DOHODA)
    is_employment = prax_forma == Prax.FORMA_ZAMESTNANIE
    is_student = _user_is_student(user) and prax and prax.student_id == user.id
    is_company = (
        _user_is_firma(user)
        and prax
        and getattr(user, "firma_id", None) == getattr(prax, "firma_id", None)
        and document.typ_dokumentu == Dokument.TYP_VYKAZ
    )

    if not is_student and not is_company:
        return _fail("Iba študent alebo firma môže nahrávať tento dokument.", 403)

    if is_student and document.typ_dokumentu == Dokument.TYP_ZMLUVA and not is_employment:
        if getattr(prax, "stav", "").lower() != Prax.STAV_SCHVALENA:
            return _fail("Zmluvu môžeš nahrať až po schválení praxe.", 403)
    if getattr(prax, "stav", "").lower() != Prax.STAV_SCHVALENA and document.typ_dokumentu == Dokument.TYP_VYKAZ:
        return _fail("Výkaz možno nahrať až po schválení praxe.", 403)

    if file_obj is None:
        return _fail("Chýba súbor 'file' v requeste.", 400)

    max_size = getattr(settings, "DOCUMENT_MAX_UPLOAD_SIZE", 10 * 1024 * 1024)
    if file_obj.size and file_obj.size > max_size:
        return _fail("Súbor je príliš veľký.", 413)

    content_type = (getattr(file_obj, "content_type", "") or "").lower()
    filename = (getattr(file_obj, "name", "") or "").lower()
    if not (filename.endswith(".pdf") or content_type in ("application/pdf", "application/x-pdf")):
        return _fail("Povolené sú iba PDF súbory.", 400)

    object_name = upload_file_to_b2(file_obj)

    document.subor_url = object_name
    document.nahrane_pouzivatel_id = user.id
    document.stav_dokumentu = Dokument.STAV_NAHRANY
    document.skontroloval = None
    document.skontrolovane_at = None
    document.save(
        update_fields=[
            "subor_url",
            "nahrane_pouzivatel_id",
            "stav_dokumentu",
            "skontroloval",
            "skontrolovane_at",
            "zmenene_at",
        ]
    )

    notify_document_uploaded(document)

    return {"ok": True, "status": 200, "document": document}


def download_document(document: Dokument, user: User) -> dict:
    """Return download payload or file metadata for authorized users."""
    prax = document.prax

    allowed = (
        (_user_is_student(user) and prax and prax.student_id == user.id)
        or (_user_is_firma(user) and getattr(user, "firma_id", None) == getattr(prax, "firma_id", None))
        or (_user_is_garant(user) and getattr(prax, "garant_id", None) == user.id)
    )
    if not allowed:
        return _fail("Nemáš oprávnenie stiahnuť tento dokument.", 403)

    if not document.subor_url:
        return _fail("Dokument zatiaľ nemá nahratý súbor.", 400)

    object_name = document.subor_url
    if isinstance(object_name, str) and object_name.startswith(("http://", "https://")):
        return {"ok": True, "status": 200, "data": {"url": object_name}}

    base_dir = os.path.abspath(settings.MEDIA_ROOT)
    local_path = os.path.abspath(os.path.normpath(os.path.join(base_dir, object_name)))
    if not local_path.startswith(base_dir + os.sep):
        return _fail("Neplatná cesta k súboru.", 400)

    if os.path.exists(local_path):
        filename = os.path.basename(local_path)
        content_type = "application/pdf" if filename.lower().endswith(".pdf") else None
        return {
            "ok": True,
            "status": 200,
            "data": {
                "file_path": local_path,
                "filename": filename,
                "content_type": content_type,
            },
        }

    try:
        url = generate_presigned_url(object_name)
        return {"ok": True, "status": 200, "data": {"url": url}}
    except Exception as exc:  # pragma: no cover - infra závislé
        logger.exception("❌ Download link generation failed for document %s: %s", document.id, exc)
        return _fail("Download link sa nepodarilo vygenerovať. Skús to neskôr.", 500)


def approve_company(document: Dokument, user: User) -> dict:
    """Approve a document as a company and mark it confirmed."""
    if not _user_is_firma(user):
        return _fail("Iba firma môže schváliť dokument.", 403)

    prax = document.prax
    if getattr(user, "firma_id", None) is not None and user.firma_id != getattr(prax, "firma_id", None):
        return _fail("Toto nie je vaša prax.", 403)

    if document.stav_dokumentu != Dokument.STAV_NAHRANY:
        return _fail("Firma môže schváliť len dokument v stave 'nahrany'.", 400)

    document.stav_dokumentu = Dokument.STAV_POTVRDENY
    document.skontroloval_id = user.id
    document.skontrolovane_at = timezone.now()
    document.save(update_fields=["stav_dokumentu", "skontroloval_id", "skontrolovane_at", "zmenene_at"])

    notify_document_reviewed(document, approved=True)

    return {"ok": True, "status": 200, "data": {"detail": "Schválené firmou."}}


def reject_company(document: Dokument, user: User, reason: str) -> dict:
    """Hard-reject a document as a company and mark it rejected."""
    if not _user_is_firma(user):
        return _fail("Iba firma môže zamietnuť dokument.", 403)

    prax = document.prax
    if getattr(user, "firma_id", None) is not None and user.firma_id != getattr(prax, "firma_id", None):
        return _fail("Toto nie je vaša prax.", 403)

    if document.stav_dokumentu not in [Dokument.STAV_NAHRANY, Dokument.STAV_POTVRDENY]:
        return _fail("Neplatný stav na zamietnutie.", 400)

    reason = (reason or "").strip()
    if not reason:
        return _fail("Pole 'reason' je povinné.", 400)

    document.stav_dokumentu = Dokument.STAV_ZAMIETNUTY
    document.skontroloval_id = user.id
    document.skontrolovane_at = timezone.now()
    document.save(update_fields=["stav_dokumentu", "skontroloval_id", "skontrolovane_at", "zmenene_at"])

    notify_document_reviewed(document, approved=False, reason=reason)

    return {"ok": True, "status": 200, "data": {"detail": "Zamietnuté firmou (hard)."}}


def reject_company_soft(document: Dokument, user: User, reason: str) -> dict:
    """Soft-reject a document as a company without changing state."""
    if not _user_is_firma(user):
        return _fail("Iba firma môže zamietnuť dokument.", 403)

    prax = document.prax
    if getattr(user, "firma_id", None) is not None and user.firma_id != getattr(prax, "firma_id", None):
        return _fail("Toto nie je vaša prax.", 403)

    if document.stav_dokumentu != Dokument.STAV_NAHRANY:
        return _fail("Soft reject je dostupný len pre stav 'nahrany'.", 400)

    reason = (reason or "").strip()
    if not reason:
        return _fail("Pole 'reason' je povinné.", 400)

    notify_document_soft_rejected_by_company(document, reason=reason)

    return {"ok": True, "status": 200, "data": {"detail": "Soft zamietnutie firmou (stav sa nemení)."}}


def approve_garant(document: Dokument, user: User) -> dict:
    """Approve a document as garant without changing its state."""
    if not _user_is_garant(user):
        return _fail("Iba garant môže schváliť dokument.", 403)

    if document.stav_dokumentu != Dokument.STAV_POTVRDENY:
        return _fail(
            "Garant môže schváliť až po schválení firmou (stav 'potvrdeny').",
            400,
        )

    document.skontroloval_id = user.id
    document.skontrolovane_at = timezone.now()
    document.save(update_fields=["skontroloval_id", "skontrolovane_at", "zmenene_at"])

    notify_document_reviewed_by_garant(document)

    return {"ok": True, "status": 200, "data": {"detail": "Schválené garantom."}}


def reject_garant_soft(document: Dokument, user: User, reason: str) -> dict:
    """Soft-reject a document as garant without changing state."""
    if not _user_is_garant(user):
        return _fail("Iba garant môže zamietnuť dokument.", 403)

    if document.stav_dokumentu != Dokument.STAV_POTVRDENY:
        return _fail(
            "Soft reject je dostupný až po schválení firmou (stav 'potvrdeny').",
            400,
        )

    reason = (reason or "").strip()
    if not reason:
        return _fail("Pole 'reason' je povinné.", 400)

    notify_document_soft_rejected_by_garant(document, reason=reason)

    return {"ok": True, "status": 200, "data": {"detail": "Soft zamietnutie garantom (stav sa nemení)."}}


def reject_garant_hard(document: Dokument, user: User, reason: str) -> dict:
    """Hard-reject a document as garant and mark it rejected."""
    if not _user_is_garant(user):
        return _fail("Iba garant môže zamietnuť dokument.", 403)

    if document.stav_dokumentu != Dokument.STAV_POTVRDENY:
        return _fail(
            "Garant môže zamietnuť až po schválení firmou (stav 'potvrdeny').",
            400,
        )

    reason = (reason or "").strip()
    if not reason:
        return _fail("Pole 'reason' je povinné.", 400)

    document.stav_dokumentu = Dokument.STAV_ZAMIETNUTY
    document.skontroloval_id = user.id
    document.skontrolovane_at = timezone.now()
    document.save(update_fields=["stav_dokumentu", "skontroloval_id", "skontrolovane_at", "zmenene_at"])

    notify_document_hard_rejected_by_garant(document, reason=reason)

    return {"ok": True, "status": 200, "data": {"detail": "Zamietnuté garantom (hard)."}}
