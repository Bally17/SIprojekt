from apps.notifications.models import Notifikacie
from django.utils import timezone


# ============================================
# 📨 Vytvorenie Notifikácie (bez odoslania emailu)
# - Email sa odošle v signals.py (post_save)
# ============================================

def create_notification(prax, prijemca, predmet, sablona_kluc, payload=None):
    """
    Vytvorí Notifikáciu – signál post_save sa postará o odoslanie emailu.
    """
    return Notifikacie.objects.create(
        prax=prax,
        prijemca=prijemca,
        prijemca_email=prijemca.email if prijemca else None,
        predmet=predmet,
        sablona_kluc=sablona_kluc,
        payload_json=payload or {},
        stav="nove",         # bude zmenené na "odoslane" v signals.py
        odoslane_at=None
    )


# ============================================
# 🧠 ŠABLÓNY FORMÁLNYCH EMAILOV
# ============================================

def get_notification_template(stav, prax):
    """
    Na základe stavu praxe vráti (predmet, šablona_kluc, text_emailu).
    """

    firma_nazov = getattr(prax.firma, "nazov", "firma")
    student_meno = getattr(prax.student, "meno", "študent")

    templates = {
        "nova": {
            "predmet": "Nová žiadosť o odbornú prax",
            "sablona_kluc": "prax_nova",
            "text": (
                f"Dobrý deň,\n\n"
                f"študent {student_meno} podal žiadosť o odbornú prax vo firme {firma_nazov}.\n"
                f"Prosíme o jej posúdenie a potvrdenie.\n\n"
                f"S pozdravom\n"
                f"Tím Študentských praxí"
            )
        },

        "potvrdena_firmou": {
            "predmet": "Odborná prax bola potvrdená firmou",
            "sablona_kluc": "prax_potvrdena_firmou",
            "text": (
                f"Dobrý deň,\n\n"
                f"firma {firma_nazov} potvrdila Vašu žiadosť o odbornú prax.\n"
                f"Prax čaká na schválenie garantom.\n\n"
                f"S pozdravom\n"
                f"Tím Študentských praxí"
            )
        },

        "zamietnuta_firmou": {
            "predmet": "Odborná prax bola zamietnutá firmou",
            "sablona_kluc": "prax_zamietnuta_firmou",
            "text": (
                f"Dobrý deň,\n\n"
                f"žiadame Vás o informáciu, že odborná prax bola zamietnutá firmou {firma_nazov}.\n"
                f"Pre viac informácií sa prosím prihláste do systému.\n\n"
                f"S pozdravom\n"
                f"Tím Študentských praxí"
            )
        },

        "schvalena_garantom": {
            "predmet": "Odborná prax bola schválená garantom",
            "sablona_kluc": "prax_schvalena_garantom",
            "text": (
                f"Dobrý deň,\n\n"
                f"garant schválil Vašu odbornú prax vo firme {firma_nazov}.\n"
                f"Prax je teraz aktívna.\n\n"
                f"S pozdravom\n"
                f"Tím Študentských praxí"
            )
        },

        "ukoncena": {
            "predmet": "Odborná prax bola ukončená",
            "sablona_kluc": "prax_ukoncena",
            "text": (
                f"Dobrý deň,\n\n"
                f"Vaša odborná prax vo firme {firma_nazov} bola úspešne ukončená.\n"
                f"Ďakujeme za spoluprácu.\n\n"
                f"S pozdravom\n"
                f"Tím Študentských praxí"
            )
        },
    }

    return templates.get(stav, None)
