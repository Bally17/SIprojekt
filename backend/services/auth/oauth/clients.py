"""OAuth client management helpers."""
import secrets

from apps.authentication.models import OAuthClient
from apps.users.models import User


def generate_unique_client_id() -> str:
    """Generate a unique client_id within the DB limit."""
    for _ in range(5):
        candidate = secrets.token_urlsafe(12)
        if not OAuthClient.objects.filter(client_id=candidate).exists():
            return candidate
    return secrets.token_urlsafe(16)


def list_oauth_clients(user) -> dict:
    """List OAuth clients for garant users."""
    if getattr(user, "rola", "") != User.ROLE_GARANT:
        return {
            "ok": False,
            "status": 403,
            "data": {"detail": "Prístup je povolený len používateľom s rolou garant."},
        }
    clients = OAuthClient.objects.filter(is_active=True)
    data = [
        {
            "client_id": client.client_id,
            "name": client.name,
            "redirect_uris": client.get_redirect_uris_list(),
            "scope": client.scope,
        }
        for client in clients
    ]
    return {"ok": True, "data": data}


def create_oauth_client(user, payload: dict) -> dict:
    """Create an OAuth client and return response payload."""
    if getattr(user, "rola", "") != User.ROLE_GARANT:
        return {
            "ok": False,
            "status": 403,
            "data": {"detail": "Prístup je povolený len používateľom s rolou garant."},
        }

    client_id = payload.get("client_id") or generate_unique_client_id()
    if OAuthClient.objects.filter(client_id=client_id).exists():
        return {"ok": False, "status": 400, "data": {"client_id": ["client_id už existuje."]}}

    is_public = payload.get("is_public", False)
    client_secret = payload.get("client_secret") or ""
    if not is_public and not client_secret:
        client_secret = secrets.token_urlsafe(32)
    if is_public:
        client_secret = ""

    service_user = payload.get("service_user") or user
    if service_user.rola not in (User.ROLE_EXTERNY, User.ROLE_GARANT):
        return {
            "ok": False,
            "status": 400,
            "data": {"service_user": ["Service user musí mať rolu externy alebo garant."]},
        }

    client = OAuthClient.objects.create(
        client_id=client_id,
        client_secret=client_secret,
        name=payload["name"],
        redirect_uris=payload.get("redirect_uris_json", "[]"),
        scope=payload.get("scope") or "read write",
        is_public=is_public,
        allow_password_grant=payload.get("allow_password_grant", False),
        service_user=service_user,
        allow_private_jwt=payload.get("allow_private_jwt", False),
        public_key=payload.get("public_key"),
    )

    response_data = {
        "client_id": client.client_id,
        "client_secret": client_secret,
        "name": client.name,
        "redirect_uris": payload.get("redirect_uris", []),
        "scope": client.scope,
        "is_public": client.is_public,
        "allow_password_grant": client.allow_password_grant,
        "allow_private_jwt": client.allow_private_jwt,
        "service_user": {"id": service_user.id, "email": service_user.email},
    }
    return {"ok": True, "status": 201, "data": response_data}


def deactivate_oauth_client(user, client_id: str) -> dict:
    """Deactivate an OAuth client by client_id (garant-only)."""
    if getattr(user, "rola", "") != User.ROLE_GARANT:
        return {
            "ok": False,
            "status": 403,
            "data": {"detail": "Prístup je povolený len používateľom s rolou garant."},
        }

    try:
        client = OAuthClient.objects.get(client_id=client_id, is_active=True)
    except OAuthClient.DoesNotExist:
        return {"ok": False, "status": 404, "data": {"detail": "OAuth klient nenájdený."}}

    client.is_active = False
    client.save(update_fields=["is_active"])
    return {"ok": True, "status": 204, "data": None}
