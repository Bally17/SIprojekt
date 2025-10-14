from rest_framework import viewsets
from .models import Firma
from .serializers import CompanySerializer

class CompanyViewSet(viewsets.ModelViewSet):
    queryset = Firma.objects.all()
    serializer_class = CompanySerializer
