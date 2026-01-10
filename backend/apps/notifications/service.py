"""Notification service helpers for building and sending messages."""
import logging
from typing import Optional

from django.utils import timezone

from apps.notifications.models import Notifikacie
from apps.users.models import User
from apps.internships.models import Prax
from apps.documents.models import Dokument

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------

def _name_of_user(u: Optional[User]) -> str:
    """Return display name for the user if available."""
    if not u:
        return ""
    meno = getattr(u, "meno", "") or ""
    priezvisko = getattr(u, "priezvisko", "") or ""
    return f"{meno} {priezvisko}".strip()

def _greeting_for_person(name: str) -> str:
    """Return a polite greeting line for the given name."""
    return f"Dobrý deň{(' ' + name) if name else ''},"

def _ensure_email(email: Optional[str], context: str) -> bool:
    """Return True if an email is present, otherwise log and skip."""
    if not email:
        logger.warning("Email notifikácia preskočená – chýba email (%s).", context)
        return False
    return True

def _create_notification(
    prax: Optional[Prax],
    prijemca_user: Optional[User],
    prijemca_email: Optional[str],
    subject: str,
    body_text: str,
) -> Optional[Notifikacie]:
    """Create a notification record; delivery is handled by signals."""
    if not _ensure_email(prijemca_email, subject):
        return None

    notif = Notifikacie.objects.create(
        prax=prax,
        prijemca=prijemca_user,
        prijemca_email=prijemca_email,
        predmet=subject,
        sablona_kluc="__direct_text__",      # kľúč nepoužívaš, text je už hotový
        payload_json={"body": body_text},
        stav="nove",
        odoslane_at=None,
    )
    logger.info("Notifikácia %s → %s | %s", notif.id, prijemca_email, subject)
    return notif

# ---------------------------------------------------------------------
# DOCUMENT NOTIFICATIONS
# ---------------------------------------------------------------------

def notify_document_uploaded(document: Dokument):
    """Notify company and garant that a document was uploaded."""
    prax = document.prax
    student = prax.student
    firma = prax.firma
    garant = prax.garant

    firma_email = getattr(firma, "kontakt_email", None)
    firma_name = getattr(firma, "kontakt_meno", "") or getattr(firma, "nazov", "")
    student_name = _name_of_user(student)

    # Firma
    _create_notification(
        prax=prax,
        prijemca_user=None,
        prijemca_email=firma_email,
        subject="Nový dokument na schválenie",
        body_text=(
            f"{_greeting_for_person(firma_name)}\n\n"
            f"Študent {student_name} nahrál nový dokument typu **{document.typ_dokumentu}**.\n"
            f"Prosíme o jeho skontrolovanie.\n\n"
            f"S pozdravom\nSystém odborných praxí"
        ),
    )

    # Garant
    if garant and getattr(garant, "email", None):
        _create_notification(
            prax=prax,
            prijemca_user=garant,
            prijemca_email=garant.email,
            subject="Študent nahrál nový dokument",
            body_text=(
                f"{_greeting_for_person(_name_of_user(garant))}\n\n"
                f"Študent {student_name} nahrál nový dokument typu **{document.typ_dokumentu}**.\n"
                f"Môžete ho skontrolovať po schválení firmou.\n\n"
                f"S pozdravom\nSystém odborných praxí"
            ),
        )


def notify_document_reviewed(document: Dokument, *, approved: bool, reason: Optional[str] = None):
    """Notify users about company review outcome for a document."""
    prax = document.prax
    student = prax.student
    garant = prax.garant

    student_name = _name_of_user(student)

    if approved:
        # → Firma schválila
        subject = "Dokument bol schválený firmou"
        body_std = (
            f"{_greeting_for_person(student_name)}\n\n"
            f"Firma schválila Váš dokument typu **{document.typ_dokumentu}**.\n\n"
            f"S pozdravom\nSystém odborných praxí"
        )
        _create_notification(prax, student, student.email, subject, body_std)

        if garant and getattr(garant, "email", None):
            body_g = (
                f"{_greeting_for_person(_name_of_user(garant))}\n\n"
                f"Firma schválila dokument študenta **{student_name}** typu **{document.typ_dokumentu}**.\n\n"
                f"S pozdravom\nSystém odborných praxí"
            )
            _create_notification(prax, garant, garant.email, subject, body_g)

    else:
        # → Firma HARD reject (len študent)
        subject = "Dokument bol zamietnutý firmou"
        body = (
            f"{_greeting_for_person(student_name)}\n\n"
            f"Firma zamietla Váš dokument typu **{document.typ_dokumentu}**.\n"
            f"Dôvod zamietnutia: {reason}\n\n"
            f"Prosíme o opätovné nahratie opraveného dokumentu.\n\n"
            f"S pozdravom\nSystém odborných praxí"
        )
        _create_notification(prax, student, student.email, subject, body)


