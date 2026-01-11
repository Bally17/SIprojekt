"""Company review actions for document approval and rejection."""
from rest_framework.decorators import action
from rest_framework.response import Response

from services.documents.validation import approve_company, reject_company, reject_company_soft


class CompanyReviewMixin:
    """Provide company-specific review actions for documents."""

    @action(detail=True, methods=["post"], url_path="approve-company")
    def approve_company(self, request, pk=None):
        """Approve a document as a company and mark it confirmed."""
        document = self.get_object()
        result = approve_company(document, request.user)
        return Response(result["data"], status=result["status"])

    @action(detail=True, methods=["post"], url_path="reject-company")
    def reject_company(self, request, pk=None):
        """Hard-reject a document as a company and mark it rejected."""
        document = self.get_object()
        result = reject_company(document, request.user, request.data.get("reason"))
        return Response(result["data"], status=result["status"])

    @action(detail=True, methods=["post"], url_path="reject-company-soft")
    def reject_company_soft(self, request, pk=None):
        """Soft-reject a document as a company without changing state."""
        document = self.get_object()
        result = reject_company_soft(document, request.user, request.data.get("reason"))
        return Response(result["data"], status=result["status"])


__all__ = ["CompanyReviewMixin"]
