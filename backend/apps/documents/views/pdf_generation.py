"""PDF generation mixin for internship documents."""
from django.http import FileResponse
from rest_framework.decorators import action
from rest_framework.response import Response

from services.documents.generation import generate_dohoda_for_document


class PdfGenerationMixin:
    """Provide PDF generation actions for document workflows."""

    @action(detail=True, methods=["get"], url_path="generate_dohoda")
    def generate_dohoda(self, request, pk=None):
        """Generate a PDF agreement for eligible student internships."""
        document = self.get_object()
        result = generate_dohoda_for_document(document, request.user)
        if not result["ok"]:
            return Response(result["data"], status=result["status"])

        payload = result["data"]
        return FileResponse(
            payload["buffer"],
            as_attachment=True,
            filename=payload["filename"],
            content_type="application/pdf",
        )


__all__ = ["PdfGenerationMixin"]
