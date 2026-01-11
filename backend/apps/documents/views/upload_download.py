"""Upload/download mixin for document files and access checks."""
from django.http import FileResponse
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.documents.serializers import DocumentSerializer
from services.documents.validation import download_document, upload_document_file


class DocumentUploadDownloadMixin:
    """Provide upload/download actions for document files."""

    @action(detail=True, methods=["post"], url_path="upload")
    def upload(self, request, pk=None):
        """Upload a PDF for allowed roles and update document state."""
        document = self.get_object()
        result = upload_document_file(document, request.user, request.FILES.get("file"))
        if not result["ok"]:
            return Response(result["data"], status=result["status"])

        return Response(DocumentSerializer(result["document"]).data, status=result["status"])

    @action(detail=True, methods=["get"], url_path="download")
    def download(self, request, pk=None):
        """Return a presigned URL or streamed file for authorized users."""
        document = self.get_object()
        result = download_document(document, request.user)
        if not result["ok"]:
            return Response(result["data"], status=result["status"])

        data = result["data"]
        if "file_path" in data:
            return FileResponse(
                open(data["file_path"], "rb"),
                as_attachment=True,
                filename=data.get("filename"),
                content_type=data.get("content_type"),
            )

        return Response(data, status=result["status"])


__all__ = ["DocumentUploadDownloadMixin"]
