"""OAuth token grant handling."""
import jwt
from jwt import InvalidTokenError

from apps.authentication.models import OAuthClient
from apps.users.models import User
from services.auth import token_issue
from services.auth.oauth import authorization


def _authenticate_oauth_client(
    *,
    client_id: str,
    client_secret: str | None,
    client_assertion_type: str | None,
    client_assertion: str | None,
    audience: str,
) -> dict:
    """Validate OAuth client authentication for token issuance."""
    try:
        client = OAuthClient.objects.get(client_id=client_id, is_active=True)
        client_assertion_valid = False

        assertion_requested = (
            client_assertion_type == "urn:ietf:params:oauth:client-assertion-type:jwt-bearer" and bool(client_assertion)
        )

        if assertion_requested:
            if client.is_public:
                return {
                    "ok": False,
                    "status": 400,
                    "data": {
                        "error": "unauthorized_client",
                        "error_description": "Public clients cannot use private_key_jwt.",
                    },
                }
            if not client.allow_private_jwt:
                return {
                    "ok": False,
                    "status": 400,
                    "data": {
                        "error": "unauthorized_client",
                        "error_description": "client_assertion not allowed for this client.",
                    },
                }
            if not client.public_key:
                return {
                    "ok": False,
                    "status": 401,
                    "data": {
                        "error": "invalid_client",
                        "error_description": "Missing public key for client_assertion validation.",
                    },
                }
            try:
                claims = jwt.decode(client_assertion, client.public_key, algorithms=["RS256"], audience=audience)
            except InvalidTokenError as exc:
                return {
                    "ok": False,
                    "status": 401,
                    "data": {"error": "invalid_client", "error_description": f"Invalid client_assertion: {exc}"},
                }

            if claims.get("iss") != client_id or claims.get("sub") != client_id:
                return {
                    "ok": False,
                    "status": 401,
                    "data": {"error": "invalid_client", "error_description": "client_assertion iss/sub mismatch."},
                }
            client_assertion_valid = True

        if not assertion_requested:
            if client.is_public:
                if client.client_secret and client_secret and client.client_secret != client_secret:
                    return {"ok": False, "status": 401, "data": {"error": "invalid_client"}}
            else:
                if not client_secret or client.client_secret != client_secret:
                    return {"ok": False, "status": 401, "data": {"error": "invalid_client"}}
        elif not client_assertion_valid:
            return {"ok": False, "status": 401, "data": {"error": "invalid_client"}}
    except OAuthClient.DoesNotExist:
        return {"ok": False, "status": 401, "data": {"error": "invalid_client"}}

    return {"ok": True, "client": client}


def handle_token_request(*, payload: dict, audience: str) -> dict:
    """Process OAuth token request payload and return response data."""
    grant_type = payload["grant_type"]
    client_id = payload["client_id"]
    client_secret = payload.get("client_secret")
    client_assertion_type = payload.get("client_assertion_type")
    client_assertion = payload.get("client_assertion")
    code = payload.get("code")
    redirect_uri = payload.get("redirect_uri")
    refresh_token_str = payload.get("refresh_token")
    username = payload.get("username")
    password = payload.get("password")
    code_verifier = payload.get("code_verifier")

    client_auth = _authenticate_oauth_client(
        client_id=client_id,
        client_secret=client_secret,
        client_assertion_type=client_assertion_type,
        client_assertion=client_assertion,
        audience=audience,
    )
    if not client_auth["ok"]:
        return client_auth
    client = client_auth["client"]

    if grant_type == "authorization_code":
        if not code or not redirect_uri:
            return {"ok": False, "status": 400, "data": {"error": "invalid_grant"}}
        validation = authorization.validate_authorization_code(
            client=client,
            code=code,
            redirect_uri=redirect_uri,
            code_verifier=code_verifier,
        )
        if not validation["ok"]:
            return validation
        data = token_issue.issue_authorization_code_tokens(validation["user"], validation["scope"])
        return {"ok": True, "data": data}

    if grant_type == "refresh_token":
        if not refresh_token_str:
            return {
                "ok": False,
                "status": 400,
                "data": {"error": "invalid_request", "error_description": "Missing refresh_token"},
            }
        return token_issue.rotate_refresh_token(refresh_token_str)

    if grant_type == "password":
        if not client.allow_password_grant:
            return {"ok": False, "status": 400, "data": {"error": "unauthorized_client"}}
        if not username or not password:
            return {
                "ok": False,
                "status": 400,
                "data": {"error": "invalid_request", "error_description": "Missing username/password"},
            }
        try:
            user = User.objects.get(email__iexact=username)
        except User.DoesNotExist:
            return {"ok": False, "status": 400, "data": {"error": "invalid_grant"}}
        if not user.check_password(password):
            return {"ok": False, "status": 400, "data": {"error": "invalid_grant"}}
        if user.rola != User.ROLE_FIRMA:
            return {
                "ok": False,
                "status": 403,
                "data": {
                    "error": "invalid_role",
                    "error_description": "Firemný login je určený len pre kontá firiem.",
                },
            }
        if not user.is_active:
            return {"ok": False, "status": 403, "data": {"error": "inactive_user"}}

        scope = client.scope or "read profile"
        data = token_issue.issue_password_grant_tokens(user, scope)
        return {"ok": True, "data": data}

    if grant_type == "client_credentials":
        if client.is_public:
            return {
                "ok": False,
                "status": 400,
                "data": {
                    "error": "unauthorized_client",
                    "error_description": "Public clients cannot use client_credentials grant.",
                },
            }
        service_user = getattr(client, "service_user", None)
        if not service_user:
            return {
                "ok": False,
                "status": 401,
                "data": {
                    "error": "invalid_client",
                    "error_description": "Service user is not configured for this client.",
                },
            }
        if not service_user.is_active:
            return {
                "ok": False,
                "status": 403,
                "data": {"error": "invalid_grant", "error_description": "Service user is inactive."},
            }
        if service_user.rola not in (User.ROLE_EXTERNY, User.ROLE_GARANT):
            return {
                "ok": False,
                "status": 403,
                "data": {
                    "error": "invalid_role",
                    "error_description": "Service user must have role externy or garant.",
                },
            }
        scope = client.scope or "read profile"
        data = token_issue.issue_client_credentials_tokens(service_user, scope)
        return {"ok": True, "data": data}

    return {"ok": False, "status": 400, "data": {"error": "unsupported_grant_type"}}
