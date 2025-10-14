from rest_framework import viewsets
from .models import Prax, HistoriaStavovPraxe
from .serializers import InternshipSerializer, InternshipHistorySerializer

class InternshipViewSet(viewsets.ModelViewSet):
    queryset = Prax.objects.all()
    serializer_class = InternshipSerializer

class InternshipHistoryViewSet(viewsets.ModelViewSet):
    queryset = HistoriaStavovPraxe.objects.all()
    serializer_class = InternshipHistorySerializer
