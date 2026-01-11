"""OAuth token issuance and rotation helpers."""
from datetime import timedelta
from typing import Optional

from django.conf import settings
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import RefreshToken

from apps.users.models import User
from common.auth.context import get_tokens_for_user, get_user_data


def _access_expires_in() -> int:
    access_lifetime = settings.SIMPLE_JWT.get("ACCESS_TOKEN_LIFETIME", timedelta(minutes=15))
    try:
        return int(access_lifetime.total_seconds())
    except AttributeError:
        return 900


def issue_authorization_code_tokens(user: User, scope: str) -> dict:
    """Issue access/refresh tokens for authorization_code grant."""
    tokens = get_tokens_for_user(user)
    return {
        "access_token": tokens["access"],
        "token_type": "Bearer",
        "expires_in": 900,
        "refresh_token": tokens["refresh"],
        "scope": scope,
    }


def rotate_refresh_token(refresh_token_str: str) -> dict:
    """Rotate refresh token for refresh_token grant."""
    try:
        old = RefreshToken(refresh_token_str)
        user = User.objects.get(id=old["user_id"])
    except (TokenError, KeyError, User.DoesNotExist):
        return {"ok": False, "status": 400, "data": {"error": "invalid_grant"}}

    new_refresh = RefreshToken.for_user(user)
    new_access = new_refresh.access_token

    try:
        old.blacklist()
    except Exception:
        pass

    return {
        "ok": True,
        "data": {
            "access_token": str(new_access),
            "token_type": "Bearer",
            "expires_in": 900,
            "refresh_token": str(new_refresh),
            "scope": "read profile",
        },
    }


def issue_password_grant_tokens(user: User, scope: str) -> dict:
    """Issue tokens for password grant (company login)."""
    tokens = get_tokens_for_user(user)
    expires_in = _access_expires_in()
    return {
        "status": "success",
        "created": False,
        "access_token": tokens["access"],
        "token_type": "Bearer",
        "expires_in": expires_in,
        "refresh_token": tokens["refresh"],
        "scope": scope,
        "user": get_user_data(user),
        "tokens": tokens,
    }


def issue_client_credentials_tokens(service_user: User, scope: str) -> dict:
    """Issue tokens for client_credentials grant."""
    tokens = get_tokens_for_user(service_user)
    expires_in = _access_expires_in()
    return {
        "access_token": tokens["access"],
        "token_type": "Bearer",
        "expires_in": expires_in,
        "refresh_token": tokens["refresh"],
        "scope": scope,
    }


def social_login_payload(user: User, created: bool) -> dict:
    """Return social login payload."""
    tokens = get_tokens_for_user(user)
    return {
        "status": "success",
        "created": created,
        "user": get_user_data(user),
        "tokens": tokens,
    }
