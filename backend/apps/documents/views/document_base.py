"""Base viewset for document endpoints with role-based filtering."""
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from apps.internships.permissions import IsGarantOrRelatedDocument
from apps.users.models import User

from ..models import Dokument
from ..serializers import DocumentSerializer


class DocumentBaseViewSet(viewsets.ModelViewSet):
    """Shared base viewset for document endpoints."""

    queryset = Dokument.objects.all()
    serializer_class = DocumentSerializer
    permission_classes = [IsAuthenticated, IsGarantOrRelatedDocument]

    def get_queryset(self):
        """Filter documents to internships related to the current user role."""
        user = getattr(self.request, "user", None)
        qs = super().get_queryset().order_by("-vytvorene_at")
        role = getattr(user, "rola", "") or ""

        if role == User.ROLE_GARANT:
            return qs
        if role == User.ROLE_STUDENT:
            return qs.filter(prax__student_id=user.id).order_by("-vytvorene_at")
        if role == User.ROLE_FIRMA:
            firma_id = getattr(user, "firma_id", None)
            return (
                qs.filter(prax__firma_id=firma_id).order_by("-vytvorene_at")
                if firma_id
                else qs.none()
            )
        return qs.none()
