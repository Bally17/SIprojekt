"""Shared helpers for authentication views and OAuth flows."""
import secrets
import string
import base64
import hashlib

from django.conf import settings
from django.core.signing import Signer, TimestampSigner
from rest_framework_simplejwt.tokens import RefreshToken

from apps.users.models import User

signer = Signer()
activation_signer = TimestampSigner()
password_reset_signer = TimestampSigner()
ACTIVATION_TOKEN_MAX_AGE = 48 * 3600  # 48 hours
PASSWORD_RESET_TOKEN_MAX_AGE = 3600  # seconds


def get_tokens_for_user(user):
    """Return refresh/access JWT tokens for the given user."""
    refresh = RefreshToken.for_user(user)
    return {
        "refresh": str(refresh),
        "access": str(refresh.access_token),
    }


def get_user_data(user):
    """Return a normalized user payload for auth responses."""
    return {
        "id": user.id,
        "email": user.email,
        "meno": user.meno,
        "priezvisko": user.priezvisko,
        "rola": user.rola,
        "telefon": user.telefon,
        "adresa": user.adresa,
        "aktivny": user.aktivny,
        "vytvorene_at": user.vytvorene_at.isoformat() if user.vytvorene_at else None,
        "firma_id": user.firma_id,
        "musi_zmenit_heslo": user.musi_zmenit_heslo,
    }


def generate_password(length=10):
    """Generate a random password with letters, digits, and symbols."""
    chars = string.ascii_letters + string.digits + "!@#$%^&*()"
    return "".join(secrets.choice(chars) for _ in range(length))


def _generate_pkce_hash(verifier: str, method: str) -> str:
    """Compute PKCE code_challenge from the verifier and method."""
    if method == "S256":
        digest = hashlib.sha256(verifier.encode("ascii")).digest()
        return base64.urlsafe_b64encode(digest).decode("ascii").rstrip("=")
    return verifier


def verify_pkce(code_verifier: str, code_challenge: str, method: str = "plain") -> bool:
    """Verify PKCE code_verifier matches the stored code_challenge."""
    if not code_challenge:
        return True
    if not code_verifier:
        return False
    method = method or "plain"
    computed = _generate_pkce_hash(code_verifier, method)
    return secrets.compare_digest(computed, code_challenge)
