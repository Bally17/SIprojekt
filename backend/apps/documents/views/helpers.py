from rest_framework import status
from rest_framework.response import Response
from apps.users.models import User


def _user_is_student(user):
    return getattr(user, "rola", "").lower() == User.ROLE_STUDENT


def _user_is_firma(user):
    return getattr(user, "rola", "").lower() == User.ROLE_FIRMA


def _user_is_garant(user):
    return getattr(user, "rola", "").lower() == User.ROLE_GARANT


def _assert(condition, message, code=status.HTTP_400_BAD_REQUEST):
    if not condition:
        return Response({"detail": message}, status=code)
    return None
