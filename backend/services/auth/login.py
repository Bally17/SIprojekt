"""Authentication service functions (no HTTP dependencies)."""
from typing import Any, Dict, Optional

from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import RefreshToken

from apps.companies.models import Firma
from apps.users.models import User
from common.auth.context import get_tokens_for_user, get_user_data


def build_login_payload(user: User, *, created: bool = False) -> Dict[str, Any]:
    """Return the standard login response payload."""
    tokens = get_tokens_for_user(user)
    return {
        "status": "success",
        "created": created,
        "user": get_user_data(user),
        "tokens": tokens,
    }


def validate_role_and_active(user: User, required_role: str, invalid_role_message: str) -> Dict[str, Any]:
    """Validate user role and activity status."""
    if user.rola != required_role:
        return {
            "ok": False,
            "error": {"code": "invalid_role", "message": invalid_role_message},
        }
    if not user.is_active:
        return {"ok": False, "error": {"code": "inactive_user"}}
    return {"ok": True}


def login_user(user: User, required_role: str, invalid_role_message: str) -> Dict[str, Any]:
    """Return login payload or a structured error for role/activity validation."""
    validation = validate_role_and_active(user, required_role, invalid_role_message)
    if not validation["ok"]:
        return validation
    return {"ok": True, "data": build_login_payload(user)}


def profile_payload(user: User) -> Dict[str, Any]:
    """Return profile payload for the authenticated user."""
    return {"user": get_user_data(user)}


def missing_profile_fields_payload(user: User) -> Dict[str, Any]:
    """Return profile payload with missing required fields for completion flows."""
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

        return {"user": get_user_data(user), "missing_required_fields": missing}

    required_fields = ["meno", "priezvisko", "telefon", "adresa"]
    missing = [field for field in required_fields if not getattr(user, field)]
    return {"user": get_user_data(user), "missing_required_fields": missing}


def logout_refresh_token(refresh_token: Optional[str]) -> Dict[str, Any]:
    """Invalidate the given refresh token if present."""
    if refresh_token:
        try:
            token = RefreshToken(refresh_token)
            token.blacklist()
        except TokenError:
            pass
        except Exception:
            pass
    return {"status": "success", "detail": "logged out"}
