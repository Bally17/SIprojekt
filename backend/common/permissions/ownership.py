"""Ownership and object access helpers."""
from rest_framework.permissions import BasePermission, SAFE_METHODS

from apps.users.models import User
from .rbac import _role


class IsGarantOrRelatedDocument(BasePermission):
    """Allow garant or participants of a related internship."""

    message = "Prístup je povolený len garantovi alebo účastníkovi súvisiacej praxe."

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated)

    def has_object_permission(self, request, view, obj):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        if _role(user) == User.ROLE_GARANT:
            return True

        prax = getattr(obj, "prax", None)
        if not prax:
            return False

        role = _role(user)
        if role == User.ROLE_STUDENT:
            return getattr(prax, "student_id", None) == user.id
        if role == User.ROLE_FIRMA:
            return getattr(user, "firma_id", None) == getattr(prax, "firma_id", None)
        return False


class IsGarantOrReadOnlyCompany(BasePermission):
    """Garant has full access, company accounts read their own company only."""

    message = (
        "Prístup je povolený len garantovi (plný) alebo firemnému účtu "
        "(iba čítanie vlastnej firmy)."
    )

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated)

    def has_object_permission(self, request, view, obj):
        user = request.user
        role = _role(user)
        if role == User.ROLE_GARANT:
            return True
        if request.method in SAFE_METHODS and role == User.ROLE_FIRMA:
            return getattr(user, "firma_id", None) == getattr(obj, "id", None)
        return False
