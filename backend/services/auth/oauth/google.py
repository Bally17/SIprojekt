"""Google OAuth orchestration without DRF dependencies."""
import os
from typing import Any, Dict, Optional

from django.conf import settings

from infrastructure.external.google_oauth import exchange_google_code_for_token, fetch_google_user_data
from services.auth.oauth_registration import create_or_update_oauth_user, register_company_from_oauth
from services.auth.token_issue import social_login_payload


def _expected_redirect_uri() -> str:
    frontend = getattr(settings, "FRONTEND_URL", "http://localhost:3000")
    return f"{frontend}/auth/google"


def _get_google_credentials() -> tuple[Optional[str], Optional[str]]:
    providers = getattr(settings, "SOCIALACCOUNT_PROVIDERS", {})
    google_config = providers.get("google", {}).get("APP", {})
    client_id = google_config.get("client_id") or os.environ.get("GOOGLE_CLIENT_ID")
    client_secret = google_config.get("secret") or os.environ.get("GOOGLE_CLIENT_SECRET")
    return client_id, client_secret


def _build_error(status: int, message: str, code: str) -> dict:
    return {
        "ok": False,
        "status": status,
        "data": {"error": message},
        "error": {"code": code, "message": message},
    }


def _map_google_exchange_error(error: Dict[str, Any]) -> dict:
    code = error.get("code")
    if code == "google_token_exchange_failed":
        return _build_error(500, "Failed to exchange code for token", "google_token_exchange_failed")
    if code == "google_token_status":
        status = error.get("status", 400)
        return _build_error(400, f"Google returned status {status}", "google_token_status")
    if code == "missing_access_token":
        return _build_error(400, error.get("message") or "Google response missing access_token", "missing_access_token")
    return _build_error(400, "Invalid Google token", code or "invalid_google_token")


def _map_google_profile_error(error: Dict[str, Any]) -> dict:
    code = error.get("code")
    if code == "google_request_failed":
        return _build_error(500, "Failed to verify Google token", "google_request_failed")
    if code == "invalid_google_token":
        return _build_error(400, "Invalid Google token", "invalid_google_token")
    if code == "missing_email":
        return _build_error(400, "Email not provided by Google", "missing_email")
    return _build_error(400, "Invalid Google token", code or "invalid_google_token")


def _exchange_code(code: str, code_verifier: str, redirect_uri: str) -> dict:
    client_id, client_secret = _get_google_credentials()
    if not client_id or not client_secret:
        return _build_error(
            500,
            "Missing GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET",
            "missing_google_credentials",
        )

    expected = _expected_redirect_uri()
    if redirect_uri != expected:
        return _build_error(400, f"Invalid redirect_uri. Expected: {expected}", "invalid_redirect_uri")

    return exchange_google_code_for_token(
        client_id=client_id,
        client_secret=client_secret,
        code=code,
        redirect_uri=redirect_uri,
        code_verifier=code_verifier,
    )


def _fetch_profile(access_token: str) -> dict:
    profile = fetch_google_user_data(access_token)
    if not profile["ok"]:
        return _map_google_profile_error(profile.get("error", {}))
    return profile["data"]


def _build_login_response(access_token: str) -> dict:
    profile = _fetch_profile(access_token)
    if not profile.get("ok", True):
        return profile
    data = profile
    user, created = create_or_update_oauth_user(
        email=data["email"],
        first_name=data.get("first_name", ""),
        last_name=data.get("last_name", ""),
        avatar=data.get("avatar"),
        provider="google",
    )
    return {"ok": True, "status": 200, "data": social_login_payload(user, created)}


def google_login(code: str, code_verifier: str, redirect_uri: str) -> dict:
    """Authenticate a user via Google OAuth code + PKCE."""
    exchange = _exchange_code(code, code_verifier, redirect_uri)
    if not exchange.get("ok"):
        return _map_google_exchange_error(exchange.get("error", {}))

    access_token = exchange["data"]["access_token"]
    return _build_login_response(access_token)


def google_company_register(
    *,
    code: str,
    code_verifier: str,
    redirect_uri: str,
    requested_email: str | None = None,
    kontaktna_osoba_meno: str | None = None,
    kontaktna_osoba_email: str | None = None,
    kontaktna_osoba_telefon: str | None = None,
    adresa: str | None = None,
) -> dict:
    """Register a company using Google OAuth data."""
    exchange = _exchange_code(code, code_verifier, redirect_uri)
    if not exchange.get("ok"):
        return _map_google_exchange_error(exchange.get("error", {}))

    profile_result = _fetch_profile(exchange["data"]["access_token"])
    if not profile_result.get("ok", True):
        return profile_result

    data = profile_result
    registration = register_company_from_oauth(
        email=data["email"],
        requested_email=requested_email,
        kontaktna_osoba_meno=kontaktna_osoba_meno,
        kontaktna_osoba_email=kontaktna_osoba_email,
        kontaktna_osoba_telefon=kontaktna_osoba_telefon,
        adresa=adresa,
    )
    return registration
