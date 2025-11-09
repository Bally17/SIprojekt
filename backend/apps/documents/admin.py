# apps/documents/admin.py
from django.contrib import admin
from .models import Dokument

@admin.register(Dokument)
class DokumentAdmin(admin.ModelAdmin):
    list_display = ("id", "prax", "typ_dokumentu", "stav_dokumentu", "subor_url", "vytvorene_at")
    list_filter  = ("stav_dokumentu", "typ_dokumentu")
    search_fields = ("id", "prax__id", "subor_url")
    readonly_fields = ("vytvorene_at", "zmenene_at", "skontrolovane_at")

    # garant vidí len dokumenty z praxí, kde je garantom
    def get_queryset(self, request):
        qs = super().get_queryset(request)
        user = request.user
        if getattr(user, "rola", None) == "garant" and not user.is_superuser:
            return qs.filter(prax__garant_id=user.id)
        return qs

    def has_view_permission(self, request, obj=None):
        if obj is None:
            return True
        if getattr(request.user, "rola", None) == "garant" and not request.user.is_superuser:
            return getattr(obj.prax, "garant_id", None) == request.user.id
        return True

    def has_change_permission(self, request, obj=None):
        if obj is None:
            return True
        if getattr(request.user, "rola", None) == "garant" and not request.user.is_superuser:
            return getattr(obj.prax, "garant_id", None) == request.user.id
        return True

    def has_delete_permission(self, request, obj=None):
        if obj is None:
            return True
        if getattr(request.user, "rola", None) == "garant" and not request.user.is_superuser:
            return getattr(obj.prax, "garant_id", None) == request.user.id
        return True

    def has_add_permission(self, request):
        # môže pridávať dokumenty, ale výber praxe obmedzíme na svoje
        return True

    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        # Obmedz praxe v dropdown-e na tie, kde je prihlásený garant garantom
        if db_field.name == "prax" and getattr(request.user, "rola", None) == "garant" and not request.user.is_superuser:
            from apps.internships.models import Prax
            kwargs["queryset"] = Prax.objects.filter(garant_id=request.user.id)
        return super().formfield_for_foreignkey(db_field, request, **kwargs)
