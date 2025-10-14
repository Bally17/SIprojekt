from rest_framework import serializers
from .models import Firma

class CompanySerializer(serializers.ModelSerializer):
    class Meta:
        model = Firma
        fields = '__all__'
