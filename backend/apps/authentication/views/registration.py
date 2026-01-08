from django.conf import settings
from django.core.mail import send_mail
from django.core.signing import BadSignature, SignatureExpired
from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi

from apps.users.models import User

from ..serializers import (
    CompanyProfileCompletionSerializer,
    CompanyRegistrationSerializer,
    StudentRegistrationSerializer,
)
from ..utils import generate_random_password, send_activation_email, AllowInactiveJWTAuthentication
from .helpers import activation_signer, ACTIVATION_TOKEN_MAX_AGE, generate_password, get_user_data
from apps.companies.models import Firma
from apps.companies.serializers import CompanySerializer


class StudentRegistrationView(generics.CreateAPIView):
    serializer_class = StudentRegistrationSerializer
    permission_classes = [AllowAny]
    throttle_scope = "registration"
    throttle_classes = [ScopedRateThrottle]

    def send_activation_email(self, user, password):
        """Odošle aktivačný email so zahashovaným tokenom"""
        token = activation_signer.sign(user.email)
        activation_link = f"{settings.FRONTEND_URL}/auth/activate/{token}/"

        subject = "Aktivácia účtu – Študentská prax"
        message = f"""
Dobrý deň {user.meno},

váš účet bol úspešne vytvorený.

Pre aktiváciu účtu kliknite na tento odkaz:
{activation_link}

Prihlasovacie údaje:
Email: {user.email}
Heslo: {password}

Po aktivácii sa, prosím, prihláste a zmeňte heslo.

S pozdravom,
Tím Študentskej praxe
"""
        send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [user.email])

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        generated_password = generate_password()
        serializer.validated_data["password"] = generated_password
        serializer.validated_data["password_confirm"] = generated_password

        user = serializer.save()
        user.aktivny = False
        user.email_overeny = False
        user.save()

        self.send_activation_email(user, generated_password)

        return Response(
            {
                "message": "Študent bol úspešne zaregistrovaný. Aktivačný email bol odoslaný.",
                "user_id": user.id,
                "email": user.email,
            },
            status=status.HTTP_201_CREATED,
        )


class CompanyRegistrationView(generics.CreateAPIView):
    serializer_class = CompanyRegistrationSerializer
    permission_classes = [AllowAny]
    throttle_scope = "registration"
    throttle_classes = [ScopedRateThrottle]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        generated_password = generate_random_password()
        user = serializer.save(password=generated_password)
        user.musi_zmenit_heslo = True
        user.save(update_fields=["musi_zmenit_heslo"])

        send_activation_email(user, generated_password)

        return Response(
            {
                "message": "Firma bola úspešne zaregistrovaná. Aktivačný email s údajmi bol odoslaný.",
                "user_id": user.id,
                "email": user.email,
                "status": "neaktívny - vyžaduje aktiváciu",
            },
            status=status.HTTP_201_CREATED,
        )


@api_view(["GET"])
@permission_classes([AllowAny])
def activate_account(request, token):
    """Aktivácia účtu cez token"""
    try:
        email = activation_signer.unsign(token, max_age=ACTIVATION_TOKEN_MAX_AGE)
        user = User.objects.get(email=email)
        user.aktivny = True
        user.email_overeny = True
        user.save()
        return Response({"message": "Účet bol úspešne aktivovaný."}, status=200)
    except SignatureExpired:
        return Response({"error": "Aktivačný odkaz expiroval."}, status=400)
    except (User.DoesNotExist, BadSignature):
        return Response({"error": "Neplatný alebo expirovaný odkaz."}, status=400)


@swagger_auto_schema(
    methods=["post"],
    operation_summary="Complete company profile after social registration",
    operation_description=(
        "Fills required company data and activates the company account."
    ),
    request_body=openapi.Schema(
        type=openapi.TYPE_OBJECT,
        required=[
            "nazov",
            "kontaktna_osoba_meno",
            "kontaktna_osoba_email",
            "kontaktna_osoba_telefon",
            "adresa",
        ],
        properties={
            "nazov": openapi.Schema(type=openapi.TYPE_STRING),
            "kontaktna_osoba_meno": openapi.Schema(type=openapi.TYPE_STRING),
            "kontaktna_osoba_email": openapi.Schema(type=openapi.TYPE_STRING),
            "kontaktna_osoba_telefon": openapi.Schema(type=openapi.TYPE_STRING),
            "adresa": openapi.Schema(type=openapi.TYPE_STRING),
        },
    ),
    responses={
        200: openapi.Response(description="Company profile completed."),
        400: "Validation error",
        401: "Unauthorized",
        403: "Forbidden",
    },
)
@api_view(["POST"])
@authentication_classes([AllowInactiveJWTAuthentication])
@permission_classes([IsAuthenticated])
def company_profile_complete(request):
    """Complete company profile for social-registered accounts."""
    user = request.user
    if user.rola != User.ROLE_FIRMA:
        return Response({"error": "Only company users can complete company profile."}, status=status.HTTP_403_FORBIDDEN)

    serializer = CompanyProfileCompletionSerializer(data=request.data, context={"user": user})
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    data = serializer.validated_data
    meno_parts = data["kontaktna_osoba_meno"].split(" ", 1)
    meno = meno_parts[0]
    priezvisko = meno_parts[1] if len(meno_parts) > 1 else ""

    user.meno = meno
    user.priezvisko = priezvisko
    user.telefon = data["kontaktna_osoba_telefon"]
    user.adresa = data["adresa"]
    user.alternativny_email = data["kontaktna_osoba_email"]
    user.aktivny = True
    user.email_overeny = True
    user.musi_zmenit_heslo = False
    user.save(
        update_fields=[
            "meno",
            "priezvisko",
            "telefon",
            "adresa",
            "alternativny_email",
            "aktivny",
            "email_overeny",
            "musi_zmenit_heslo",
        ]
    )

    firma = None
    if user.firma_id:
        firma = Firma.objects.filter(id=user.firma_id).first()

    if firma:
        firma.nazov = data["nazov"]
        firma.adresa = data["adresa"]
        firma.kontakt_meno = data["kontaktna_osoba_meno"]
        firma.kontakt_email = data["kontaktna_osoba_email"]
        firma.kontakt_telefon = data["kontaktna_osoba_telefon"]
        firma.save()
    else:
        firma = Firma.objects.create(
            nazov=data["nazov"],
            adresa=data["adresa"],
            kontakt_meno=data["kontaktna_osoba_meno"],
            kontakt_email=data["kontaktna_osoba_email"],
            kontakt_telefon=data["kontaktna_osoba_telefon"],
        )
        user.firma_id = firma.id
        user.save(update_fields=["firma_id"])

    return Response(
        {"status": "success", "user": get_user_data(user), "firma": CompanySerializer(firma).data},
        status=status.HTTP_200_OK,
    )
