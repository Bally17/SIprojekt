from urllib.parse import urlencode

from django.core.cache import cache


def _normalize_params(params) -> str:
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
    delete_fn = getattr(cache, "delete_pattern", None)
    if callable(delete_fn):
        delete_fn(pattern)
    else:
        cache.clear()


def invalidate_prax_cache(prax_id=None) -> None:
    if prax_id is not None:
        cache.delete(f"praxe:detail:{prax_id}")
    delete_pattern("praxe:list:*")
    delete_pattern("firma:overview:*")
    delete_pattern("stats:*")


def invalidate_company_cache() -> None:
    delete_pattern("firma:search:*")
    delete_pattern("firma:overview:*")


def invalidate_student_cache() -> None:
    delete_pattern("student:search:*")
