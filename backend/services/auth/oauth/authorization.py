"""Authorization code flow helpers."""
from datetime import timedelta
from urllib.parse import urlencode

from django.utils import timezone

from apps.authentication.models import AuthorizationCode, OAuthClient
from services.auth.oauth import pkce


def authorize_request(
    *,
    user,
    client_id: str,
    redirect_uri: str,
    response_type: str,
    scope: str,
    state: str,
    code_challenge: str | None,
    code_challenge_method: str | None,
) -> dict:
    """Validate and issue an authorization code for OAuth authorize endpoint."""
    try:
        client = OAuthClient.objects.get(client_id=client_id, is_active=True)
        allowed_uris = client.get_redirect_uris_list()
        if redirect_uri not in allowed_uris:
            return {
                "ok": False,
                "status": 400,
                "data": {"error": "invalid_request", "error_description": "Invalid redirect_uri"},
            }
    except OAuthClient.DoesNotExist:
        return {
            "ok": False,
            "status": 400,
            "data": {"error": "invalid_client", "error_description": "Invalid client"},
        }

    if client.is_public and not code_challenge:
        return {
            "ok": False,
            "status": 400,
            "data": {
                "error": "invalid_request",
                "error_description": "PKCE code_challenge is required for public clients",
            },
        }

    if not user or not getattr(user, "is_authenticated", False):
        return {
            "ok": False,
            "status": 401,
            "data": {"error": "authentication_required", "message": "User must be authenticated first"},
        }

    auth_code = AuthorizationCode.objects.create(
        code=AuthorizationCode.generate_code(),
        user=user,
        client=client,
        redirect_uri=redirect_uri,
        scope=scope,
        expires_at=timezone.now() + timedelta(minutes=10),
        code_challenge=code_challenge,
        code_challenge_method=code_challenge_method or "plain",
    )

    params = {"code": auth_code.code, "state": state}
    redirect_url = f"{redirect_uri}?{urlencode(params)}"

    return {"ok": True, "data": {"redirect_url": redirect_url, "code": auth_code.code, "state": state}}


def validate_authorization_code(
    *,
    client: OAuthClient,
    code: str,
    redirect_uri: str,
    code_verifier: str | None,
) -> dict:
    """Validate authorization code and PKCE verifier."""
    try:
        auth_code = AuthorizationCode.objects.get(code=code, client=client, used=False)
        if not auth_code.is_valid():
            return {"ok": False, "status": 400, "data": {"error": "invalid_grant"}}
        if auth_code.redirect_uri != redirect_uri:
            return {"ok": False, "status": 400, "data": {"error": "invalid_grant"}}
    except AuthorizationCode.DoesNotExist:
        return {"ok": False, "status": 400, "data": {"error": "invalid_grant"}}

    if auth_code.code_challenge:
        if not code_verifier:
            return {
                "ok": False,
                "status": 400,
                "data": {"error": "invalid_request", "error_description": "Missing code_verifier"},
            }
        if not pkce.verify_pkce(code_verifier, auth_code.code_challenge, auth_code.code_challenge_method):
            return {
                "ok": False,
                "status": 400,
                "data": {"error": "invalid_grant", "error_description": "Invalid code_verifier"},
            }

    auth_code.used = True
    auth_code.save(update_fields=["used"])

    return {"ok": True, "user": auth_code.user, "scope": auth_code.scope}
