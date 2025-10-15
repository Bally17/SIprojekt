from rest_framework import serializers
from .models import Dokument

class DocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Dokument
        fields = '__all__'
