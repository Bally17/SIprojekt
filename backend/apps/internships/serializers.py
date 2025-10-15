from rest_framework import serializers
from .models import Prax, HistoriaStavovPraxe

class InternshipSerializer(serializers.ModelSerializer):
    class Meta:
        model = Prax
        fields = '__all__'

class InternshipHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = HistoriaStavovPraxe
        fields = '__all__'
