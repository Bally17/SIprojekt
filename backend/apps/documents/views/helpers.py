from rest_framework import status
from rest_framework.response import Response


def _user_is_student(user):
    return getattr(user, "rola", "").lower() == "student"


def _user_is_firma(user):
    return getattr(user, "rola", "").lower() == "firma"


def _user_is_garant(user):
    return getattr(user, "rola", "").lower() == "garant"


def _assert(condition, message, code=status.HTTP_400_BAD_REQUEST):
    if not condition:
        return Response({"detail": message}, status=code)
    return None
