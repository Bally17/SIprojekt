from rest_framework import status
from rest_framework.decorators import api_view, permission_classes, throttle_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle

from apps.authentication.serializers import (
    ChangePasswordSerializer,
    PasswordResetConfirmSerializer,
    PasswordResetRequestSerializer,
)
from services.auth.password_reset import (
    change_user_password,
    confirm_password_reset,
    request_password_reset,
)


@api_view(["POST"])
@permission_classes([AllowAny])
@throttle_classes([ScopedRateThrottle])
def password_reset_request(request):
    """Send a password reset link if the user exists."""
    serializer = PasswordResetRequestSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    result = request_password_reset(serializer.validated_data["email"])
    return Response(result["data"], status=result["status"])


password_reset_request.throttle_scope = "password_reset"


@api_view(["POST"])
@permission_classes([AllowAny])
@throttle_classes([ScopedRateThrottle])
def password_reset_confirm(request):
    """Validate reset token and set a new password."""
    serializer = PasswordResetConfirmSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    result = confirm_password_reset(
        serializer.validated_data["token"],
        serializer.validated_data["new_password"],
    )
    return Response(result["data"], status=result["status"])


password_reset_confirm.throttle_scope = "password_reset"


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def change_password(request):
    """Change password for the authenticated user."""
    serializer = ChangePasswordSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    result = change_user_password(
        request.user,
        serializer.validated_data["current_password"],
        serializer.validated_data["new_password"],
    )
    return Response(result["data"], status=result["status"])


__all__ = [
    "password_reset_request",
    "password_reset_confirm",
    "change_password",
]
