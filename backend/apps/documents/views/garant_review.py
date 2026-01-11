"""Garant review actions for document approval and rejection."""
from rest_framework.decorators import action
from rest_framework.response import Response

from services.documents.validation import approve_garant, reject_garant_soft, reject_garant_hard


class GarantReviewMixin:
    """Provide garant-specific review actions for documents."""

    @action(detail=True, methods=["post"], url_path="approve-garant")
    def approve_garant(self, request, pk=None):
        """Approve a document as garant without changing its state."""
        document = self.get_object()
        result = approve_garant(document, request.user)
        return Response(result["data"], status=result["status"])

    @action(detail=True, methods=["post"], url_path="reject-garant-soft")
    def reject_garant_soft(self, request, pk=None):
        """Soft-reject a document as garant without changing state."""
        document = self.get_object()
        result = reject_garant_soft(document, request.user, request.data.get("reason"))
        return Response(result["data"], status=result["status"])

    @action(detail=True, methods=["post"], url_path="reject-garant-hard")
    def reject_garant_hard(self, request, pk=None):
        """Hard-reject a document as garant and mark it rejected."""
        document = self.get_object()
        result = reject_garant_hard(document, request.user, request.data.get("reason"))
        return Response(result["data"], status=result["status"])


__all__ = ["GarantReviewMixin"]
