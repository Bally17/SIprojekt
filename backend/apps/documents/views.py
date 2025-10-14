from rest_framework import viewsets
from .models import Dokument
from .serializers import DocumentSerializer

class DocumentViewSet(viewsets.ModelViewSet):
    queryset = Dokument.objects.all()
    serializer_class = DocumentSerializer