def notify_document_soft_rejected_by_company(document: Dokument, *, reason: str):
    """Notify a student about a soft rejection by the company."""
    prax = document.prax
    student = prax.student
    student_name = _name_of_user(student)

    subject = "Pripomienky k dokumentu (firma)"
    body = (
        f"{_greeting_for_person(student_name)}\n\n"
        f"Firma má pripomienky k Vášmu dokumentu typu **{document.typ_dokumentu}**.\n"
        f"Dôvod: {reason}\n\n"
        f"Prosíme o úpravu a opätovné nahratie dokumentu.\n\n"
        f"S pozdravom\nSystém odborných praxí"
    )
    _create_notification(prax, student, student.email, subject, body)


def notify_document_reviewed_by_garant(document: Dokument):
    """Notify student and company about garant approval."""
    prax = document.prax
    student = prax.student
    garant = prax.garant
    firma = prax.firma

    student_name = _name_of_user(student)
    garant_name = _name_of_user(garant) if garant else ""
    firma_email = getattr(firma, "kontakt_email", None)
    firma_name = getattr(firma, "kontakt_meno", "") or getattr(firma, "nazov", "")

    subject = "Dokument bol schválený garantom"

    # študent
    body_std = (
        f"{_greeting_for_person(student_name)}\n\n"
        f"Váš dokument typu **{document.typ_dokumentu}** bol schválený garantom.\n\n"
        f"S pozdravom\nSystém odborných praxí"
    )
    _create_notification(prax, student, student.email, subject, body_std)

    # firma
    body_f = (
        f"{_greeting_for_person(firma_name)}\n\n"
        f"Dokument študenta **{student_name}** typu **{document.typ_dokumentu}** bol schválený garantom.\n\n"
        f"S pozdravom\nSystém odborných praxí"
    )
    _create_notification(prax, None, firma_email, subject, body_f)


def notify_document_soft_rejected_by_garant(document: Dokument, *, reason: str):
    """Notify a student about a soft rejection by the garant."""
    prax = document.prax
    student = prax.student
    student_name = _name_of_user(student)

    subject = "Pripomienky k dokumentu (garant)"
    body = (
        f"{_greeting_for_person(student_name)}\n\n"
        f"Garant má pripomienky k Vášmu dokumentu typu **{document.typ_dokumentu}**.\n"
        f"Dôvod: {reason}\n\n"
        f"Prosíme o úpravu a opätovné nahratie dokumentu.\n\n"
        f"S pozdravom\nSystém odborných praxí"
    )
    _create_notification(prax, student, student.email, subject, body)


def notify_document_hard_rejected_by_garant(document: Dokument, *, reason: str):
    """Notify student and company about a hard rejection by the garant."""
    prax = document.prax
    student = prax.student
    garant = prax.garant
    firma = prax.firma

    student_name = _name_of_user(student)
    firma_email = getattr(firma, "kontakt_email", None)
    firma_name = getattr(firma, "kontakt_meno", "") or getattr(firma, "nazov", "")

    subject = "Dokument bol zamietnutý garantom"

    # študent
    body_std = (
        f"{_greeting_for_person(student_name)}\n\n"
        f"Garant zamietol Váš dokument typu **{document.typ_dokumentu}**.\n"
        f"Dôvod: {reason}\n\n"
        f"Je potrebné vypracovať nový dokument a znovu nahrať.\n\n"
        f"S pozdravom\nSystém odborných praxí"
    )
    _create_notification(prax, student, student.email, subject, body_std)

    # firma
    body_f = (
        f"{_greeting_for_person(firma_name)}\n\n"
        f"Garant zamietol dokument študenta **{student_name}** typu **{document.typ_dokumentu}**.\n\n"
        f"S pozdravom\nSystém odborných praxí"
    )
    _create_notification(prax, None, firma_email, subject, body_f)
