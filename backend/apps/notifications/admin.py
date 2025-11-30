# apps/notifications/admin.py
from django.contrib import admin
from .models import Notifikacie
from apps.users.models import User


class GarantScopedAdminMixin:
    """
    Skopovanie podľa 'prax__garant'
    """

    garant_field_path = "prax__garant"

    def _is_garant(self, request):
        return (getattr(request.user, "rola", None) == User.ROLE_GARANT) and not request.user.is_superuser

    def _resolve_owner(self, obj, path: str):
        cur = obj
        for part in path.split("__"):
            cur = getattr(cur, part, None)
            if cur is None:
                break
        return cur

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if self._is_garant(request):
            return qs.filter(**{self.garant_field_path: request.user})
        return qs

    def has_module_permission(self, request):
        base = super().has_module_permission(request)
        return base or self._is_garant(request)

    def has_view_permission(self, request, obj=None):
        if obj is None:
            return True
        if request.user.is_superuser:
            return True
        if self._is_garant(request):
            owner = self._resolve_owner(obj, self.garant_field_path)
            return owner == request.user
        return False

    def has_change_permission(self, request, obj=None):
        if obj is None:
            return True
        if request.user.is_superuser:
            return True
        if self._is_garant(request):
            owner = self._resolve_owner(obj, self.garant_field_path)
            return owner == request.user
        return False

    def has_delete_permission(self, request, obj=None):
        return self.has_change_permission(request, obj)

    def has_add_permission(self, request):
        return True

    # Obmedzíme výber praxe pre garanta len na jeho praxe
    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        if db_field.name == "prax" and self._is_garant(request):
            from apps.internships.models import Prax
            kwargs["queryset"] = Prax.objects.filter(garant=request.user)
        return super().formfield_for_foreignkey(db_field, request, **kwargs)


@admin.register(Notifikacie)
class NotifikacieAdmin(GarantScopedAdminMixin, admin.ModelAdmin):
    list_display = ("id", "prax", "predmet", "stav", "vytvorene_at")
    list_filter = ("stav",)
    search_fields = ("predmet", "prax__student__pouzivatel__email")
    ordering = ("-vytvorene_at",)
