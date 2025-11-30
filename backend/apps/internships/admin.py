# apps/internships/admin.py
from django.contrib import admin
from django.utils.translation import gettext_lazy as _
from apps.documents.models import Dokument
from apps.notifications.models import Notifikacie
from apps.users.models import User
from .models import Prax

# ---------- INLINES (Dokumenty, Notifikácie) ----------
class DokumentInline(admin.TabularInline):
    model = Dokument
    extra = 0
    fields = ("typ_dokumentu", "stav_dokumentu", "subor_url", "nahrane_pouzivatel_id", "skontroloval_id", "skontrolovane_at", "vytvorene_at")
    readonly_fields = ("vytvorene_at",)
    # garant uvidí len dokumenty k jeho praxi – zabezpečí PraxAdmin.get_queryset

class NotifikaciaInline(admin.TabularInline):
    model = Notifikacie
    extra = 0
    fields = ("prijemca_id", "prijemca_email", "predmet", "sablona_kluc", "stav", "odoslane_at", "vytvorene_at")
    readonly_fields = ("vytvorene_at", "odoslane_at")

# ---------- Prax Admin ----------
@admin.register(Prax)
class PraxAdmin(admin.ModelAdmin):
    list_display = (
        "id", "student_id", "firma_id", "garant_id",
        "rok", "semester", "datum_zaciatku", "datum_konca", "stav", "vytvorene_at",
    )
    list_filter = ("rok", "semester", "stav", "firma_id", "garant_id")
    search_fields = ("id", "student_id", "firma_id", "garant_id")
    date_hierarchy = "datum_zaciatku"
    ordering = ("-vytvorene_at",)

    inlines = [DokumentInline, NotifikaciaInline]

    # ------- SCOPE: garant vidí len svoje praxe -------
    def get_queryset(self, request):
        qs = super().get_queryset(request)
        user = request.user
        if getattr(user, "rola", None) == User.ROLE_GARANT and not user.is_superuser:
            return qs.filter(garant_id=user.id)
        return qs

    # ------- Pole 'garant' – Voľba 3: viditeľné a meniteľné, predvyplníme na prihláseného -------
    def get_changeform_initial_data(self, request):
        initial = super().get_changeform_initial_data(request)
        if getattr(request.user, "rola", None) == User.ROLE_GARANT:
            initial.setdefault("garant_id", request.user.id)
        return initial

    # Ak máš ForeignKey polia namiesto *_id, môžeš obmedziť querysety takto:
    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        """
        Bezpečne obmedzí voliteľne FK polia ak existujú (ak nie, nechá pôvodné).
        """
        try:
            name = db_field.name
        except Exception:
            return super().formfield_for_foreignkey(db_field, request, **kwargs)

        user = request.user
        # Ak existuje FK 'garant' (nie len garant_id), prednastav a obmedz
        if name == "garant" and getattr(user, "rola", None) == User.ROLE_GARANT and not user.is_superuser:
            kwargs["queryset"] = User.objects.filter(rola=User.ROLE_GARANT)
            kwargs.setdefault("initial", user.pk)

        # Ak existuje FK 'pouzivatel' na študenta/firmu, vieš pridať ďalšie obmedzenia
        return super().formfield_for_foreignkey(db_field, request, **kwargs)

    # ------- Práva (garant má CRUD len nad svojimi praxami) -------
    def has_view_permission(self, request, obj=None):
        if obj is None:
            return True
        if getattr(request.user, "rola", None) == User.ROLE_GARANT and not request.user.is_superuser:
            return obj.garant_id == request.user.id
        return True

    def has_change_permission(self, request, obj=None):
        if obj is None:
            return True
        if getattr(request.user, "rola", None) == User.ROLE_GARANT and not request.user.is_superuser:
            return obj.garant_id == request.user.id
        return True

    def has_delete_permission(self, request, obj=None):
        if obj is None:
            return True
        if getattr(request.user, "rola", None) == User.ROLE_GARANT and not request.user.is_superuser:
            return obj.garant_id == request.user.id
        return True

    def has_add_permission(self, request):
        # garant môže pridávať nové praxe
        return True
