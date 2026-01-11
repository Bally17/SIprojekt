"""Notification service helpers for building and sending messages."""
import logging
from typing import Optional

from apps.notifications.models import Notifikacie
from apps.users.models import User
from apps.internships.models import Prax
from apps.documents.models import Dokument
from services.notifications import templates

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------

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
    student_name = templates.name_of_user(student)

    # Firma
    _create_notification(
        prax=prax,
        prijemca_user=None,
        prijemca_email=firma_email,
        subject=templates.document_uploaded_company_subject(),
        body_text=templates.document_uploaded_company_body(
            firma_name=firma_name,
            student_name=student_name,
            document_type=document.typ_dokumentu,
        ),
    )

    # Garant
    if garant and getattr(garant, "email", None):
        _create_notification(
            prax=prax,
            prijemca_user=garant,
            prijemca_email=garant.email,
            subject=templates.document_uploaded_garant_subject(),
            body_text=templates.document_uploaded_garant_body(
                garant_name=templates.name_of_user(garant),
                student_name=student_name,
                document_type=document.typ_dokumentu,
            ),
        )


def notify_document_reviewed(document: Dokument, *, approved: bool, reason: Optional[str] = None):
    """Notify users about company review outcome for a document."""
    prax = document.prax
    student = prax.student
    garant = prax.garant

    student_name = templates.name_of_user(student)

    if approved:
        # → Firma schválila
        subject = templates.document_approved_by_company_subject()
        body_std = templates.document_approved_by_company_body(
            student_name=student_name,
            document_type=document.typ_dokumentu,
        )
        _create_notification(prax, student, student.email, subject, body_std)

        if garant and getattr(garant, "email", None):
            body_g = templates.document_approved_by_company_garant_body(
                garant_name=templates.name_of_user(garant),
                student_name=student_name,
                document_type=document.typ_dokumentu,
            )
            _create_notification(prax, garant, garant.email, subject, body_g)

    else:
        # → Firma HARD reject (len študent)
        subject = templates.document_rejected_by_company_subject()
        body = templates.document_rejected_by_company_body(
            student_name=student_name,
            document_type=document.typ_dokumentu,
            reason=reason,
        )
        _create_notification(prax, student, student.email, subject, body)


def notify_document_soft_rejected_by_company(document: Dokument, *, reason: str):
    """Notify a student about a soft rejection by the company."""
    prax = document.prax
    student = prax.student
    student_name = templates.name_of_user(student)

    subject = templates.document_soft_rejected_by_company_subject()
    body = templates.document_soft_rejected_by_company_body(
        student_name=student_name,
        document_type=document.typ_dokumentu,
        reason=reason,
    )
    _create_notification(prax, student, student.email, subject, body)


def notify_document_reviewed_by_garant(document: Dokument):
    """Notify student and company about garant approval."""
    prax = document.prax
    student = prax.student
    garant = prax.garant
    firma = prax.firma

    student_name = templates.name_of_user(student)
    garant_name = templates.name_of_user(garant) if garant else ""
    firma_email = getattr(firma, "kontakt_email", None)
    firma_name = getattr(firma, "kontakt_meno", "") or getattr(firma, "nazov", "")

    subject = templates.document_approved_by_garant_subject()

    # študent
    body_std = templates.document_approved_by_garant_student_body(
        student_name=student_name,
        document_type=document.typ_dokumentu,
    )
    _create_notification(prax, student, student.email, subject, body_std)

    # firma
    body_f = templates.document_approved_by_garant_company_body(
        firma_name=firma_name,
        student_name=student_name,
        document_type=document.typ_dokumentu,
    )
    _create_notification(prax, None, firma_email, subject, body_f)


def notify_document_soft_rejected_by_garant(document: Dokument, *, reason: str):
    """Notify a student about a soft rejection by the garant."""
    prax = document.prax
    student = prax.student
    student_name = templates.name_of_user(student)

    subject = templates.document_soft_rejected_by_garant_subject()
    body = templates.document_soft_rejected_by_garant_body(
        student_name=student_name,
        document_type=document.typ_dokumentu,
        reason=reason,
    )
    _create_notification(prax, student, student.email, subject, body)


def notify_document_hard_rejected_by_garant(document: Dokument, *, reason: str):
    """Notify student and company about a hard rejection by the garant."""
    prax = document.prax
    student = prax.student
    garant = prax.garant
    firma = prax.firma

    student_name = templates.name_of_user(student)
    firma_email = getattr(firma, "kontakt_email", None)
    firma_name = getattr(firma, "kontakt_meno", "") or getattr(firma, "nazov", "")

    subject = templates.document_rejected_by_garant_subject()

    # študent
    body_std = templates.document_rejected_by_garant_student_body(
        student_name=student_name,
        document_type=document.typ_dokumentu,
        reason=reason,
    )
    _create_notification(prax, student, student.email, subject, body_std)

    # firma
    body_f = templates.document_rejected_by_garant_company_body(
        firma_name=firma_name,
        student_name=student_name,
        document_type=document.typ_dokumentu,
    )
    _create_notification(prax, None, firma_email, subject, body_f)
