from django.core.mail import send_mail
from django.conf import settings
from django.utils import timezone
from apps.notifications.models import Notifikacie
from apps.users.models import User

# ============================================
# 📬 Centrálna funkcia na generovanie notifikácií
# ============================================

def send_notification_email(prax, stav):
    """
    Automaticky vytvorí záznam v Notifikacie a odošle email
    podľa zmeny stavu praxe.
    """

    # === urči príjemcu (firma alebo študent) ===
    if hasattr(prax, "firma") and prax.firma:
        prijemca = prax.firma
    elif hasattr(prax, "student") and prax.student:
        prijemca = prax.student
    else:
        print("⚠️ Prax nemá priradeného príjemcu, notifikácia preskočená.")
        return None

    # === urči predmet a text podľa stavu ===
    predmet, sablona_kluc, text = get_notification_template(stav, prax)

    if not predmet:
        print(f"⚠️ Stav '{stav}' nemá definovanú notifikáciu.")
        return None

    # === ulož notifikáciu do DB ===
    notif = Notifikacie.objects.create(
        prax=prax,
        prijemca=prijemca,
        prijemca_email=prijemca.email,
        predmet=predmet,
        sablona_kluc=sablona_kluc,
        payload_json={"stav": stav, "prax_id": prax.id},
        stav="odoslane",
        odoslane_at=timezone.now(),
    )

    # === odošli email ===
    try:
        send_mail(
            predmet,
            text,
            settings.DEFAULT_FROM_EMAIL,
            [prijemca.email],
            fail_silently=False,
        )
        print(f"📧 Notifikácia odoslaná: {predmet} → {prijemca.email}")
    except Exception as e:
        notif.stav = "chyba"
        notif.save()
        print(f"❌ Chyba pri odosielaní emailu: {e}")

    return notif


# ============================================
# 🧩 Pomocná funkcia: šablóny notifikácií
# ============================================

def get_notification_template(stav, prax):
    """
    Podľa stavu praxe vygeneruje predmet, kľúč šablóny a text.
    """
    firma_nazov = getattr(prax.firma, "meno", "Vaša firma") if hasattr(prax, "firma") else "firma"
    student_meno = getattr(prax.student, "meno", "Študent") if hasattr(prax, "student") else "študent"

    templates = {
        "nova": {
            "predmet": "Nová žiadosť o prax",
            "sablona_kluc": "prax_nova",
            "text": f"Dobrý deň {firma_nazov},\n\nštudent {student_meno} podal žiadosť o prax. Prosím, prihláste sa do systému a potvrďte ju.\n\nTím Študentskej praxe"
        },
        "potvrdena_firmou": {
            "predmet": "Prax bola potvrdená firmou",
            "sablona_kluc": "prax_potvrdena_firmou",
            "text": f"Dobrý deň {student_meno},\n\nfirma {firma_nazov} potvrdila vašu prax. Čaká sa na schválenie garantom.\n\nTím Študentskej praxe"
        },
        "schvalena_garantom": {
            "predmet": "Prax bola schválená garantom",
            "sablona_kluc": "prax_schvalena_garantom",
            "text": f"Dobrý deň {student_meno},\n\ngarant schválil vašu prax vo firme {firma_nazov}. Prax je teraz aktívna.\n\nTím Študentskej praxe"
        },
        "zamietnuta": {
            "predmet": "Prax bola zamietnutá",
            "sablona_kluc": "prax_zamietnuta",
            "text": f"Dobrý deň,\n\nvaša prax bola zamietnutá. Pre viac informácií sa prihláste do systému.\n\nTím Študentskej praxe"
        },
        "ukoncena": {
            "predmet": "Prax bola ukončená",
            "sablona_kluc": "prax_ukoncena",
            "text": f"Dobrý deň {student_meno},\n\nprax vo firme {firma_nazov} bola úspešne ukončená. Gratulujeme!\n\nTím Študentskej praxe"
        },
    }

    template = templates.get(stav, None)
    if not template:
        return None, None, None

    return template["predmet"], template["sablona_kluc"], template["text"]
