"""Serializers for company data."""
from rest_framework import serializers
from ..models import Firma

class CompanySerializer(serializers.ModelSerializer):
    """Serialize company records."""
    class Meta:
        model = Firma
        fields = '__all__'
