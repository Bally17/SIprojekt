"""Cache key helpers and invalidation utilities."""
from fnmatch import fnmatch
from urllib.parse import urlencode

from django.core.cache import cache


def _normalize_params(params) -> str:
    """Return a stable, URL-encoded string for query parameters."""
    if not params:
        return ""
    items = []
    if hasattr(params, "lists"):
        for key, values in sorted(params.lists()):
            for value in values:
                items.append((key, value))
    else:
        for key, value in sorted(params.items()):
            items.append((key, value))
    return urlencode(items)


def build_cache_key(prefix: str, params=None, user=None, extra: str | None = None) -> str:
    """Build a deterministic cache key from prefix, params, and user."""
    parts = [prefix]
    if user is not None:
        user_id = getattr(user, "id", "anon")
        parts.append(f"user:{user_id}")
    if extra:
        parts.append(str(extra))
    param_key = _normalize_params(params)
    if param_key:
        parts.append(param_key)
    return ":".join(parts)


def delete_pattern(pattern: str) -> None:
    """Delete cache entries matching the pattern if supported by backend."""
    delete_fn = getattr(cache, "delete_pattern", None)
    if callable(delete_fn):
        delete_fn(pattern)
        return

    keys_fn = getattr(cache, "keys", None)
    if callable(keys_fn):
        for key in keys_fn(pattern):
            cache.delete(key)
        return

    local_cache = getattr(cache, "_cache", None)
    if isinstance(local_cache, dict):
        for key in list(local_cache.keys()):
            if fnmatch(str(key), pattern):
                cache.delete(key)


def invalidate_prax_cache(prax_id=None) -> None:
    """Invalidate caches related to internship lists and details."""
    if prax_id is not None:
        cache.delete(f"praxe:detail:{prax_id}")
    delete_pattern("praxe:list:*")
    delete_pattern("firma:overview:*")
    delete_pattern("stats:*")


def invalidate_company_cache() -> None:
    """Invalidate caches related to company search and overview."""
    delete_pattern("firma:search:*")
    delete_pattern("firma:overview:*")


def invalidate_student_cache() -> None:
    """Invalidate caches related to student search."""
    delete_pattern("student:search:*")
