# apps/authentication/utils.py
import secrets
import string
from django.core.mail import send_mail
from django.conf import settings
from django.core.signing import Signer

signer = Signer()

def generate_random_password(length=10):
    """Vygeneruje náhodné bezpečné heslo (kombinácia písmen, čísiel a symbolov)."""
    alphabet = string.ascii_letters + string.digits + string.punctuation
    return ''.join(secrets.choice(alphabet) for _ in range(length))


def send_password_email(email, password):
    """Odošle e-mail so zadaným heslom študentovi."""
    subject = "Váš účet bol vytvorený – Študentská prax"
    message = (
        f"Dobrý deň,\n\n"
        f"Váš účet bol úspešne vytvorený.\n"
        f"Prihlasovacie údaje:\n\n"
        f"Email: {email}\n"
        f"Heslo: {password}\n\n"
        f"Po prihlásení si, prosím, heslo zmeňte (vyžadované systémom).\n\n"
        f"S pozdravom,\n"
        f"Tím Študentskej praxe"
    )

    send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [email], fail_silently=False)


def send_activation_email(user, password=None):
    """Odošle firme aktivačný e-mail s odkazom a voliteľným heslom."""
    token = signer.sign(user.email)
    activation_link = f"{settings.FRONTEND_URL}/auth/activate/{token}/"
    subject = "Aktivácia firemného účtu – Študentská prax"
    message = (
        "Dobrý deň,\n\n"
        "Váš firemný účet bol úspešne vytvorený, ale je zatiaľ neaktívny.\n"
        "Pre aktiváciu účtu kliknite na nasledujúci odkaz:\n\n"
        f"{activation_link}\n\n"
    )
    if password:
        message += (
            "Po aktivácii Vám bude umožnené prihlásenie s dočasným heslom, ktoré si následne zmeňte.\n\n"
            f"Email: {user.email}\n"
            f"Heslo: {password}\n\n"
        )
    message += "S pozdravom,\nTím Študentskej praxe"

    send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [user.email], fail_silently=False)
def send_password_reset_email(user, reset_link):
    """Odošle používateľovi link na obnovenie hesla."""
    greeting = user.meno or user.email
    subject = "Obnovenie hesla – Študentská prax"
    message = (
        f"Dobrý deň {greeting},\n\n"
        f"Dostali sme požiadavku na obnovu Vášho hesla. Pokračujte kliknutím na odkaz:\n\n"
        f"{reset_link}\n\n"
        f"Ak ste o reset nepožiadali, tento email môžete ignorovať.\n\n"
        f"Tím Študentskej praxe"
    )

    send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [user.email], fail_silently=False)
