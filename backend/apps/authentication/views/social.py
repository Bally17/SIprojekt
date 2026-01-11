from django.shortcuts import redirect
from drf_yasg import openapi
from drf_yasg.utils import swagger_auto_schema
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from ..serializers import (
    GitHubAuthSerializer,
    GitHubCompanySerializer,
    GoogleAuthSerializer,
)
from services.auth.oauth.github import (
    github_authenticate,
    github_callback as github_callback_service,
    github_company_register as github_company_register_service,
)
from services.auth.oauth.google import google_company_register as google_company_register_service, google_login


@api_view(["POST"])
@permission_classes([AllowAny])
def google_auth(request):
    """Authenticate a user via Google OAuth (code + PKCE)."""
    serializer = GoogleAuthSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    result = google_login(
        code=serializer.validated_data["code"],
        code_verifier=serializer.validated_data["code_verifier"],
        redirect_uri=serializer.validated_data["redirect_uri"],
    )
    return Response(result["data"], status=result["status"])


@api_view(["POST"])
@permission_classes([AllowAny])
def github_auth(request):
    """Authenticate a user via GitHub OAuth (PKCE or access token)."""
    serializer = GitHubAuthSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    result = github_authenticate(serializer.validated_data)
    return Response(result["data"], status=result["status"])


@api_view(["GET"])
@permission_classes([AllowAny])
def github_callback(request):
    """Handle GitHub OAuth callback and return a redirect to the frontend."""
    result = github_callback_service(
        code=request.GET.get("code"),
        state=request.GET.get("state"),
        metadata=request.GET.dict(),
    )
    return redirect(result["data"]["redirect_url"])


@swagger_auto_schema(
    methods=["post"],
    operation_summary="Company registration via Google OAuth",
    operation_description=(
        "Registers a company user using Google OAuth (code + PKCE). "
        "Creates an inactive company account that must complete profile data later."
    ),
    request_body=openapi.Schema(
        type=openapi.TYPE_OBJECT,
        required=["code", "code_verifier", "redirect_uri"],
        properties={
            "code": openapi.Schema(type=openapi.TYPE_STRING),
            "code_verifier": openapi.Schema(type=openapi.TYPE_STRING),
            "redirect_uri": openapi.Schema(type=openapi.TYPE_STRING),
            "email": openapi.Schema(type=openapi.TYPE_STRING, description="Optional; must match provider email."),
            "kontaktna_osoba_meno": openapi.Schema(type=openapi.TYPE_STRING),
            "kontaktna_osoba_email": openapi.Schema(type=openapi.TYPE_STRING),
            "kontaktna_osoba_telefon": openapi.Schema(type=openapi.TYPE_STRING),
            "adresa": openapi.Schema(type=openapi.TYPE_STRING),
        },
    ),
    responses={
        201: openapi.Response(description="Company account created."),
        200: openapi.Response(description="Existing company account returned."),
        400: "Validation error",
    },
)
@api_view(["POST"])
@permission_classes([AllowAny])
def google_company_register(request):
    serializer = GoogleAuthSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    result = google_company_register_service(
        code=serializer.validated_data["code"],
        code_verifier=serializer.validated_data["code_verifier"],
        redirect_uri=serializer.validated_data["redirect_uri"],
        requested_email=request.data.get("email"),
        kontaktna_osoba_meno=request.data.get("kontaktna_osoba_meno"),
        kontaktna_osoba_email=request.data.get("kontaktna_osoba_email"),
        kontaktna_osoba_telefon=request.data.get("kontaktna_osoba_telefon"),
        adresa=request.data.get("adresa"),
    )
    return Response(result["data"], status=result["status"])


@swagger_auto_schema(
    methods=["post"],
    operation_summary="Company registration via GitHub OAuth",
    operation_description=(
        "Registers a company user using GitHub OAuth. "
        "Provide either access_token or code (+ optional code_verifier). "
        "Creates an inactive company account that must complete profile data later."
    ),
    request_body=openapi.Schema(
        type=openapi.TYPE_OBJECT,
        properties={
            "access_token": openapi.Schema(type=openapi.TYPE_STRING),
            "code": openapi.Schema(type=openapi.TYPE_STRING),
            "code_verifier": openapi.Schema(type=openapi.TYPE_STRING),
            "redirect_uri": openapi.Schema(type=openapi.TYPE_STRING),
            "email": openapi.Schema(type=openapi.TYPE_STRING, description="Optional; must match provider email."),
            "kontaktna_osoba_meno": openapi.Schema(type=openapi.TYPE_STRING),
            "kontaktna_osoba_email": openapi.Schema(type=openapi.TYPE_STRING),
            "kontaktna_osoba_telefon": openapi.Schema(type=openapi.TYPE_STRING),
            "adresa": openapi.Schema(type=openapi.TYPE_STRING),
        },
    ),
    responses={
        201: openapi.Response(description="Company account created."),
        200: openapi.Response(description="Existing company account returned."),
        400: "Validation error",
    },
)
@api_view(["POST"])
@permission_classes([AllowAny])
def github_company_register(request):
    serializer = GitHubCompanySerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    result = github_company_register_service(
        access_token=serializer.validated_data.get("access_token"),
        code=serializer.validated_data.get("code"),
        code_verifier=serializer.validated_data.get("code_verifier"),
        redirect_uri=serializer.validated_data.get("redirect_uri"),
        requested_email=serializer.validated_data.get("email"),
        kontaktna_osoba_meno=serializer.validated_data.get("kontaktna_osoba_meno"),
        kontaktna_osoba_email=serializer.validated_data.get("kontaktna_osoba_email"),
        kontaktna_osoba_telefon=serializer.validated_data.get("kontaktna_osoba_telefon"),
        adresa=serializer.validated_data.get("adresa"),
    )
    return Response(result["data"], status=result["status"])


"""OAuth social login and company registration endpoints."""
