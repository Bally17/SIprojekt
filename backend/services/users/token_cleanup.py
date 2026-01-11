"""Utility helpers for cleaning up token tables related to users."""
from collections.abc import Iterable

from apps.users.models import AktivacneTokeny, ResetHeslaTokeny


def remove_user_tokens(user_ids: Iterable[int]) -> None:
    """Delete activation/reset tokens for the provided users."""

    user_ids = tuple(user_ids)
    if not user_ids:
        return

    AktivacneTokeny.objects.filter(pouzivatel_id__in=user_ids).delete()
    ResetHeslaTokeny.objects.filter(pouzivatel_id__in=user_ids).delete()
