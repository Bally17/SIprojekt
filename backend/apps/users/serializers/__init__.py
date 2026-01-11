"""Serializers for user and profile data."""
from rest_framework import serializers
from ..models import User, StudentProfil, GarantProfil
from django.db import transaction


class UserSerializer(serializers.ModelSerializer):
    """Serialize core user fields for API responses."""
    class Meta:
        model = User
        fields = [
            'id',
            'email',
            'meno',
            'priezvisko',
            'is_active',
            'is_staff',
            'is_superuser',
            'vytvorene_at',
        ]


class StudentProfileSerializer(serializers.ModelSerializer):
    """Serialize student profile with user fields."""
    # Získame údaje z prepojeného používateľa
    id = serializers.IntegerField(source='pouzivatel.id', read_only=True)
    meno = serializers.CharField(source='pouzivatel.meno', read_only=True)
    priezvisko = serializers.CharField(source='pouzivatel.priezvisko', read_only=True)
    email = serializers.EmailField(source='pouzivatel.email', read_only=True)

    class Meta:
        model = StudentProfil
        fields = ['id', 'meno', 'priezvisko', 'email', 'studijny_program']


class GarantProfileSerializer(serializers.ModelSerializer):
    """Serialize garant profile with user fields."""
    id = serializers.IntegerField(source='pouzivatel.id', read_only=True)
    meno = serializers.CharField(source='pouzivatel.meno', read_only=True)
    priezvisko = serializers.CharField(source='pouzivatel.priezvisko', read_only=True)
    email = serializers.EmailField(source='pouzivatel.email', read_only=True)

    class Meta:
        model = GarantProfil
        fields = ['id', 'meno', 'priezvisko', 'email', 'pracovisko']


class GarantAccountSerializer(serializers.ModelSerializer):
    """Create and serialize garant accounts with password handling."""

    password = serializers.CharField(write_only=True, min_length=8)
    pracovisko = serializers.CharField(required=False, allow_blank=True, write_only=True)

    class Meta:
        model = User
        fields = ["id", "email", "meno", "priezvisko", "password", "pracovisko"]

    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("Používateľ s týmto emailom už existuje.")
        return value.lower()

    def create(self, validated_data):
        password = validated_data.pop("password")
        pracovisko = validated_data.pop("pracovisko", "")

        with transaction.atomic():
            user = User.objects.create_user(
                rola=User.ROLE_GARANT,
                aktivny=True,
                email_overeny=True,
                musi_zmenit_heslo=False,
                **validated_data,
            )
            user.set_password(password)
            user.save(update_fields=["heslo_hash", "meno", "priezvisko", "email", "rola", "aktivny", "email_overeny", "musi_zmenit_heslo"])

            GarantProfil.objects.update_or_create(
                pouzivatel=user, defaults={"pracovisko": pracovisko or None}
            )

        return user
