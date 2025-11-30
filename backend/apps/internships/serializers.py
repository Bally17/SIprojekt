from django.db import IntegrityError
from django.utils import timezone
from rest_framework import serializers

from apps.documents.models import Dokument
from apps.documents.serializers import DocumentSerializer
from apps.users.models import User
from apps.companies.models import Firma
from .document_requirements import missing_required_documents
from .models import Prax, HistoriaStavovPraxe


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
        fields = '__all__'

class ExternalDefenseSerializer(serializers.Serializer):
    prax_id = serializers.IntegerField()
    external_reference = serializers.CharField(required=False, allow_blank=True, max_length=100)
    note = serializers.CharField(required=False, allow_blank=True, max_length=500)

    def validate_prax_id(self, value):
        if value <= 0:
            raise serializers.ValidationError("prax_id musí byť kladné číslo.")
        return value


class GarantInternshipIdentitySerializer(serializers.ModelSerializer):
    student_id = serializers.IntegerField(source="student.id", read_only=True)
    student_email = serializers.EmailField(source="student.email", read_only=True)
    student_first_name = serializers.CharField(
        source="student.meno", required=False, allow_blank=True
    )
    student_last_name = serializers.CharField(
        source="student.priezvisko", required=False, allow_blank=True
    )
    student_full_name = serializers.SerializerMethodField()
    company_id = serializers.IntegerField(source="firma.id", read_only=True)
    company_name = serializers.CharField(source="firma.nazov", required=False)

    class Meta:
        model = Prax
        fields = [
            "id",
            "student_id",
            "student_email",
            "student_first_name",
            "student_last_name",
            "student_full_name",
            "company_id",
            "company_name",
        ]
        read_only_fields = [
            "id",
            "student_id",
            "student_email",
            "student_full_name",
            "company_id",
        ]

    def validate(self, attrs):
        if not attrs.get("student") and not attrs.get("firma"):
            raise serializers.ValidationError(
                "Musíte zadať aspoň jedno pole (študent alebo firma) na aktualizáciu."
            )
        return super().validate(attrs)

    def get_student_full_name(self, obj):
        student = getattr(obj, "student", None)
        if not student:
            return None
        return f"{student.meno or ''} {student.priezvisko or ''}".strip() or student.email

    def update(self, instance, validated_data):
        student_payload = validated_data.pop("student", None)
        firma_payload = validated_data.pop("firma", None)

        if student_payload and instance.student:
            student = instance.student
            updated_fields = []

            if "meno" in student_payload:
                student.meno = student_payload["meno"]
                updated_fields.append("meno")

            if "priezvisko" in student_payload:
                student.priezvisko = student_payload["priezvisko"]
                updated_fields.append("priezvisko")

            if updated_fields:
                student.save(update_fields=updated_fields)

        if firma_payload and instance.firma:
            firma = instance.firma
            if "nazov" in firma_payload:
                new_name = firma_payload["nazov"].strip()
                if not new_name:
                    raise serializers.ValidationError(
                        {"company_name": "Názov firmy nesmie byť prázdny."}
                    )
                firma.nazov = new_name
                try:
                    firma.save(update_fields=["nazov"])
                except IntegrityError:
                    raise serializers.ValidationError(
                        {"company_name": "Firma s týmto názvom už existuje."}
                    )

        instance.refresh_from_db(fields=["student", "firma"])
        return instance


class GarantInternshipUpdateSerializer(serializers.ModelSerializer):
    firma_id = serializers.PrimaryKeyRelatedField(
        source="firma", queryset=Firma.objects.all(), required=False
    )
    student_id = serializers.PrimaryKeyRelatedField(
        source="student",
        queryset=User.objects.filter(rola=User.ROLE_STUDENT),
        required=False,
    )
    status_note = serializers.CharField(
        required=False, allow_blank=True, write_only=True, max_length=500
    )

    class Meta:
        model = Prax
        fields = [
            "id",
            "firma_id",
            "student_id",
            "datum_zaciatku",
            "datum_konca",
            "stav",
            "status_note",
        ]
        read_only_fields = ["id"]

    def validate(self, attrs):
        payload = {key: value for key, value in attrs.items() if key != "status_note"}
        if not payload:
            raise serializers.ValidationError(
                "Musíte zadať aspoň jedno pole na aktualizáciu."
            )

        note = attrs.get("status_note", "").strip()
        if note and "stav" not in attrs:
            raise serializers.ValidationError(
                {"status_note": "Poznámku je možné pridať len pri zmene stavu."}
            )

        start = attrs.get("datum_zaciatku") or getattr(self.instance, "datum_zaciatku", None)
        end = attrs.get("datum_konca") or getattr(self.instance, "datum_konca", None)

        if start and end and end < start:
            raise serializers.ValidationError(
                {"datum_konca": "Dátum ukončenia nemôže byť pred dátumom začiatku."}
            )

        target_state = (attrs.get("stav") or "").lower()
        instance_state = (getattr(self.instance, "stav", "") or "").lower()
        if target_state and target_state != instance_state and self.instance:
            missing_docs = missing_required_documents(self.instance, target_state)
            if missing_docs:
                docs_text = ", ".join(missing_docs)
                raise serializers.ValidationError(
                    {
                        "stav": (
                            f"Pred zmenou stavu na '{target_state}' musia byť potvrdené dokumenty: "
                            f"{docs_text}."
                        )
                    }
                )

        return attrs

    def update(self, instance, validated_data):
        status_note = validated_data.pop("status_note", "").strip()
        request = self.context.get("request")
        user = getattr(request, "user", None) if request else None

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        stav_updated = "stav" in validated_data

        if user and getattr(user, "is_authenticated", False):
            instance._changed_by = user
        if status_note and stav_updated:
            instance._status_change_note = status_note

        instance.save()
        return instance
class StudentCreateInternshipSerializer(serializers.Serializer):
    firma_id = serializers.IntegerField()
    rok = serializers.IntegerField()
    semester = serializers.CharField()
    datum_zaciatku = serializers.DateField()
    datum_konca = serializers.DateField()

    def validate_firma_id(self, value):
        if value <= 0:
            raise serializers.ValidationError("firma_id musí byť kladné číslo.")
        if not Firma.objects.filter(id=value).exists():
            raise serializers.ValidationError("Firma so zadaným ID neexistuje.")
        return value

    def validate_rok(self, value):
        current_year = timezone.now().year
        if value < current_year - 1 or value > current_year + 2:
            raise serializers.ValidationError("Rok praxe je mimo povoleného intervalu.")
        return value

    def validate(self, attrs):
        start = attrs.get("datum_zaciatku")
        end = attrs.get("datum_konca")
        if start and end and end < start:
            raise serializers.ValidationError(
                {"datum_konca": "Dátum ukončenia nemôže byť pred dátumom začiatku."}
            )
        semester = (attrs.get("semester") or "").lower()
        if semester not in ("zimny", "letny"):
            raise serializers.ValidationError({"semester": "Semester musí byť zimny alebo letny."})
        attrs["semester"] = semester
        return attrs
