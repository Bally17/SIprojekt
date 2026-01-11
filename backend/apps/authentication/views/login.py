from drf_yasg import openapi
from drf_yasg.utils import swagger_auto_schema
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes, throttle_classes, authentication_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle

from apps.authentication.serializers import LoginSerializer
from common.auth.jwt_auth import AllowInactiveJWTAuthentication
from apps.users.models import User
from services.auth.login import (
    login_user,
    logout_refresh_token,
    missing_profile_fields_payload,
    profile_payload,
)


@api_view(["POST"])
@permission_classes([AllowAny])
@throttle_classes([ScopedRateThrottle])
def login_view(request):
    """Authenticate student accounts via email/password login."""
    serializer = LoginSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    user = serializer.validated_data["user"]
    result = login_user(
        user,
        User.ROLE_STUDENT,
        "Tento login je určený len pre študentov. Použite firemný login.",
    )
    if not result["ok"]:
        error = result["error"]
        if error["code"] == "invalid_role":
            return Response(error, status=status.HTTP_403_FORBIDDEN)
        if error["code"] == "inactive_user":
            return Response({"error": "inactive_user"}, status=status.HTTP_403_FORBIDDEN)
        return Response({"error": "login_failed"}, status=status.HTTP_400_BAD_REQUEST)

    return Response(result["data"], status=status.HTTP_200_OK)


login_view.throttle_scope = "login"


@api_view(["POST"])
@permission_classes([AllowAny])
@throttle_classes([ScopedRateThrottle])
def company_login_view(request):
    """Authenticate company accounts via email/password login."""
    serializer = LoginSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    user = serializer.validated_data["user"]
    result = login_user(
        user,
        User.ROLE_FIRMA,
        "Firemný login je určený len pre kontá firiem.",
    )
    if not result["ok"]:
        error = result["error"]
        if error["code"] == "invalid_role":
            return Response(error, status=status.HTTP_403_FORBIDDEN)
        if error["code"] == "inactive_user":
            return Response({"error": "inactive_user"}, status=status.HTTP_403_FORBIDDEN)
        return Response({"error": "login_failed"}, status=status.HTTP_400_BAD_REQUEST)

    return Response(result["data"], status=status.HTTP_200_OK)


company_login_view.throttle_scope = "login"


@api_view(["POST"])
@permission_classes([AllowAny])
@throttle_classes([ScopedRateThrottle])
def garant_login_view(request):
    """Authenticate garant accounts via email/password login."""
    serializer = LoginSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    user = serializer.validated_data["user"]
    result = login_user(
        user,
        User.ROLE_GARANT,
        "Garant login je určený len pre kontá garantov.",
    )
    if not result["ok"]:
        error = result["error"]
        if error["code"] == "invalid_role":
            return Response(error, status=status.HTTP_403_FORBIDDEN)
        if error["code"] == "inactive_user":
            return Response({"error": "inactive_user"}, status=status.HTTP_403_FORBIDDEN)
        return Response({"error": "login_failed"}, status=status.HTTP_400_BAD_REQUEST)

    return Response(result["data"], status=status.HTTP_200_OK)


garant_login_view.throttle_scope = "login"


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def profile(request):
    """Return profile data for the authenticated user."""
    return Response(profile_payload(request.user))


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
    """Return profile data with missing required fields for completion flows."""
    return Response(missing_profile_fields_payload(request.user))


@api_view(["POST"])
@permission_classes([AllowAny])
def logout_view(request):
    """Invalidate a refresh token and return a logout confirmation."""
    payload = logout_refresh_token(request.data.get("refresh_token"))
    return Response(payload, status=status.HTTP_200_OK)
