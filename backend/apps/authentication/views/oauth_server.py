import json

from drf_yasg import openapi
from drf_yasg.utils import swagger_auto_schema
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from apps.authentication.serializers.oauth import (
    OAuthAuthorizeSerializer,
    OAuthClientCreateSerializer,
    OAuthTokenSerializer,
)
from apps.users.models import User
from common.auth.context import get_user_data
from common.security.rate_limit import oauth_rate_limit_check
from services.auth.oauth import authorization
from services.auth.oauth import clients
from services.auth.oauth import token_flow


@api_view(["GET"])
@permission_classes([AllowAny])
def oauth_authorize(request):
    """Handle OAuth 2.0 authorization requests and issue auth codes."""
    client_id = request.GET.get("client_id")
    ip = request.META.get("REMOTE_ADDR", "unknown")
    if oauth_rate_limit_check(client_id, ip, "authorize"):
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

    data = serializer.validated_data
    result = authorization.authorize_request(
        user=request.user,
        client_id=data["client_id"],
        redirect_uri=data["redirect_uri"],
        response_type=data["response_type"],
        scope=data.get("scope", "read profile"),
        state=data.get("state", ""),
        code_challenge=data.get("code_challenge"),
        code_challenge_method=data.get("code_challenge_method") or "plain",
    )
    if not result["ok"]:
        return Response(result["data"], status=result["status"])

    return Response(result["data"])


@api_view(["POST"])
@permission_classes([AllowAny])
def oauth_token(request):
    """Issue access/refresh tokens for supported OAuth grant types."""
    client_id = request.data.get("client_id")
    ip = request.META.get("REMOTE_ADDR", "unknown")
    if oauth_rate_limit_check(client_id, ip, "token"):
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

    audience = request.build_absolute_uri(request.path)
    result = token_flow.handle_token_request(payload=serializer.validated_data, audience=audience)
    if not result["ok"]:
        return Response(result["data"], status=result["status"])

    return Response(result["data"])


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def oauth_userinfo(request):
    """Return user profile data for the authenticated access token."""
    return Response(get_user_data(request.user))


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def oauth_clients(request):
    """List or create OAuth clients (garant-only for write)."""
    user = request.user
    if request.method == "GET":
        result = clients.list_oauth_clients(user)
        if not result["ok"]:
            return Response(result["data"], status=result["status"])
        return Response(result["data"])

    serializer = OAuthClientCreateSerializer(data=request.data, context={"request": request})
    serializer.is_valid(raise_exception=True)
    payload = serializer.validated_data
    payload = {
        **payload,
        "redirect_uris_json": json.dumps(payload.get("redirect_uris", [])),
    }

    result = clients.create_oauth_client(user, payload)
    if not result["ok"]:
        return Response(result["data"], status=result["status"])

    return Response(result["data"], status=result["status"])


@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def oauth_client_detail(request, client_id: str):
    """Deactivate an OAuth client by client_id (garant-only)."""
    result = clients.deactivate_oauth_client(request.user, client_id)
    if not result["ok"]:
        return Response(result["data"], status=result["status"])

    return Response(status=result["status"])
