"""Internship assignment helpers (no HTTP dependencies)."""
from django.conf import settings

from apps.users.models import User


def pick_garant():
    """Return a non-default garant if available, otherwise any garant."""
    default_email = getattr(settings, "DEFAULT_GARANT_EMAIL", None)
    garants = User.objects.filter(rola=User.ROLE_GARANT, aktivny=True)
    if not garants.exists():
        return None

    non_default = garants
    if default_email:
        non_default = garants.exclude(email__iexact=default_email)

    candidate = non_default.order_by("id").first()
    if candidate:
        return candidate
    return garants.order_by("id").first()
