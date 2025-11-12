from rest_framework.permissions import BasePermission


class IsGarantUser(BasePermission):
    """
    Ensures only users with the 'garant' role can access the view.
    """

    message = "Prístup je povolený len používateľom s rolou garant."

    def has_permission(self, request, view):
        user = request.user
        return bool(user and user.is_authenticated and getattr(user, "rola", "") == "garant")
