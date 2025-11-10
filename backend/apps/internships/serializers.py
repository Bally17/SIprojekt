from rest_framework import serializers
from .models import Prax, HistoriaStavovPraxe
from apps.documents.models import Dokument
from apps.documents.serializers import DocumentSerializer

class InternshipSerializer(serializers.ModelSerializer):
    documents = serializers.SerializerMethodField()

    def get_documents(self, obj):
        docs = Dokument.objects.filter(prax=obj)
        return DocumentSerializer(docs, many=True).data

    class Meta:
        model = Prax
        fields = '__all__'

class InternshipHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = HistoriaStavovPraxe
        fields = '__all__'


class ExternalDefenseSerializer(serializers.Serializer):
    prax_id = serializers.IntegerField()
    external_reference = serializers.CharField(required=False, allow_blank=True, max_length=100)
    note = serializers.CharField(required=False, allow_blank=True, max_length=500)

    def validate_prax_id(self, value):
        if value <= 0:
            raise serializers.ValidationError("prax_id musí byť kladné číslo.")
        return value
