# apps/users/serializers.py
from rest_framework import serializers
from .models import User, StudentProfil, GarantProfil


class UserSerializer(serializers.ModelSerializer):
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
    # Získame údaje z prepojeného používateľa
    id = serializers.IntegerField(source='pouzivatel.id', read_only=True)
    meno = serializers.CharField(source='pouzivatel.meno', read_only=True)
    priezvisko = serializers.CharField(source='pouzivatel.priezvisko', read_only=True)
    email = serializers.EmailField(source='pouzivatel.email', read_only=True)

    class Meta:
        model = StudentProfil
        fields = ['id', 'meno', 'priezvisko', 'email', 'studijny_program']


class GarantProfileSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(source='pouzivatel.id', read_only=True)
    meno = serializers.CharField(source='pouzivatel.meno', read_only=True)
    priezvisko = serializers.CharField(source='pouzivatel.priezvisko', read_only=True)
    email = serializers.EmailField(source='pouzivatel.email', read_only=True)

    class Meta:
        model = GarantProfil
        fields = ['id', 'meno', 'priezvisko', 'email', 'pracovisko']
