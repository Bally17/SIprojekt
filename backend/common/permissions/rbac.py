"""Role-based access control helpers."""
from rest_framework.permissions import BasePermission

from apps.users.models import User


def _role(user) -> str:
    """Return normalized role string for the given user."""
    return getattr(user, "rola", "") or ""


class IsGarantUser(BasePermission):
    """Allow only users with the garant role."""

    message = "Prístup je povolený len používateľom s rolou garant."

    def has_permission(self, request, view):
        user = request.user
        return bool(user and user.is_authenticated and _role(user) == User.ROLE_GARANT)


class IsStudentUser(BasePermission):
    """Allow only student role."""

    message = "Prístup je povolený len používateľom s rolou študent."

    def has_permission(self, request, view):
        user = request.user
        return bool(user and user.is_authenticated and _role(user) == User.ROLE_STUDENT)


class IsCompanyUser(BasePermission):
    """Allow only company role."""

    message = "Prístup je povolený len používateľom s rolou firma."

    def has_permission(self, request, view):
        user = request.user
        return bool(user and user.is_authenticated and _role(user) == User.ROLE_FIRMA)
