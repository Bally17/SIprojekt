"""Admin configuration for user models and audit logs."""
from django.contrib import admin, messages
from django.utils.translation import gettext_lazy as _
from django.db import transaction
from django.contrib.admin.models import LogEntry
from .models import User, StudentProfil, GarantProfil
from .forms import GarantCreateForm
from .utils import generate_strong_password, send_garant_credentials_email
from django.contrib import admin
from apps.users.forms import EmailAdminLoginForm

admin.site.login_form = EmailAdminLoginForm

admin.site.site_header = "UKF Admin"
admin.site.site_title = "UKF Admin"
admin.site.index_title = "Prehľad"

# ---------- Audit Log (len na čítanie) ----------
@admin.register(LogEntry)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ("action_time", "user", "content_type", "object_repr", "action_flag")
    list_filter = ("action_flag", "content_type")
    date_hierarchy = "action_time"
    search_fields = ("object_repr", "change_message", "user__email")
    readonly_fields = [f.name for f in LogEntry._meta.fields]

    def has_add_permission(self, request): return False
    def has_change_permission(self, request, obj=None): return False
    def has_delete_permission(self, request, obj=None): return False


# ---------- User ----------
@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = (
        "id", "email", "rola", "meno", "priezvisko",
        "aktivny", "email_overeny", "heslo_bolo_aktualizovane",
        "firma_id", "posledne_prihlasenie", "vytvorene_at",
    )
    list_filter = ("rola", "aktivny", "email_overeny", "musi_zmenit_heslo")
    search_fields = ("email", "meno", "priezvisko")
    ordering = ("-vytvorene_at",)
    readonly_fields = ("vytvorene_at", "zmenene_at", "posledne_prihlasenie")

    fieldsets = (
        (_("Základ"), {
            "fields": ("email", "rola", "meno", "priezvisko", "telefon", "adresa", "firma_id")
        }),
        (_("Stav & Bezpečnosť"), {
            "fields": ("aktivny", "email_overeny", "musi_zmenit_heslo")
        }),
        (_("Meta"), {
            "fields": ("posledne_prihlasenie", "vytvorene_at", "zmenene_at")
        }),
    )

    # --- vlastné add form len pre garanta ---
    add_form = GarantCreateForm
    add_fieldsets = (
        (_("Nový garant"), {
            "classes": ("wide",),
            "fields": ("email", "meno", "priezvisko",),
        }),
    )

    def get_fieldsets(self, request, obj=None):
        if obj is None and request.GET.get("as_garant") == "1":
            return self.add_fieldsets
        return super().get_fieldsets(request, obj)

    def get_form(self, request, obj=None, **kwargs):
        # ak klikneš na "Pridať garanta" (custom link), použije sa GarantCreateForm
        if obj is None and request.GET.get("as_garant") == "1":
            kwargs["form"] = self.add_form
        return super().get_form(request, obj, **kwargs)

    # --- bezpečné mazanie: nesmie zostať 0 garantov ---
    def has_delete_permission(self, request, obj=None):
        if obj and obj.rola == User.ROLE_GARANT:
            if User.objects.filter(rola=User.ROLE_GARANT).count() <= 1:
                return False
        return super().has_delete_permission(request, obj)

    def delete_queryset(self, request, queryset):
        garant_qs = queryset.filter(rola=User.ROLE_GARANT)
        if garant_qs.exists():
            remaining = User.objects.filter(rola=User.ROLE_GARANT).exclude(id__in=garant_qs.values("id")).count()
            if remaining < 1:
                self.message_user(request, "Nedá sa zmazať posledného garanta.", level=messages.ERROR)
                # zmažeme všetko okrem garantov ak existujú iné v querysete
                other = queryset.exclude(id__in=garant_qs.values("id"))
                return super().delete_queryset(request, other)
        return super().delete_queryset(request, queryset)

    @admin.display(boolean=True, description="Heslo bolo aktualizované")
    def heslo_bolo_aktualizovane(self, obj):
        return not obj.musi_zmenit_heslo

    @transaction.atomic
    def save_model(self, request, obj, form, change):
        """
        - Ak vytvárame nového garanta (add flow), vygeneruj heslo, nastav a pošli email.
        - Ak editujeme používateľa, normálne ulož.
        - Zabezpeč GarantProfil existenciu.
        """
        creating = obj.pk is None
        if creating and isinstance(form, GarantCreateForm):
            # garant sa vytvára
            obj.rola = User.ROLE_GARANT
            obj.aktivny = True
            obj.email_overeny = True
            obj.musi_zmenit_heslo = False
            password = generate_strong_password(12)
            obj.set_password(password)
            super().save_model(request, obj, form, change=False)

            GarantProfil.objects.get_or_create(
                pouzivatel=obj,
                defaults={
                    "pracovisko": form.cleaned_data.get("pracovisko") or "",
                    "organizacia": form.cleaned_data.get("organizacia") or "",
                },
            )

            try:
                send_garant_credentials_email(obj, password)
                self.message_user(request, f"Nový garant vytvorený. Heslo odoslané na {obj.email}.", level=messages.SUCCESS)
            except Exception as e:
                self.message_user(request, f"Garant vytvorený, no e-mail sa nepodarilo odoslať: {e}", level=messages.WARNING)
            return

        # bežný update / create iných rolí
        super().save_model(request, obj, form, change)

    # --- akčné tlačidlo v hornom menu: "Pridať garanta" ---
    def changelist_view(self, request, extra_context=None):
        extra_context = extra_context or {}
        extra_context["add_garant_url"] = f"{request.path}add/?as_garant=1"
        return super().changelist_view(request, extra_context=extra_context)
