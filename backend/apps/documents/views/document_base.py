"""Base viewset for document endpoints with role-based filtering."""
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from apps.documents.models import Dokument
from apps.documents.serializers import DocumentSerializer
from common.permissions.ownership import IsGarantOrRelatedDocument
from services.documents.validation import filter_documents_for_user


class DocumentBaseViewSet(viewsets.ModelViewSet):
    """Shared base viewset for document endpoints."""

    queryset = Dokument.objects.all()
    serializer_class = DocumentSerializer
    permission_classes = [IsAuthenticated, IsGarantOrRelatedDocument]

    def get_queryset(self):
        """Filter documents to internships related to the current user role."""
        user = getattr(self.request, "user", None)
        qs = super().get_queryset().order_by("-vytvorene_at")
        return filter_documents_for_user(user, qs)


__all__ = ["DocumentBaseViewSet"]
