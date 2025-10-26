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
