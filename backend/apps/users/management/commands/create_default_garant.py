from django.core.management.base import BaseCommand
from django.conf import settings
from apps.users.models import User, GarantProfil

DEFAULT_EMAIL = getattr(settings, "DEFAULT_GARANT_EMAIL", None)
DEFAULT_PASS = getattr(settings, "DEFAULT_GARANT_PASSWORD", None)

class Command(BaseCommand):
    help = "Vytvorí defaultného garanta, ak neexistuje, alebo obnoví heslo."

    def handle(self, *args, **options):
        u = User.objects.filter(email=DEFAULT_EMAIL).first()

        if not u:
            # ✅ Vytvorenie garanta
            u = User.objects.create_user(
                email=DEFAULT_EMAIL,
                password=DEFAULT_PASS,
                meno="Hlavný",
                priezvisko="Garant",
                rola=User.ROLE_GARANT,
                aktivny=True,
                email_overeny=True,
                musi_zmenit_heslo=False,
            )
            self.stdout.write(self.style.SUCCESS(
                f"✅ Garant vytvorený: {DEFAULT_EMAIL} / {DEFAULT_PASS}"
            ))
        else:
            # ✅ Obnova hesla
            u.set_password(DEFAULT_PASS)
            u.rola = User.ROLE_GARANT
            u.aktivny = True
            u.email_overeny = True
            u.musi_zmenit_heslo = False
            u.save(update_fields=["heslo_hash", "rola", "aktivny", "email_overeny", "musi_zmenit_heslo"])
            self.stdout.write(self.style.WARNING(
                f"♻️ Garant existoval — heslo obnovené: {DEFAULT_EMAIL} / {DEFAULT_PASS}"
            ))

        # ✅ Garant Profil (create or update)
        GarantProfil.objects.update_or_create(
            pouzivatel=u,
            defaults={
                "pracovisko": "Rektorát",
                "organizacia": "Univerzita Konštantína Filozofa"
            }
        )

        # ✅ Pre istotu — refresh from DB
        u.refresh_from_db()

        self.stdout.write(self.style.SUCCESS("🔐 Garant pripravený pre admin login"))
