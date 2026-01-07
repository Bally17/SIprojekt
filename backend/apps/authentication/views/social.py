import requests
from django.conf import settings
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi

from apps.users.models import User

from ..serializers import GoogleAuthSerializer
from .helpers import get_tokens_for_user, get_user_data


def create_or_update_oauth_user(email, first_name, last_name, avatar, provider):
    """Create or update user from OAuth provider"""
    try:
        user = User.objects.get(email=email)
        if first_name and not user.meno:
            user.meno = first_name
        if last_name and not user.priezvisko:
            user.priezvisko = last_name
        user.save()
        created = False
    except User.DoesNotExist:
        user = User.objects.create_user(
            email=email,
            password=None,
            rola=User.ROLE_STUDENT,
            meno=first_name,
            priezvisko=last_name,
            musi_zmenit_heslo=False,
        )
        created = True

    return user, created


def _fetch_google_user_data(access_token):
    try:
        google_response = requests.get(
            "https://www.googleapis.com/oauth2/v3/userinfo",
            headers={"Authorization": f"Bearer {access_token}"},
            timeout=10,
        )
    except requests.RequestException:
        return Response({"error": "Failed to verify Google token"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    if google_response.status_code != 200:
        return Response({"error": "Invalid Google token"}, status=status.HTTP_400_BAD_REQUEST)

    google_data = google_response.json()
    email = google_data.get("email")
    if not email:
        return Response({"error": "Email not provided by Google"}, status=status.HTTP_400_BAD_REQUEST)

    return {
        "email": email,
        "first_name": google_data.get("given_name", ""),
        "last_name": google_data.get("family_name", ""),
        "avatar": google_data.get("picture"),
    }


def _fetch_github_user_data(access_token):
    try:
        user_response = requests.get(
            "https://api.github.com/user", headers={"Authorization": f"Bearer {access_token}"}, timeout=10
        )
    except requests.RequestException:
        return Response({"error": "Failed to verify GitHub token"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    if user_response.status_code != 200:
        return Response({"error": "Failed to get user info from GitHub"}, status=status.HTTP_400_BAD_REQUEST)

    user_data = user_response.json()

    try:
        email_response = requests.get(
            "https://api.github.com/user/emails", headers={"Authorization": f"Bearer {access_token}"}, timeout=10
        )
    except requests.RequestException:
        return Response({"error": "Failed to verify GitHub token"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    if email_response.status_code == 200:
        emails = email_response.json()
        primary_email = next((email["email"] for email in emails if email.get("primary")), None)
        email = primary_email or user_data.get("email")
    else:
        email = user_data.get("email")

    if not email:
        return Response({"error": "Email not provided by GitHub"}, status=status.HTTP_400_BAD_REQUEST)

    full_name = user_data.get("name", "") or ""
    first_name = full_name.split(" ")[0] if full_name else ""
    last_name = " ".join(full_name.split(" ")[1:]) if full_name else ""
    avatar = user_data.get("avatar_url")

    return {
        "email": email,
        "first_name": first_name,
        "last_name": last_name,
        "avatar": avatar,
    }


def _exchange_github_code_for_token(code, code_verifier=None):
    try:
        token_data = {
            "client_id": settings.SOCIALACCOUNT_PROVIDERS["github"]["APP"]["client_id"],
            "client_secret": settings.SOCIALACCOUNT_PROVIDERS["github"]["APP"]["secret"],
            "code": code,
            "redirect_uri": "http://localhost:8000/api/auth/github/callback/",
        }

        if code_verifier:
            token_data["code_verifier"] = code_verifier

        token_response = requests.post(
            "https://github.com/login/oauth/access_token",
            headers={"Accept": "application/json", "Content-Type": "application/x-www-form-urlencoded"},
            data=token_data,
            timeout=10,
        )
    except requests.RequestException:
        return Response({"error": "Failed to exchange code for token"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    if token_response.status_code != 200:
        return Response(
            {"error": f"GitHub returned status {token_response.status_code}"}, status=status.HTTP_400_BAD_REQUEST
        )

    token_json = token_response.json()
    access_token = token_json.get("access_token")
    if not access_token:
        error_msg = token_json.get("error_description", "Failed to get access token from GitHub")
        return Response({"error": error_msg}, status=status.HTTP_400_BAD_REQUEST)

    return access_token


def _register_company_from_oauth(request, email, first_name, last_name):
    requested_email = request.data.get("email")
    if requested_email and requested_email.lower() != email.lower():
        return Response({"error": "Email from provider does not match request."}, status=status.HTTP_400_BAD_REQUEST)

    try:
        user = User.objects.get(email=email)
        if user.rola != User.ROLE_FIRMA:
            return Response({"error": "User exists with different role."}, status=status.HTTP_400_BAD_REQUEST)
        created = False
    except User.DoesNotExist:
        contact_name = request.data.get("kontaktna_osoba_meno")
        meno = None
        priezvisko = None
        if contact_name:
            meno_parts = contact_name.split(" ", 1)
            meno = meno_parts[0] if meno_parts else None
            priezvisko = meno_parts[1] if len(meno_parts) > 1 else None

        user = User(
            email=email,
            rola=User.ROLE_FIRMA,
            meno=meno,
            priezvisko=priezvisko,
            telefon=request.data.get("kontaktna_osoba_telefon") or None,
            adresa=request.data.get("adresa") or None,
            alternativny_email=request.data.get("kontaktna_osoba_email") or None,
            aktivny=False,
            email_overeny=True,
            musi_zmenit_heslo=False,
        )
        user.save()
        created = True

    tokens = get_tokens_for_user(user)
    user_data = get_user_data(user)
    status_code = status.HTTP_201_CREATED if created else status.HTTP_200_OK

    return Response(
        {
            "status": "success",
            "created": created,
            "user": user_data,
            "tokens": tokens,
        },
        status=status_code,
    )


def handle_github_access_token(access_token):
    """Process GitHub access token"""
    try:
        user_response = requests.get(
            "https://api.github.com/user", headers={"Authorization": f"Bearer {access_token}"}, timeout=10
        )

        if user_response.status_code != 200:
            return Response({"error": "Failed to get user info from GitHub"}, status=status.HTTP_400_BAD_REQUEST)

        user_data = user_response.json()

        email_response = requests.get(
            "https://api.github.com/user/emails", headers={"Authorization": f"Bearer {access_token}"}, timeout=10
        )

        if email_response.status_code == 200:
            emails = email_response.json()
            primary_email = next((email["email"] for email in emails if email["primary"]), None)
            email = primary_email or user_data.get("email")
        else:
            email = user_data.get("email")

        if not email:
            return Response({"error": "Email not provided by GitHub"}, status=status.HTTP_400_BAD_REQUEST)

        first_name = user_data.get("name", "").split(" ")[0] if user_data.get("name") else ""
        last_name = " ".join(user_data.get("name", "").split(" ")[1:]) if user_data.get("name") else ""
        avatar = user_data.get("avatar_url")

        user, created = create_or_update_oauth_user(
            email=email, first_name=first_name, last_name=last_name, avatar=avatar, provider="github"
        )

        tokens = get_tokens_for_user(user)
        user_serialized = get_user_data(user)

        response_data = {
            "status": "success",
            "created": created,
            "user": user_serialized,
            "tokens": tokens,
        }

        return Response(response_data, status=status.HTTP_200_OK)

    except requests.RequestException:
        return Response({"error": "Failed to verify GitHub token"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


def handle_github_code(code, code_verifier=None):
    """Exchange GitHub code for access token (PKCE flow)"""
    try:
        token_data = {
            "client_id": settings.SOCIALACCOUNT_PROVIDERS["github"]["APP"]["client_id"],
            "client_secret": settings.SOCIALACCOUNT_PROVIDERS["github"]["APP"]["secret"],
            "code": code,
            "redirect_uri": "http://localhost:8000/api/auth/github/callback/",
        }

        if code_verifier:
            token_data["code_verifier"] = code_verifier

        token_response = requests.post(
            "https://github.com/login/oauth/access_token",
            headers={"Accept": "application/json", "Content-Type": "application/x-www-form-urlencoded"},
            data=token_data,
            timeout=10,
        )

        if token_response.status_code != 200:
            return Response(
                {"error": f"GitHub returned status {token_response.status_code}"}, status=status.HTTP_400_BAD_REQUEST
            )

        token_json = token_response.json()
        access_token = token_json.get("access_token")

        if not access_token:
            error_msg = token_json.get("error_description", "Failed to get access token from GitHub")
            return Response({"error": error_msg}, status=status.HTTP_400_BAD_REQUEST)

        return handle_github_access_token(access_token)

    except requests.RequestException:
        return Response({"error": "Failed to exchange code for token"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(["POST"])
@permission_classes([AllowAny])
def google_auth(request):
    """Google OAuth authentication"""
    serializer = GoogleAuthSerializer(data=request.data)

    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    access_token = serializer.validated_data["access_token"]

    google_data = _fetch_google_user_data(access_token)
    if isinstance(google_data, Response):
        return google_data

    user, created = create_or_update_oauth_user(
        email=google_data["email"],
        first_name=google_data.get("first_name", ""),
        last_name=google_data.get("last_name", ""),
        avatar=google_data.get("avatar"),
        provider="google",
    )

    tokens = get_tokens_for_user(user)
    user_data = get_user_data(user)

    response_data = {
        "status": "success",
        "created": created,
        "user": user_data,
        "tokens": tokens,
    }

    return Response(response_data, status=status.HTTP_200_OK)


@api_view(["POST"])
@permission_classes([AllowAny])
def github_auth(request):
    """GitHub OAuth authentication - podpora pre PKCE a access_token"""
    if "access_token" in request.data:
        access_token = request.data["access_token"]
        return handle_github_access_token(access_token)

    if "code" in request.data:
        code = request.data["code"]
        code_verifier = request.data.get("code_verifier")
        return handle_github_code(code, code_verifier)

    return Response({"error": 'Must provide either "code" or "access_token"'}, status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET"])
@permission_classes([AllowAny])
def github_callback(request):
    """GitHub OAuth callback handler"""
    code = request.GET.get("code")

    if not code:
        return Response({"error": "No code provided"}, status=status.HTTP_400_BAD_REQUEST)

    try:
        token_response = requests.post(
            "https://github.com/login/oauth/access_token",
            headers={"Accept": "application/json"},
            data={
                "client_id": settings.SOCIALACCOUNT_PROVIDERS["github"]["APP"]["client_id"],
                "client_secret": settings.SOCIALACCOUNT_PROVIDERS["github"]["APP"]["secret"],
                "code": code,
                "redirect_uri": "http://localhost:8000/api/auth/github/callback/",
            },
            timeout=10,
        )

        token_data = token_response.json()
        access_token = token_data.get("access_token")

        if not access_token:
            return Response({"error": "Failed to get access token from GitHub"}, status=status.HTTP_400_BAD_REQUEST)

        user_response = requests.get(
            "https://api.github.com/user", headers={"Authorization": f"Bearer {access_token}"}, timeout=10
        )

        user_data = user_response.json()

        email_response = requests.get(
            "https://api.github.com/user/emails", headers={"Authorization": f"Bearer {access_token}"}, timeout=10
        )

        emails = email_response.json()
        primary_email = next((email["email"] for email in emails if email.get("primary")), None)

        email = primary_email or user_data.get("email")
        first_name = user_data.get("name", "").split(" ")[0] if user_data.get("name") else ""
        last_name = " ".join(user_data.get("name", "").split(" ")[1:]) if user_data.get("name") else ""
        avatar = user_data.get("avatar_url")

        if not email:
            return Response({"error": "Email not provided by GitHub"}, status=status.HTTP_400_BAD_REQUEST)

        user, created = create_or_update_oauth_user(
            email=email, first_name=first_name, last_name=last_name, avatar=avatar, provider="github"
        )

        tokens = get_tokens_for_user(user)
        user_serialized = get_user_data(user)

        response_data = {
            "status": "success",
            "created": created,
            "user": user_serialized,
            "tokens": tokens,
        }

        return Response(response_data, status=status.HTTP_200_OK)

    except requests.RequestException:
        return Response({"error": "Failed to verify GitHub token"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@swagger_auto_schema(
    methods=["post"],
    operation_summary="Company registration via Google OAuth",
    operation_description=(
        "Registers a company user using a Google access token. "
        "Creates an inactive company account that must complete profile data later."
    ),
    request_body=openapi.Schema(
        type=openapi.TYPE_OBJECT,
        required=["access_token"],
        properties={
            "access_token": openapi.Schema(type=openapi.TYPE_STRING),
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

    access_token = serializer.validated_data["access_token"]
    google_data = _fetch_google_user_data(access_token)
    if isinstance(google_data, Response):
        return google_data

    return _register_company_from_oauth(
        request,
        google_data["email"],
        google_data.get("first_name", ""),
        google_data.get("last_name", ""),
    )


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
    if "access_token" in request.data:
        access_token = request.data["access_token"]
    elif "code" in request.data:
        access_token = _exchange_github_code_for_token(request.data["code"], request.data.get("code_verifier"))
        if isinstance(access_token, Response):
            return access_token
    else:
        return Response({"error": 'Must provide either "code" or "access_token"'}, status=status.HTTP_400_BAD_REQUEST)

    github_data = _fetch_github_user_data(access_token)
    if isinstance(github_data, Response):
        return github_data

    return _register_company_from_oauth(
        request,
        github_data["email"],
        github_data.get("first_name", ""),
        github_data.get("last_name", ""),
    )
