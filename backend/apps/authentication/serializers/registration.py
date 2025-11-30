import re

from django.contrib.auth.hashers import make_password
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

from apps.companies.models import Firma
from apps.users.models import StudentProfil, User, validate_student_email

PHONE_REGEX = r"^[+0-9][0-9\\s\\-]{6,18}$"
LEGAL_FORMS_COMPACT = {"sro", "as", "vos", "ks", "spolsro"}


def normalize_company_name(name: str) -> str:
    base = re.sub(r"[^a-z0-9]", "", (name or "").lower())
    for form in LEGAL_FORMS_COMPACT:
        if base.endswith(form):
            base = base[: -len(form)]
            break
    return base


class StudentRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False)
    password_confirm = serializers.CharField(write_only=True, required=False)
    studijny_program = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = [
            "email",
            "password",
            "password_confirm",
            "meno",
            "priezvisko",
            "telefon",
            "adresa",
            "studijny_program",
            "alternativny_email",
        ]

    def validate_email(self, value):
        validate_student_email(value)
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Email je už registrovaný.")
        return value

    def validate_telefon(self, value):
        if value and not re.match(PHONE_REGEX, value):
            raise serializers.ValidationError("Neplatný formát telefónu.")
        return value

    def validate_meno(self, value):
        value = (value or "").strip()
        if len(value) < 2:
            raise serializers.ValidationError("Meno musí mať aspoň 2 znaky.")
        return value

    def validate_priezvisko(self, value):
        value = (value or "").strip()
        if len(value) < 2:
            raise serializers.ValidationError("Priezvisko musí mať aspoň 2 znaky.")
        return value

    def validate_adresa(self, value):
        value = (value or "").strip()
        if len(value) < 5:
            raise serializers.ValidationError("Adresa musí mať aspoň 5 znakov.")
        return value

    def validate_studijny_program(self, value):
        value = (value or "").strip()
        if not value:
            raise serializers.ValidationError("Študijný program je povinný.")
        return value

    def validate(self, data):
        password = data.get("password")
        password_confirm = data.get("password_confirm")

        if password and password_confirm and password != password_confirm:
            raise serializers.ValidationError("Heslá sa nezhodujú.")

        if password:
            validate_password(password)
        return data

    def create(self, validated_data):
        studijny_program = validated_data.pop("studijny_program")
        validated_data.pop("password_confirm")
        password = validated_data.pop("password")
        alternativny_email = validated_data.pop("alternativny_email", None)

        user = User(
            email=validated_data["email"],
            rola="student",
            meno=validated_data.get("meno"),
            priezvisko=validated_data.get("priezvisko"),
            telefon=validated_data.get("telefon"),
            adresa=validated_data.get("adresa"),
            alternativny_email=alternativny_email,
            musi_zmenit_heslo=True,
            heslo_hash=make_password(password),
        )
        user.save()

        StudentProfil.objects.create(pouzivatel=user, studijny_program=studijny_program)
        return user


class CompanyRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False)
    nazov = serializers.CharField(write_only=True, required=True)
    kontaktna_osoba_meno = serializers.CharField(write_only=True, required=True)
    kontaktna_osoba_email = serializers.EmailField(write_only=True, required=True)
    kontaktna_osoba_telefon = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = [
            "email",
            "password",
            "nazov",
            "kontaktna_osoba_meno",
            "kontaktna_osoba_email",
            "kontaktna_osoba_telefon",
            "adresa",
        ]

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Email je už registrovaný.")
        return value

    def validate_nazov(self, value):
        value = (value or "").strip()
        if len(value) < 2:
            raise serializers.ValidationError("Názov firmy musí mať aspoň 2 znaky.")
        normalized = normalize_company_name(value)
        existing = {normalize_company_name(n) for n in Firma.objects.values_list("nazov", flat=True)}
        if normalized in existing:
            raise serializers.ValidationError("Firma s týmto názvom už existuje.")
        return value

    def validate_kontaktna_osoba_telefon(self, value):
        if value and not re.match(PHONE_REGEX, value):
            raise serializers.ValidationError("Neplatný formát telefónu.")
        return value

    def validate_kontaktna_osoba_meno(self, value):
        value = (value or "").strip()
        if len(value) < 3:
            raise serializers.ValidationError("Meno kontaktnej osoby musí mať aspoň 3 znaky.")
        return value

    def validate_adresa(self, value):
        value = (value or "").strip()
        if len(value) < 5:
            raise serializers.ValidationError("Adresa musí mať aspoň 5 znakov.")
        return value

    def validate_password(self, value):
        if value:
            validate_password(value)
        return value

    def create(self, validated_data):
        password = validated_data.pop("password", None)
        nazov = validated_data.pop("nazov")
        kontaktna_osoba_meno = validated_data.pop("kontaktna_osoba_meno")
        kontaktna_osoba_email = validated_data.pop("kontaktna_osoba_email")
        kontaktna_osoba_telefon = validated_data.pop("kontaktna_osoba_telefon")

        normalized = normalize_company_name(nazov)
        existing = {normalize_company_name(n) for n in Firma.objects.values_list("nazov", flat=True)}
        if normalized in existing:
            raise serializers.ValidationError({"nazov": "Firma s týmto názvom už existuje."})

        meno_parts = kontaktna_osoba_meno.split(" ", 1)
        meno = meno_parts[0]
        priezvisko = meno_parts[1] if len(meno_parts) > 1 else ""

        user = User(
            email=validated_data["email"],
            rola="firma",
            meno=meno,
            priezvisko=priezvisko,
            telefon=kontaktna_osoba_telefon,
            adresa=validated_data.get("adresa"),
            alternativny_email=kontaktna_osoba_email,
            aktivny=False,
            email_overeny=False,
            musi_zmenit_heslo=True,
        )

        if password:
            validate_password(password)
            user.set_password(password)
        else:
            user.heslo_hash = None
        user.save()

        firma = Firma.objects.create(
            nazov=nazov,
            adresa=user.adresa,
            kontakt_meno=kontaktna_osoba_meno,
            kontakt_email=kontaktna_osoba_email,
            kontakt_telefon=kontaktna_osoba_telefon,
        )

        user.firma_id = firma.id
        user.save(update_fields=["firma_id"])
        return user
