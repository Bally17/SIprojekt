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
            self.stdout.write(self.style.SUCCESS(f"Default garant created: {DEFAULT_EMAIL}"))
        else:
            u.set_password(DEFAULT_PASS)
            u.rola = User.ROLE_GARANT
            u.aktivny = True
            u.email_overeny = True
            u.musi_zmenit_heslo = False
            u.save(update_fields=["heslo_hash", "rola", "aktivny", "email_overeny", "musi_zmenit_heslo"])
            self.stdout.write(self.style.WARNING(f"Default garant updated: {DEFAULT_EMAIL}"))

        GarantProfil.objects.update_or_create(
            pouzivatel=u,
            defaults={
                "pracovisko": "Rektorát",
                "organizacia": "Univerzita Konštantína Filozofa"
            }
        )

        u.refresh_from_db()

        self.stdout.write(self.style.SUCCESS("Default garant ready"))
