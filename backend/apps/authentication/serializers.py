from rest_framework import serializers
from django.contrib.auth import authenticate
from django.contrib.auth.hashers import make_password
from django.contrib.auth.password_validation import validate_password
from apps.users.models import User, StudentProfil, validate_student_email
from apps.companies.models import Firma
from apps.companies.models import Firma  # Ak máš Company model

class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        email = data.get('email')
        password = data.get('password')

        if email and password:
            # Skúsime nájsť používateľa podľa emailu
            try:
                user = User.objects.get(email=email)
                # Použijeme vlastnú check_password metódu
                if not user.check_password(password):
                    user = None
            except User.DoesNotExist:
                user = None

            if not user:
                raise serializers.ValidationError('Invalid email or password')

            data['user'] = user
        else:
            raise serializers.ValidationError('Must include "email" and "password"')

        return data

class GoogleAuthSerializer(serializers.Serializer):
    access_token = serializers.CharField(required=True)
    id_token = serializers.CharField(required=False)

class GitHubAuthSerializer(serializers.Serializer):
    code = serializers.CharField(required=True)

class StudentRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False)
    password_confirm = serializers.CharField(write_only=True, required=False)

    studijny_program = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = [
            'email', 'password', 'password_confirm', 'meno', 'priezvisko', 
            'telefon', 'adresa', 'studijny_program', 'alternativny_email'
        ]

    def validate_email(self, value):
        """
        Validácia študentského emailu pre rolu študent
        """
        # Validácia študentskej domény
        validate_student_email(value)
        
        # Overenie či email už existuje
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Email je už registrovaný.")
        
        return value

    def validate(self, data):
        password = data.get('password')
        password_confirm = data.get('password_confirm')

    # iba ak boli zadané manuálne (napr. pri testovaní)
        if password and password_confirm and password != password_confirm:
            raise serializers.ValidationError("Heslá sa nezhodujú.")
        return data


    def create(self, validated_data):
        # Extrahuj údaje pre študentský profil
        studijny_program = validated_data.pop('studijny_program')
        password_confirm = validated_data.pop('password_confirm')
        password = validated_data.pop('password')
        alternativny_email = validated_data.pop('alternativny_email', None)
        
        # Vytvor používateľa s rolou študent
        user = User(
            email=validated_data['email'],
            rola='student',
            meno=validated_data.get('meno'),
            priezvisko=validated_data.get('priezvisko'),
            telefon=validated_data.get('telefon'),
            adresa=validated_data.get('adresa'),
            alternativny_email=alternativny_email,
            musi_zmenit_heslo=True,
            heslo_hash=make_password(password),
        )
        user.save()
        
        # Vytvor študentský profil
        StudentProfil.objects.create(
            pouzivatel=user,
            studijny_program=studijny_program
        )
        
        return user

class CompanyRegistrationSerializer(serializers.ModelSerializer):
    nazov = serializers.CharField(write_only=True, required=True)
    kontaktna_osoba_meno = serializers.CharField(write_only=True, required=True)
    kontaktna_osoba_email = serializers.EmailField(write_only=True, required=True)
    kontaktna_osoba_telefon = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = [
            'email', 'nazov', 'kontaktna_osoba_meno', 'kontaktna_osoba_email', 
            'kontaktna_osoba_telefon', 'adresa'
        ]

    def validate_email(self, value):
        """
        Validácia emailu pre firmu
        """
        # Overenie či email už existuje
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Email je už registrovaný.")
        
        return value

    def validate_nazov(self, value):
        if Firma.objects.filter(nazov__iexact=value).exists():
            raise serializers.ValidationError("Firma s týmto názvom už existuje.")
        return value

    def create(self, validated_data):
        # Extrahuj údaje pre kontaktnú osobu
        nazov = validated_data.pop('nazov')
        kontaktna_osoba_meno = validated_data.pop('kontaktna_osoba_meno')
        kontaktna_osoba_email = validated_data.pop('kontaktna_osoba_email')
        kontaktna_osoba_telefon = validated_data.pop('kontaktna_osoba_telefon')
        
        # Rozdeľ meno na meno a priezvisko
        meno_parts = kontaktna_osoba_meno.split(' ', 1)
        meno = meno_parts[0]
        priezvisko = meno_parts[1] if len(meno_parts) > 1 else ""
        
        # Vytvor používateľa s rolou firma (NEAKTÍVNY - podľa FR-03)
        user = User(
            email=validated_data['email'],
            rola='firma',
            meno=meno,
            priezvisko=priezvisko,
            telefon=kontaktna_osoba_telefon,
            adresa=validated_data.get('adresa'),
            alternativny_email=kontaktna_osoba_email,
            aktivny=False,  # NEAKTÍVNY - vyžaduje aktiváciu cez email
            email_overeny=False,
            musi_zmenit_heslo=True,
            heslo_hash=None,  # Heslo bude generované a odoslané emailom
        )
        user.save()

        firma = Firma.objects.create(
            nazov=nazov,
            adresa=user.adresa,
            kontakt_meno=kontaktna_osoba_meno,
            kontakt_email=kontaktna_osoba_email,
            kontakt_telefon=kontaktna_osoba_telefon,
        )

        user.firma_id = firma.id
        user.save(update_fields=['firma_id'])

        return user

# Čaká presne jeden email, overí správnosť podla formátu ale nekuká do db či tam je
class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()

# Tu čaká tri veci - token, new_password, new_password_confirm, overí zhodu hesiel, zavolá validate password
class PasswordResetConfirmSerializer(serializers.Serializer):
    token = serializers.CharField()
    new_password = serializers.CharField(write_only=True)
    new_password_confirm = serializers.CharField(write_only=True)
    #ak ok uložia sa nove data
    def validate(self, data):
        password = data.get('new_password')
        password_confirm = data.get('new_password_confirm')

        if password != password_confirm:
            raise serializers.ValidationError("Heslá sa nezhodujú.")

        validate_password(password)
        return data
