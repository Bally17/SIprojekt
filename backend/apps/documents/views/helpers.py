"""Helper predicates and response shortcuts for document views."""
from rest_framework import status
from rest_framework.response import Response
from apps.users.models import User


def _user_is_student(user):
    """Return True if user is a student role."""
    return getattr(user, "rola", "").lower() == User.ROLE_STUDENT


def _user_is_firma(user):
    """Return True if user is a company role."""
    return getattr(user, "rola", "").lower() == User.ROLE_FIRMA


def _user_is_garant(user):
    """Return True if user is a garant role."""
    return getattr(user, "rola", "").lower() == User.ROLE_GARANT


def _assert(condition, message, code=status.HTTP_400_BAD_REQUEST):
    """Return a Response with error message if condition is False."""
    if not condition:
        return Response({"detail": message}, status=code)
    return None
