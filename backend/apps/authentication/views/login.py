from rest_framework import status
from rest_framework.decorators import api_view, permission_classes, throttle_classes, authentication_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import RefreshToken

from ..serializers import LoginSerializer
from ..utils import AllowInactiveJWTAuthentication
from .helpers import get_tokens_for_user, get_user_data
from apps.users.models import User
from apps.companies.models import Firma


def _build_login_response(user):
    """Generate unified login response for username/password flows."""
    tokens = get_tokens_for_user(user)
    user_data = get_user_data(user)
    return {
        "status": "success",
        "created": False,
        "user": user_data,
        "tokens": tokens,
    }


@api_view(["POST"])
@permission_classes([AllowAny])
@throttle_classes([ScopedRateThrottle])
def login_view(request):
    """Normal email/password login for students"""
    serializer = LoginSerializer(data=request.data)

    if serializer.is_valid():
        user = serializer.validated_data["user"]

        if user.rola != User.ROLE_STUDENT:
            return Response(
                {
                    "error": "invalid_role",
                    "message": "Tento login je určený len pre študentov. Použite firemný login.",
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        return Response(_build_login_response(user), status=status.HTTP_200_OK)

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
login_view.throttle_scope = "login"


@api_view(["POST"])
@permission_classes([AllowAny])
@throttle_classes([ScopedRateThrottle])
def company_login_view(request):
    """Email/password login for companies"""
    serializer = LoginSerializer(data=request.data)

    if serializer.is_valid():
        user = serializer.validated_data["user"]

        if user.rola != User.ROLE_FIRMA:
            return Response(
                {
                    "error": "invalid_role",
                    "message": "Firemný login je určený len pre kontá firiem.",
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        if not user.is_active:
            return Response({"error": "inactive_user"}, status=status.HTTP_403_FORBIDDEN)

        return Response(_build_login_response(user), status=status.HTTP_200_OK)

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
company_login_view.throttle_scope = "login"


@api_view(["POST"])
@permission_classes([AllowAny])
@throttle_classes([ScopedRateThrottle])
def garant_login_view(request):
    """Email/password login for garants"""
    serializer = LoginSerializer(data=request.data)

    if serializer.is_valid():
        user = serializer.validated_data["user"]

        if user.rola != User.ROLE_GARANT:
            return Response(
                {
                    "error": "invalid_role",
                    "message": "Garant login je určený len pre kontá garantov.",
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        if not user.is_active:
            return Response({"error": "inactive_user"}, status=status.HTTP_403_FORBIDDEN)

        return Response(_build_login_response(user), status=status.HTTP_200_OK)

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
garant_login_view.throttle_scope = "login"


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def profile(request):
    """Get user profile"""
    user_data = get_user_data(request.user)
    return Response({"user": user_data})


@swagger_auto_schema(
    methods=["get"],
    operation_summary="Get user profile with missing required fields",
    operation_description=(
        "Returns user data plus list of missing required fields. "
        "For companies, checks company/contact fields; for others, checks basic profile fields."
    ),
    responses={
        200: openapi.Response(
            description="User data with missing_required_fields list.",
            schema=openapi.Schema(
                type=openapi.TYPE_OBJECT,
                properties={
                    "user": openapi.Schema(type=openapi.TYPE_OBJECT),
                    "missing_required_fields": openapi.Schema(
                        type=openapi.TYPE_ARRAY, items=openapi.Items(type=openapi.TYPE_STRING)
                    ),
                },
            ),
        ),
        401: "Unauthorized",
    },
)
@api_view(["GET"])
@authentication_classes([AllowInactiveJWTAuthentication])
@permission_classes([IsAuthenticated])
def profile_missing_fields(request):
    """
    Get user profile with info about missing required fields we need to collect.
    Useful after OAuth (GitHub/Google) to prompt user to complete data.
    """
    user = request.user
    if user.rola == User.ROLE_FIRMA:
        required_fields = [
            "nazov",
            "kontaktna_osoba_meno",
            "kontaktna_osoba_email",
            "kontaktna_osoba_telefon",
            "adresa",
        ]
        firma = None
        if user.firma_id:
            firma = Firma.objects.filter(id=user.firma_id).first()

        missing = []
        if not (firma and firma.nazov):
            missing.append("nazov")

        kontaktne_meno = " ".join(part for part in [user.meno, user.priezvisko] if part).strip()
        if not kontaktne_meno and not (firma and firma.kontakt_meno):
            missing.append("kontaktna_osoba_meno")

        if not (user.alternativny_email or (firma and firma.kontakt_email)):
            missing.append("kontaktna_osoba_email")

        if not (user.telefon or (firma and firma.kontakt_telefon)):
            missing.append("kontaktna_osoba_telefon")

        if not (user.adresa or (firma and firma.adresa)):
            missing.append("adresa")

        return Response({"user": get_user_data(user), "missing_required_fields": missing})

    required_fields = ["meno", "priezvisko", "telefon", "adresa"]
    missing = [field for field in required_fields if not getattr(user, field)]
    return Response({"user": get_user_data(user), "missing_required_fields": missing})


@api_view(["POST"])
@permission_classes([AllowAny])
def logout_view(request):
    """
    Logout user:
    - očakáva 'refresh_token' v body
    - refresh token sa zneplatní (blacklist)
    """
    rt = request.data.get("refresh_token")
    if rt:
        try:
            token = RefreshToken(rt)
            token.blacklist()
        except TokenError:
            pass
        except Exception:
            pass
    return Response({"status": "success", "detail": "logged out"}, status=status.HTTP_200_OK)
