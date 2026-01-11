"""GitHub OAuth orchestration without DRF dependencies."""
from typing import Any, Dict, Optional
from urllib.parse import urlencode

from django.conf import settings

from infrastructure.external.github_oauth import exchange_github_code_for_token, fetch_github_user_data
from services.auth.oauth_registration import create_or_update_oauth_user, register_company_from_oauth
from services.auth.token_issue import social_login_payload


def _build_error(status: int, message: str, code: str) -> dict:
    return {
        "ok": False,
        "status": status,
        "data": {"error": message},
        "error": {"code": code, "message": message},
    }


def _map_profile_error(error: Dict[str, Any]) -> dict:
    code = error.get("code")
    if code in ("github_request_failed", "github_email_failed"):
        return _build_error(500, "Failed to verify GitHub token", code or "github_request_failed")
    if code == "github_userinfo_failed":
        return _build_error(400, "Failed to get user info from GitHub", "github_userinfo_failed")
    if code == "missing_email":
        return _build_error(400, "Email not provided by GitHub", "missing_email")
    return _build_error(400, "Failed to verify GitHub token", code or "github_error")


def _map_exchange_error(error: Dict[str, Any]) -> dict:
    code = error.get("code")
    if code == "github_token_exchange_failed":
        return _build_error(500, "Failed to exchange code for token", code)
    if code == "github_token_status":
        status = error.get("status", 400)
        return _build_error(400, f"GitHub returned status {status}", code)
    if code == "missing_access_token":
        return _build_error(400, error.get("message") or "Failed to get access token from GitHub", code)
    return _build_error(400, "Failed to get access token from GitHub", code or "github_error")


def _fetch_profile(access_token: str) -> dict:
    profile = fetch_github_user_data(access_token)
    if not profile["ok"]:
        return _map_profile_error(profile.get("error", {}))
    return profile["data"]


def _create_session(profile_data: dict) -> dict:
    user, created = create_or_update_oauth_user(
        email=profile_data["email"],
        first_name=profile_data.get("first_name", ""),
        last_name=profile_data.get("last_name", ""),
        avatar=profile_data.get("avatar"),
        provider="github",
    )
    return {"ok": True, "status": 200, "data": social_login_payload(user, created)}


def _login_with_access_token(access_token: str) -> dict:
    profile = _fetch_profile(access_token)
    if not profile.get("ok", True):
        return profile
    return _create_session(profile)


def _resolve_redirect_uri(provided: str | None) -> str:
    return provided or getattr(settings, "GITHUB_REDIRECT_URI", "http://localhost:8000/api/auth/github/callback/")


def _exchange_code(code: str, code_verifier: str | None, redirect_uri: str | None) -> dict:
    exchange = exchange_github_code_for_token(
        client_id=settings.SOCIALACCOUNT_PROVIDERS["github"]["APP"]["client_id"],
        client_secret=settings.SOCIALACCOUNT_PROVIDERS["github"]["APP"]["secret"],
        code=code,
        redirect_uri=_resolve_redirect_uri(redirect_uri),
        code_verifier=code_verifier,
    )
    if not exchange["ok"]:
        return _map_exchange_error(exchange.get("error", {}))
    return exchange


def _ensure_token(access_token: Optional[str], code: Optional[str], code_verifier: Optional[str], redirect_uri: Optional[str]) -> dict:
    if access_token:
        return {"ok": True, "data": {"access_token": access_token}}
    if not code:
        return _build_error(400, 'Must provide either "code" or "access_token"', "missing_code_or_token")
    exchange = _exchange_code(code, code_verifier, redirect_uri)
    if not exchange.get("ok"):
        return exchange
    return exchange


def github_authenticate(data: dict) -> dict:
    """Authenticate a user with GitHub via code or access token."""
    result = _ensure_token(
        access_token=data.get("access_token"),
        code=data.get("code"),
        code_verifier=data.get("code_verifier"),
        redirect_uri=data.get("redirect_uri"),
    )
    if not result.get("ok"):
        return result
    access_token = result["data"]["access_token"]
    return _login_with_access_token(access_token)


