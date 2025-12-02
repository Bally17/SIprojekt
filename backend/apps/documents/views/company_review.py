from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.notifications.service import notify_document_reviewed, notify_document_soft_rejected_by_company

from ..models import Dokument
from .helpers import _assert, _user_is_firma


class CompanyReviewMixin:
    # -------------------  COMPANY APPROVE/REJECT  -------------------
    @action(detail=True, methods=["post"], url_path="approve-company")
    def approve_company(self, request, pk=None):
        """Firma schváli dokument (stav 'potvrdeny', audit)."""
        document = self.get_object()
        user = request.user
        prax = document.prax

        resp = _assert(_user_is_firma(user), "Iba firma môže schváliť dokument.", status.HTTP_403_FORBIDDEN)
        if resp:
            return resp

        if hasattr(user, "firma_id"):
            resp = _assert(
                user.firma_id == getattr(prax, "firma_id", None),
                "Toto nie je vaša prax.",
                status.HTTP_403_FORBIDDEN,
            )
            if resp:
                return resp

        resp = _assert(
            document.stav_dokumentu == Dokument.STAV_NAHRANY,
            "Firma môže schváliť len dokument v stave 'nahrany'.",
        )
        if resp:
            return resp

        document.stav_dokumentu = Dokument.STAV_POTVRDENY
        document.skontroloval_id = user.id
        document.skontrolovane_at = timezone.now()
        document.save(update_fields=["stav_dokumentu", "skontroloval_id", "skontrolovane_at", "zmenene_at"])

        notify_document_reviewed(document, approved=True)

        return Response({"detail": "Schválené firmou."}, status=status.HTTP_200_OK)

    @action(detail=True, methods=["post"], url_path="reject-company")
    def reject_company(self, request, pk=None):
        """Firma HARD zamietne → stav 'zamietnuty', reason povinný."""
        document = self.get_object()
        user = request.user
        prax = document.prax

        resp = _assert(_user_is_firma(user), "Iba firma môže zamietnuť dokument.", status.HTTP_403_FORBIDDEN)
        if resp:
            return resp

        if hasattr(user, "firma_id"):
            resp = _assert(
                user.firma_id == getattr(prax, "firma_id", None),
                "Toto nie je vaša prax.",
                status.HTTP_403_FORBIDDEN,
            )
            if resp:
                return resp

        resp = _assert(
            document.stav_dokumentu in [Dokument.STAV_NAHRANY, Dokument.STAV_POTVRDENY],
            "Neplatný stav na zamietnutie.",
        )
        if resp:
            return resp

        reason = (request.data.get("reason") or "").strip()
        resp = _assert(bool(reason), "Pole 'reason' je povinné.")
        if resp:
            return resp

        document.stav_dokumentu = Dokument.STAV_ZAMIETNUTY
        document.skontroloval_id = user.id
        document.skontrolovane_at = timezone.now()
        document.save(update_fields=["stav_dokumentu", "skontroloval_id", "skontrolovane_at", "zmenene_at"])

        notify_document_reviewed(document, approved=False, reason=reason)

        return Response({"detail": "Zamietnuté firmou (hard)."}, status=status.HTTP_200_OK)

    @action(detail=True, methods=["post"], url_path="reject-company-soft")
    def reject_company_soft(self, request, pk=None):
        """Firma SOFT zamietne → stav sa nemení, reason povinný."""
        document = self.get_object()
        user = request.user
        prax = document.prax

        resp = _assert(_user_is_firma(user), "Iba firma môže zamietnuť dokument.", status.HTTP_403_FORBIDDEN)
        if resp:
            return resp

        if hasattr(user, "firma_id"):
            resp = _assert(
                user.firma_id == getattr(prax, "firma_id", None),
                "Toto nie je vaša prax.",
                status.HTTP_403_FORBIDDEN,
            )
            if resp:
                return resp

        resp = _assert(
            document.stav_dokumentu == Dokument.STAV_NAHRANY,
            "Soft reject je dostupný len pre stav 'nahrany'.",
        )
        if resp:
            return resp

        reason = (request.data.get("reason") or "").strip()
        resp = _assert(bool(reason), "Pole 'reason' je povinné.")
        if resp:
            return resp

        notify_document_soft_rejected_by_company(document, reason=reason)

        return Response({"detail": "Soft zamietnutie firmou (stav sa nemení)."}, status=status.HTTP_200_OK)
