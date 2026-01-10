"""Serializers for notification records."""
from rest_framework import serializers

from .models import Notifikacie


class NotificationSerializer(serializers.ModelSerializer):
    """Serialize notification records for API responses."""
    class Meta:
        model = Notifikacie
        fields = '__all__'