def github_company_register(
    *,
    access_token: str | None = None,
    code: str | None = None,
    code_verifier: str | None = None,
    redirect_uri: str | None = None,
    requested_email: str | None = None,
    kontaktna_osoba_meno: str | None = None,
    kontaktna_osoba_email: str | None = None,
    kontaktna_osoba_telefon: str | None = None,
    adresa: str | None = None,
) -> dict:
    """Register a company based on GitHub OAuth info."""
    result = _ensure_token(access_token, code, code_verifier, redirect_uri)
    if not result.get("ok"):
        return result

    profile = _fetch_profile(result["data"]["access_token"])
    if not profile.get("ok", True):
        return profile

    registration = register_company_from_oauth(
        email=profile["email"],
        requested_email=requested_email,
        kontaktna_osoba_meno=kontaktna_osoba_meno,
        kontaktna_osoba_email=kontaktna_osoba_email,
        kontaktna_osoba_telefon=kontaktna_osoba_telefon,
        adresa=adresa,
    )
    return registration


def _parse_company_fields(metadata: dict) -> dict[str, Optional[str]]:
    keys = (
        "requested_email",
        "kontaktna_osoba_meno",
        "kontaktna_osoba_email",
        "kontaktna_osoba_telefon",
        "adresa",
    )
    return {key: metadata.get(key) for key in keys}


def _build_redirect_url(status_value: str, payload: dict[str, str | None]) -> str:
    frontend = getattr(settings, "FRONTEND_URL", "http://localhost:3000")
    base = f"{frontend}/auth/github"
    normalized_payload = {key: (value or "") for key, value in payload.items()}
    fragment = urlencode(normalized_payload)
    target = f"{base}#status={status_value}"
    if fragment:
        target = f"{target}&{fragment}"
    return target


def github_callback(code: str | None, state: str | None, metadata: dict | None = None) -> dict:
    """Handle GitHub OAuth callback and build redirect instructions."""
    metadata = metadata or {}
    if not code:
        return {
            "ok": False,
            "status": 302,
            "data": {"redirect_url": _build_redirect_url("error", {"message": "No code provided"})},
        }

    exchange = _ensure_token(access_token=None, code=code, code_verifier=metadata.get("code_verifier"), redirect_uri=metadata.get("redirect_uri"))
    if not exchange.get("ok"):
        error_message = exchange.get("data", {}).get("error", "Failed to get access token from GitHub")
        return {
            "ok": False,
            "status": 302,
            "data": {"redirect_url": _build_redirect_url("error", {"message": error_message})},
        }

    access_token = exchange["data"]["access_token"]
    is_company_flow = bool(state and state.startswith("company:"))
    if is_company_flow:
        company_fields = _parse_company_fields(metadata)
        result = github_company_register(
            access_token=access_token,
            requested_email=company_fields.get("requested_email"),
            kontaktna_osoba_meno=company_fields.get("kontaktna_osoba_meno"),
            kontaktna_osoba_email=company_fields.get("kontaktna_osoba_email"),
            kontaktna_osoba_telefon=company_fields.get("kontaktna_osoba_telefon"),
            adresa=company_fields.get("adresa"),
        )
    else:
        result = _login_with_access_token(access_token)

    if not result.get("ok"):
        error_message = result.get("data", {}).get("error", "Failed to verify GitHub token")
        return {
            "ok": False,
            "status": 302,
            "data": {"redirect_url": _build_redirect_url("error", {"message": error_message})},
        }

    tokens = result["data"].get("tokens", {})
    created = bool(result["data"].get("created"))
    status_value = "success" if created else "existing"
    redirect_payload = {
        "created": str(created).lower(),
        "access": tokens.get("access", ""),
        "refresh": tokens.get("refresh", ""),
    }
    return {
        "ok": True,
        "status": 302,
        "data": {"redirect_url": _build_redirect_url(status_value, redirect_payload)},
    }
