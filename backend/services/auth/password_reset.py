"""Password reset business logic (no HTTP dependencies)."""
from django.conf import settings
from django.core.signing import BadSignature, SignatureExpired

from apps.users.models import User
from infrastructure.email.auth import send_password_reset_email
from common.auth.context import (
    PASSWORD_RESET_TOKEN_MAX_AGE,
    get_user_data,
    password_reset_signer,
)


def request_password_reset(email: str) -> dict:
    """Send a password reset link if the user exists."""
    email = (email or "").lower()
    user = User.objects.filter(email__iexact=email).first()

    if user:
        token = password_reset_signer.sign(user.email)
        reset_link = f"{settings.FRONTEND_URL}/auth/reset-password/{token}/"
        send_password_reset_email(user, reset_link)

    return {
        "ok": True,
        "status": 200,
        "data": {"message": "Ak účet existuje, poslali sme resetovací odkaz na email."},
    }


def confirm_password_reset(token: str, new_password: str) -> dict:
    """Validate reset token and set a new password."""
    try:
        email = password_reset_signer.unsign(token, max_age=PASSWORD_RESET_TOKEN_MAX_AGE)
    except SignatureExpired:
        return {"ok": False, "status": 400, "data": {"error": "Resetovací odkaz expiroval."}}
    except BadSignature:
        return {"ok": False, "status": 400, "data": {"error": "Resetovací odkaz je neplatný."}}

    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        return {"ok": False, "status": 400, "data": {"error": "Resetovací odkaz je neplatný."}}

    user.set_password(new_password)
    user.musi_zmenit_heslo = False
    user.save()

    return {"ok": True, "status": 200, "data": {"message": "Heslo bolo úspešne zresetované."}}


def change_user_password(user: User, current_password: str, new_password: str) -> dict:
    """Change password for the given user."""
    if not user.check_password(current_password):
        return {"ok": False, "status": 400, "data": {"error": "Aktuálne heslo nie je správne."}}

    user.set_password(new_password)
    if user.musi_zmenit_heslo:
        user.musi_zmenit_heslo = False
    user.save()

    return {
        "ok": True,
        "status": 200,
        "data": {
            "message": "Heslo bolo úspešne zmenené.",
            "user": get_user_data(user),
        },
    }
