import json
import secrets
from datetime import timedelta

import jwt
from django.conf import settings
from django.utils import timezone
from jwt import InvalidTokenError
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import RefreshToken

from apps.users.models import User

from ..models import AuthorizationCode, OAuthClient
from ..oauth_serializers import OAuthAuthorizeSerializer, OAuthClientCreateSerializer, OAuthTokenSerializer
from ..rate_limiting import oauth_rate_limit_check
from .helpers import get_tokens_for_user, get_user_data, verify_pkce


def _generate_unique_client_id():
    """Generate a unique client_id within the DB limit."""
    for _ in range(5):
        candidate = secrets.token_urlsafe(12)
        if not OAuthClient.objects.filter(client_id=candidate).exists():
            return candidate
    return secrets.token_urlsafe(16)


@api_view(["GET"])
@permission_classes([AllowAny])
def oauth_authorize(request):
    """Handle OAuth 2.0 authorization requests and issue auth codes."""
    if oauth_rate_limit_check(request, "authorize"):
        return Response(
            {
                "error": "rate_limit_exceeded",
                "error_description": "Too many authorization requests. Please try again later.",
            },
            status=429,
        )

    serializer = OAuthAuthorizeSerializer(data=request.GET)

    if not serializer.is_valid():
        return Response({"error": "invalid_request", "error_description": serializer.errors}, status=400)

    validated_data = serializer.validated_data
    client_id = validated_data["client_id"]
    redirect_uri = validated_data["redirect_uri"]
    response_type = validated_data["response_type"]
    state = validated_data.get("state", "")
    scope = validated_data.get("scope", "read profile")
    code_challenge = validated_data.get("code_challenge")
    code_challenge_method = validated_data.get("code_challenge_method") or "plain"

    try:
        client = OAuthClient.objects.get(client_id=client_id, is_active=True)
        allowed_uris = client.get_redirect_uris_list()
        if redirect_uri not in allowed_uris:
            return Response({"error": "invalid_request", "error_description": "Invalid redirect_uri"}, status=400)
    except OAuthClient.DoesNotExist:
        return Response({"error": "invalid_client", "error_description": "Invalid client"}, status=400)

    if client.is_public and not code_challenge:
        return Response(
            {"error": "invalid_request", "error_description": "PKCE code_challenge is required for public clients"},
            status=400,
        )

    if not request.user.is_authenticated:
        return Response(
            {"error": "authentication_required", "message": "User must be authenticated first"}, status=401
        )

    auth_code = AuthorizationCode.objects.create(
        code=AuthorizationCode.generate_code(),
        user=request.user,
        client=client,
        redirect_uri=redirect_uri,
        scope=scope,
        expires_at=timezone.now() + timedelta(minutes=10),
        code_challenge=code_challenge,
        code_challenge_method=code_challenge_method,
    )

    from urllib.parse import urlencode

    params = {"code": auth_code.code, "state": state}
    redirect_url = f"{redirect_uri}?{urlencode(params)}"

    return Response({"redirect_url": redirect_url, "code": auth_code.code, "state": state})


