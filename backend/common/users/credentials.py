"""Credential helpers for user provisioning."""
import secrets
import string

from django.conf import settings
from django.core.mail import send_mail


def generate_strong_password(length: int = 12) -> str:
    """Generate a strong random password."""
    alphabet = string.ascii_letters + string.digits + "!@#$%^&*()-_=+"
    return "".join(secrets.choice(alphabet) for _ in range(length))


def send_garant_credentials_email(user, password: str):
    """Email login credentials to a newly created garant user."""
    subject = "Váš prístup do systému – rola Garant"
    login_url = getattr(settings, "FRONTEND_URL", "http://localhost:3000")
    body = (
        f"Dobrý deň {user.meno or ''} {user.priezvisko or ''},\n\n"
        f"Bol vám vytvorený účet s rolou GARANT.\n\n"
        f"Prihlasovacie údaje:\n"
        f" - E-mail: {user.email}\n"
        f" - Heslo:  {password}\n\n"
        f"Po prihlásení si heslo prosím zmeňte v profile.\n"
        f"Prihlásenie: {login_url}\n\n"
        f"Pekný deň,\nUKF systém"
    )
    send_mail(
        subject=subject,
        message=body,
        from_email=getattr(settings, "DEFAULT_FROM_EMAIL", "noreply@example.com"),
        recipient_list=[user.email],
        fail_silently=False,
    )
