from rest_framework import serializers
from .models import Prax, HistoriaStavovPraxe
from apps.documents.models import Dokument
from apps.documents.serializers import DocumentSerializer


class InternshipSerializer(serializers.ModelSerializer):
    documents = serializers.SerializerMethodField()
    student_full_name = serializers.SerializerMethodField()
    student_email = serializers.SerializerMethodField()
    company_name = serializers.SerializerMethodField()
    study_program = serializers.SerializerMethodField()

    def get_documents(self, obj):
        docs = Dokument.objects.filter(prax=obj)
        return DocumentSerializer(docs, many=True).data

    def get_student_full_name(self, obj):
        student = getattr(obj, "student", None)
        if not student:
            return None
        return f"{student.meno or ''} {student.priezvisko or ''}".strip() or student.email

    def get_student_email(self, obj):
        student = getattr(obj, "student", None)
        return student.email if student else None

    def get_company_name(self, obj):
        firma = getattr(obj, "firma", None)
        return firma.nazov if firma else None

    def get_study_program(self, obj):
        student = getattr(obj, "student", None)
        if student and hasattr(student, "studentprofil"):
            return student.studentprofil.studijny_program
        return None

    class Meta:
        model = Prax
        fields = "__all__"


class InternshipHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = HistoriaStavovPraxe
        fields = "__all__"