@api_view(["POST"])
@permission_classes([AllowAny])
def oauth_token(request):
    """Issue access/refresh tokens for supported OAuth grant types."""
    if oauth_rate_limit_check(request, "token"):
        return Response(
            {
                "error": "rate_limit_exceeded",
                "error_description": "Too many token requests. Please try again later.",
            },
            status=429,
        )

    serializer = OAuthTokenSerializer(data=request.data)

    if not serializer.is_valid():
        return Response({"error": "invalid_request", "error_description": serializer.errors}, status=400)

    validated_data = serializer.validated_data
    grant_type = validated_data["grant_type"]
    client_id = validated_data["client_id"]
    client_secret = validated_data.get("client_secret")
    client_assertion_type = validated_data.get("client_assertion_type")
    client_assertion = validated_data.get("client_assertion")
    code = validated_data.get("code")
    redirect_uri = validated_data.get("redirect_uri")
    refresh_token_str = validated_data.get("refresh_token")
    username = validated_data.get("username")
    password = validated_data.get("password")
    code_verifier = validated_data.get("code_verifier")

    try:
        client = OAuthClient.objects.get(client_id=client_id, is_active=True)
        client_assertion_valid = False

        assertion_requested = (
            client_assertion_type == "urn:ietf:params:oauth:client-assertion-type:jwt-bearer" and bool(client_assertion)
        )

        if assertion_requested:
            if client.is_public:
                return Response(
                    {"error": "unauthorized_client", "error_description": "Public clients cannot use private_key_jwt."},
                    status=400,
                )
            if not client.allow_private_jwt:
                return Response(
                    {"error": "unauthorized_client", "error_description": "client_assertion not allowed for this client."},
                    status=400,
                )
            if not client.public_key:
                return Response(
                    {"error": "invalid_client", "error_description": "Missing public key for client_assertion validation."},
                    status=401,
                )
            audience = request.build_absolute_uri(request.path)
            try:
                claims = jwt.decode(client_assertion, client.public_key, algorithms=["RS256"], audience=audience)
            except InvalidTokenError as exc:
                return Response(
                    {"error": "invalid_client", "error_description": f"Invalid client_assertion: {exc}"}, status=401
                )

            if claims.get("iss") != client_id or claims.get("sub") != client_id:
                return Response(
                    {"error": "invalid_client", "error_description": "client_assertion iss/sub mismatch."}, status=401
                )
            client_assertion_valid = True

        if not assertion_requested:
            if client.is_public:
                if client.client_secret and client_secret and client.client_secret != client_secret:
                    return Response({"error": "invalid_client"}, status=401)
            else:
                if not client_secret or client.client_secret != client_secret:
                    return Response({"error": "invalid_client"}, status=401)
        elif not client_assertion_valid:
            return Response({"error": "invalid_client"}, status=401)
    except OAuthClient.DoesNotExist:
        return Response({"error": "invalid_client"}, status=401)

    if grant_type == "authorization_code":
        try:
            auth_code = AuthorizationCode.objects.get(code=code, client=client, used=False)

            if not auth_code.is_valid():
                return Response({"error": "invalid_grant"}, status=400)

            if auth_code.redirect_uri != redirect_uri:
                return Response({"error": "invalid_grant"}, status=400)

        except AuthorizationCode.DoesNotExist:
            return Response({"error": "invalid_grant"}, status=400)

        if auth_code.code_challenge:
            if not code_verifier:
                return Response(
                    {"error": "invalid_request", "error_description": "Missing code_verifier"},
                    status=400,
                )
            if not verify_pkce(code_verifier, auth_code.code_challenge, auth_code.code_challenge_method):
                return Response({"error": "invalid_grant", "error_description": "Invalid code_verifier"}, status=400)

        auth_code.used = True
        auth_code.save()

        tokens = get_tokens_for_user(auth_code.user)

        return Response(
            {
                "access_token": tokens["access"],
                "token_type": "Bearer",
                "expires_in": 900,
                "refresh_token": tokens["refresh"],
                "scope": auth_code.scope,
            }
        )

    if grant_type == "refresh_token":
        if not refresh_token_str:
            return Response({"error": "invalid_request", "error_description": "Missing refresh_token"}, status=400)
        try:
            old = RefreshToken(refresh_token_str)
            user = User.objects.get(id=old["user_id"])
        except (TokenError, KeyError, User.DoesNotExist):
            return Response({"error": "invalid_grant"}, status=400)

        new_refresh = RefreshToken.for_user(user)
        new_access = new_refresh.access_token

        try:
            old.blacklist()
        except Exception:
            pass

        return Response(
            {
                "access_token": str(new_access),
                "token_type": "Bearer",
                "expires_in": 900,
                "refresh_token": str(new_refresh),
                "scope": "read profile",
            }
        )

    if grant_type == "password":
        if not client.allow_password_grant:
            return Response({"error": "unauthorized_client"}, status=400)
        if not username or not password:
            return Response(
                {"error": "invalid_request", "error_description": "Missing username/password"},
                status=400,
            )

        try:
            user = User.objects.get(email__iexact=username)
        except User.DoesNotExist:
            return Response({"error": "invalid_grant"}, status=400)

        if not user.check_password(password):
            return Response({"error": "invalid_grant"}, status=400)

        if user.rola != User.ROLE_FIRMA:
            return Response(
                {
                    "error": "invalid_role",
                    "error_description": "Firemný login je určený len pre kontá firiem.",
                },
                status=403,
            )

        if not user.is_active:
            return Response({"error": "inactive_user"}, status=403)

        tokens = get_tokens_for_user(user)
        access_lifetime = settings.SIMPLE_JWT.get("ACCESS_TOKEN_LIFETIME", timedelta(minutes=15))
        try:
            expires_in = int(access_lifetime.total_seconds())
        except AttributeError:
            expires_in = 900

        user_data = get_user_data(user)
        scope = client.scope or "read profile"

        return Response(
            {
                "status": "success",
                "created": False,
                "access_token": tokens["access"],
                "token_type": "Bearer",
                "expires_in": expires_in,
                "refresh_token": tokens["refresh"],
                "scope": scope,
                "user": user_data,
                "tokens": tokens,
            }
        )

    if grant_type == "client_credentials":
        if client.is_public:
            return Response(
                {
                    "error": "unauthorized_client",
                    "error_description": "Public clients cannot use client_credentials grant.",
                },
                status=400,
            )

        service_user = getattr(client, "service_user", None)
        if not service_user:
            return Response(
                {
                    "error": "invalid_client",
                    "error_description": "Service user is not configured for this client.",
                },
                status=401,
            )

        if not service_user.is_active:
            return Response({"error": "invalid_grant", "error_description": "Service user is inactive."}, status=403)

        if service_user.rola not in (User.ROLE_EXTERNY, User.ROLE_GARANT):
            return Response(
                {
                    "error": "invalid_role",
                    "error_description": "Service user must have role externy or garant.",
                },
                status=403,
            )

        tokens = get_tokens_for_user(service_user)
        access_lifetime = settings.SIMPLE_JWT.get("ACCESS_TOKEN_LIFETIME", timedelta(minutes=15))
        try:
            expires_in = int(access_lifetime.total_seconds())
        except AttributeError:
            expires_in = 900

        scope = client.scope or "read profile"

        return Response(
            {
                "access_token": tokens["access"],
                "token_type": "Bearer",
                "expires_in": expires_in,
                "refresh_token": tokens["refresh"],
                "scope": scope,
            }
        )

    return Response({"error": "unsupported_grant_type"}, status=400)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def oauth_userinfo(request):
    """Return user profile data for the authenticated access token."""
    user_data = get_user_data(request.user)
    return Response(user_data)


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def oauth_clients(request):
    """List or create OAuth clients (garant-only for write)."""
    user = request.user
    if request.method == "GET":
        if getattr(user, "rola", "") != User.ROLE_GARANT:
            return Response(
                {"detail": "Prístup je povolený len používateľom s rolou garant."},
                status=status.HTTP_403_FORBIDDEN,
            )
        clients = OAuthClient.objects.filter(is_active=True)
        data = []
        for client in clients:
            data.append(
                {
                    "client_id": client.client_id,
                    "name": client.name,
                    "redirect_uris": client.get_redirect_uris_list(),
                    "scope": client.scope,
                }
            )
        return Response(data)

    if getattr(user, "rola", "") != User.ROLE_GARANT:
        return Response(
            {"detail": "Prístup je povolený len používateľom s rolou garant."},
            status=status.HTTP_403_FORBIDDEN,
        )

    serializer = OAuthClientCreateSerializer(data=request.data, context={"request": request})
    serializer.is_valid(raise_exception=True)
    payload = serializer.validated_data

    # ensure client_id uniqueness (serializer already checks custom values)
    client_id = payload.get("client_id") or _generate_unique_client_id()
    if OAuthClient.objects.filter(client_id=client_id).exists():
        return Response({"client_id": ["client_id už existuje."]}, status=status.HTTP_400_BAD_REQUEST)

    is_public = payload.get("is_public", False)
    client_secret = payload.get("client_secret") or ""
    if not is_public and not client_secret:
        client_secret = secrets.token_urlsafe(32)
    if is_public:
        client_secret = ""

    service_user = payload.get("service_user") or user
    if service_user.rola not in (User.ROLE_EXTERNY, User.ROLE_GARANT):
        return Response(
            {"service_user": ["Service user musí mať rolu externy alebo garant."]},
            status=status.HTTP_400_BAD_REQUEST,
        )

    client = OAuthClient.objects.create(
        client_id=client_id,
        client_secret=client_secret,
        name=payload["name"],
        redirect_uris=json.dumps(payload["redirect_uris"]),
        scope=payload.get("scope") or "read write",
        is_public=is_public,
        allow_password_grant=payload.get("allow_password_grant", False),
        service_user=service_user,
        allow_private_jwt=payload.get("allow_private_jwt", False),
        public_key=payload.get("public_key"),
    )

    response_data = {
        "client_id": client.client_id,
        "client_secret": client_secret,
        "name": client.name,
        "redirect_uris": payload["redirect_uris"],
        "scope": client.scope,
        "is_public": client.is_public,
        "allow_password_grant": client.allow_password_grant,
        "allow_private_jwt": client.allow_private_jwt,
        "service_user": {"id": service_user.id, "email": service_user.email},
    }
    return Response(response_data, status=status.HTTP_201_CREATED)


@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def oauth_client_detail(request, client_id: str):
    """Deactivate an OAuth client by client_id (garant-only)."""
    user = request.user
    if getattr(user, "rola", "") != User.ROLE_GARANT:
        return Response(
            {"detail": "Prístup je povolený len používateľom s rolou garant."},
            status=status.HTTP_403_FORBIDDEN,
        )

    try:
        client = OAuthClient.objects.get(client_id=client_id, is_active=True)
    except OAuthClient.DoesNotExist:
        return Response({"detail": "OAuth klient nenájdený."}, status=status.HTTP_404_NOT_FOUND)

    client.is_active = False
    client.save(update_fields=["is_active"])
    return Response(status=status.HTTP_204_NO_CONTENT)
"""OAuth 2.0 server endpoints for authorization, token, and client management."""
