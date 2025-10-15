from rest_framework import serializers
from .models import Notifikacie

class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notifikacie
        fields = '__all__'
