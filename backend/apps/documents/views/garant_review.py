"""Garant review actions for document approval and rejection."""
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.notifications.service import (
    notify_document_hard_rejected_by_garant,
    notify_document_reviewed_by_garant,
    notify_document_soft_rejected_by_garant,
)

from ..models import Dokument
from .helpers import _assert, _user_is_garant


class GarantReviewMixin:
    """Provide garant-specific review actions for documents."""
    # --------------------  GARANT APPROVE/REJECT  --------------------
    @action(detail=True, methods=["post"], url_path="approve-garant")
    def approve_garant(self, request, pk=None):
        """Approve a document as garant without changing its state."""
        document = self.get_object()
        user = request.user

        resp = _assert(_user_is_garant(user), "Iba garant môže schváliť dokument.", status.HTTP_403_FORBIDDEN)
        if resp:
            return resp

        resp = _assert(
            document.stav_dokumentu == Dokument.STAV_POTVRDENY,
            "Garant môže schváliť až po schválení firmou (stav 'potvrdeny').",
        )
        if resp:
            return resp

        document.skontroloval_id = user.id
        document.skontrolovane_at = timezone.now()
        document.save(update_fields=["skontroloval_id", "skontrolovane_at", "zmenene_at"])

        notify_document_reviewed_by_garant(document)

        return Response({"detail": "Schválené garantom."}, status=status.HTTP_200_OK)

    @action(detail=True, methods=["post"], url_path="reject-garant-soft")
    def reject_garant_soft(self, request, pk=None):
        """Soft-reject a document as garant without changing state."""
        document = self.get_object()
        user = request.user

        resp = _assert(_user_is_garant(user), "Iba garant môže zamietnuť dokument.", status.HTTP_403_FORBIDDEN)
        if resp:
            return resp

        resp = _assert(
            document.stav_dokumentu == Dokument.STAV_POTVRDENY,
            "Soft reject je dostupný až po schválení firmou (stav 'potvrdeny').",
        )
        if resp:
            return resp

        reason = (request.data.get("reason") or "").strip()
        resp = _assert(bool(reason), "Pole 'reason' je povinné.")
        if resp:
            return resp

        document.skontroloval_id = user.id
        document.skontrolovane_at = timezone.now()
        document.save(update_fields=["skontroloval_id", "skontrolovane_at", "zmenene_at"])

        notify_document_soft_rejected_by_garant(document, reason=reason)

        return Response({"detail": "Soft zamietnutie garantom (stav sa nemení)."}, status=status.HTTP_200_OK)

    @action(detail=True, methods=["post"], url_path="reject-garant-hard")
    def reject_garant_hard(self, request, pk=None):
        """Hard-reject a document as garant and mark it rejected."""
        document = self.get_object()
        user = request.user

        resp = _assert(_user_is_garant(user), "Iba garant môže zamietnuť dokument.", status.HTTP_403_FORBIDDEN)
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

        notify_document_hard_rejected_by_garant(document, reason=reason)

        return Response({"detail": "Hard zamietnutie garantom."}, status=status.HTTP_200_OK)
