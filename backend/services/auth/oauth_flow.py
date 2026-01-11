"""Backward-compatible re-exports for OAuth service functions."""
from services.auth.oauth.authorization import authorize_request, validate_authorization_code
from services.auth.oauth.clients import (
    list_oauth_clients,
    create_oauth_client,
    deactivate_oauth_client,
)
from services.auth.oauth.pkce import verify_pkce
from services.auth.oauth.token_flow import handle_token_request

__all__ = [
    "authorize_request",
    "validate_authorization_code",
    "list_oauth_clients",
    "create_oauth_client",
    "deactivate_oauth_client",
    "verify_pkce",
    "handle_token_request",
]
