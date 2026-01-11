"""Internship-specific permission helpers."""
from rest_framework.permissions import BasePermission

from apps.users.models import User
from .rbac import _role


class IsGarantOrRelatedInternship(BasePermission):
    """Allow garant or participants of the internship."""

    message = "Prístup je povolený len garantovi alebo účastníkovi praxe."

    def _is_related(self, user, internship) -> bool:
        if not internship:
            return False
        role = _role(user)
        if role == User.ROLE_STUDENT:
            return internship.student_id == user.id
        if role == User.ROLE_FIRMA:
            return getattr(user, "firma_id", None) == getattr(internship, "firma_id", None)
        if role == User.ROLE_GARANT:
            return internship.garant_id == user.id
        return False

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated)

    def has_object_permission(self, request, view, obj):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        if _role(user) == User.ROLE_GARANT:
            return True
        target = getattr(obj, "prax", obj)
        return self._is_related(user, target)
