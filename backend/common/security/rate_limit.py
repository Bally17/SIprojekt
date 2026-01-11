"""Cache-based rate limiting helpers for OAuth endpoints."""
from django.core.cache import cache


def _custom_rate_limit(key: str, limit: int = 10, window: int = 60) -> bool:
    """Return True if the key exceeded the limit within the window."""
    count = cache.get(key, 0)
    if count >= limit:
        return True
    cache.set(key, count + 1, window)
    return False


def oauth_rate_limit_check(client_id: str | None, ip: str, endpoint_type: str) -> bool:
    """Apply per-client and per-IP limits for OAuth authorize/token endpoints."""
    if endpoint_type == "authorize":
        if client_id and _custom_rate_limit(f"oauth_auth_client_{client_id}", 20, 60):
            return True
        if _custom_rate_limit(f"oauth_auth_ip_{ip}", 100, 60):
            return True
    elif endpoint_type == "token":
        if client_id and _custom_rate_limit(f"oauth_token_client_{client_id}", 10, 60):
            return True
        if _custom_rate_limit(f"oauth_token_ip_{ip}", 50, 60):
            return True
    return False
