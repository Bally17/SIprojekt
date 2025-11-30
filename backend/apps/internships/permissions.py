from rest_framework.permissions import BasePermission
from rest_framework.permissions import SAFE_METHODS
from apps.users.models import User


def _role(user) -> str:
    return getattr(user, "rola", "") or ""


class IsGarantUser(BasePermission):
    """
    Ensures only users with the 'garant' role can access the view.
    """

    message = "Prístup je povolený len používateľom s rolou garant."

    def has_permission(self, request, view):
        user = request.user
        return bool(user and user.is_authenticated and _role(user) == User.ROLE_GARANT)


class IsStudentUser(BasePermission):
    """Allow only študent role."""

    message = "Prístup je povolený len používateľom s rolou študent."

    def has_permission(self, request, view):
        user = request.user
        return bool(user and user.is_authenticated and _role(user) == User.ROLE_STUDENT)


class IsCompanyUser(BasePermission):
    """Allow only firemný účet."""

    message = "Prístup je povolený len používateľom s rolou firma."

    def has_permission(self, request, view):
        user = request.user
        return bool(user and user.is_authenticated and _role(user) == User.ROLE_FIRMA)


class IsGarantOrRelatedInternship(BasePermission):
    """
    Garant má prístup ku všetkému, ostatní len k praxiam, ktorých sú súčasťou.
    """

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
        # allow authenticated; object-level will enforce relationship
        return bool(request.user and request.user.is_authenticated)

    def has_object_permission(self, request, view, obj):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        if _role(user) == User.ROLE_GARANT:
            return True
        target = getattr(obj, "prax", obj)
        return self._is_related(user, target)


class IsGarantOrRelatedDocument(BasePermission):
    """
    Garant má prístup, inak len účastník praxe, ku ktorej dokument patrí.
    """

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
    """
    Garant má plný prístup k firmám, firemný účet len číta vlastnú firmu.
    Žiadne mutácie pre študentov ani iné roly.
    """

    message = "Prístup je povolený len garantovi (plný) alebo firemnému účtu (iba čítanie vlastnej firmy)."

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
