from django.conf import settings
from django.core.signing import BadSignature, SignatureExpired
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes, throttle_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle

from apps.users.models import User

from ..serializers import (
    ChangePasswordSerializer,
    PasswordResetConfirmSerializer,
    PasswordResetRequestSerializer,
)
from ..utils import send_password_reset_email
from .helpers import (
    PASSWORD_RESET_TOKEN_MAX_AGE,
    get_user_data,
    password_reset_signer,
)


@api_view(["POST"])
@permission_classes([AllowAny])
@throttle_classes([ScopedRateThrottle])
def password_reset_request(request):
    """Prijme email a odošle reset link, ak používateľ existuje."""
    serializer = PasswordResetRequestSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    email = serializer.validated_data["email"].lower()
    user = User.objects.filter(email__iexact=email).first()

    if user:
        token = password_reset_signer.sign(user.email)
        reset_link = f"{settings.FRONTEND_URL}/auth/reset-password/{token}/"
        send_password_reset_email(user, reset_link)

    return Response(
        {"message": "Ak účet existuje, poslali sme resetovací odkaz na email."},
        status=status.HTTP_200_OK,
    )
password_reset_request.throttle_scope = "password_reset"


@api_view(["POST"])
@permission_classes([AllowAny])
@throttle_classes([ScopedRateThrottle])
def password_reset_confirm(request):
    """Overí token a nastaví nové heslo."""
    serializer = PasswordResetConfirmSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    token = serializer.validated_data["token"]

    try:
        email = password_reset_signer.unsign(token, max_age=PASSWORD_RESET_TOKEN_MAX_AGE)
    except SignatureExpired:
        return Response({"error": "Resetovací odkaz expiroval."}, status=status.HTTP_400_BAD_REQUEST)
    except BadSignature:
        return Response({"error": "Resetovací odkaz je neplatný."}, status=status.HTTP_400_BAD_REQUEST)

    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        return Response({"error": "Resetovací odkaz je neplatný."}, status=status.HTTP_400_BAD_REQUEST)

    new_password = serializer.validated_data["new_password"]
    user.set_password(new_password)
    user.musi_zmenit_heslo = False
    user.save()

    return Response({"message": "Heslo bolo úspešne zresetované."}, status=status.HTTP_200_OK)
password_reset_confirm.throttle_scope = "password_reset"


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def change_password(request):
    """Zmena hesla prihláseného používateľa"""
    serializer = ChangePasswordSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    user = request.user
    if not user.check_password(serializer.validated_data["current_password"]):
        return Response({"error": "Aktuálne heslo nie je správne."}, status=status.HTTP_400_BAD_REQUEST)

    user.set_password(serializer.validated_data["new_password"])
    if user.musi_zmenit_heslo:
        user.musi_zmenit_heslo = False
    user.save()

    user_data = get_user_data(user)
    return Response(
        {"message": "Heslo bolo úspešne zmenené.", "user": user_data},
        status=status.HTTP_200_OK,
    )
