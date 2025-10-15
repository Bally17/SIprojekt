from rest_framework import viewsets
from .models import Notifikacie
from .serializers import NotificationSerializer

class NotificationViewSet(viewsets.ModelViewSet):
    queryset = Notifikacie.objects.all()
    serializer_class = NotificationSerializer
