"""Serializers for document API payloads."""
from rest_framework import serializers

from .models import Dokument


class DocumentSerializer(serializers.ModelSerializer):
    """Serialize document records."""

    class Meta:
        model = Dokument
        fields = "__all__"
