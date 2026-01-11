"""Simple cache-based rate limiting helpers for OAuth endpoints."""
from django.core.cache import cache
from rest_framework.response import Response
from rest_framework import status

def custom_rate_limit(key, limit=10, window=60):
    """Return True if the key exceeded the limit within the window."""
    count = cache.get(key, 0)
    if count >= limit:
        return True
    cache.set(key, count + 1, window)
    return False

def oauth_rate_limit_check(request, endpoint_type):
    """Apply per-client and per-IP limits for OAuth authorize/token endpoints."""
    client_id = request.data.get('client_id') if request.method == 'POST' else request.GET.get('client_id')
    ip = request.META.get('REMOTE_ADDR', 'unknown')
    
    if endpoint_type == 'authorize':
        # Limit: 20 requests per minute per client, 100 per IP
        if client_id and custom_rate_limit(f"oauth_auth_client_{client_id}", 20, 60):
            return True
        if custom_rate_limit(f"oauth_auth_ip_{ip}", 100, 60):
            return True
            
    elif endpoint_type == 'token':
        # Limit: 10 requests per minute per client, 50 per IP  
        if client_id and custom_rate_limit(f"oauth_token_client_{client_id}", 10, 60):
            return True
        if custom_rate_limit(f"oauth_token_ip_{ip}", 50, 60):
            return True
            
    return False
