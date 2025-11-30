from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import RefreshToken

from ..serializers import LoginSerializer
from .helpers import get_tokens_for_user, get_user_data
from apps.users.models import User


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


@api_view(["POST"])
@permission_classes([AllowAny])
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


@api_view(["POST"])
@permission_classes([AllowAny])
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


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def profile(request):
    """Get user profile"""
    user_data = get_user_data(request.user)
    return Response({"user": user_data})


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
