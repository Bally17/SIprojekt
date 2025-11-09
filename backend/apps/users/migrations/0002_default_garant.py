# apps/users/migrations/0002_default_garant.py
from django.db import migrations
import os
from django.contrib.auth.hashers import make_password

def create_default_garant(apps, schema_editor):
    User = apps.get_model("users", "User")
    GarantProfil = apps.get_model("users", "GarantProfil")

    email = os.getenv("DEFAULT_GARANT_EMAIL")
    password = os.getenv("DEFAULT_GARANT_PASSWORD")
    meno = os.getenv("DEFAULT_GARANT_FIRSTNAME", "Hlavny")
    priezvisko = os.getenv("DEFAULT_GARANT_LASTNAME", "Garant")
    pracovisko = os.getenv("DEFAULT_GARANT_WORKPLACE", "Rektorát")
    organizacia = os.getenv("DEFAULT_GARANT_ORG", "Univerzita Konštantína Filozofa")

    if not email or not password:
        # ENV neni – preskočíme (môžeš potom spraviť command)
        return

    if not User.objects.filter(email=email).exists():
        u = User.objects.create(
            email=email,
            heslo_hash=make_password(password),
            meno=meno,
            priezvisko=priezvisko,
            rola="garant",
            aktivny=True,
            email_overeny=True,
            musi_zmenit_heslo=False,
            is_superuser = True
        )
        GarantProfil.objects.get_or_create(
            pouzivatel=u,
            defaults={"pracovisko": pracovisko, "organizacia": organizacia},
        )

def remove_default_garant(apps, schema_editor):
    # necháme prázdne (nech to náhodou v produkcii nevymaže)
    pass

class Migration(migrations.Migration):

    dependencies = [
        ("users", "0001_initial"),
    ]

    operations = [
        migrations.RunPython(create_default_garant, remove_default_garant),
    ]
