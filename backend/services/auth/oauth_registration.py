"""OAuth-specific user creation and linking."""
from apps.users.models import User
from common.auth.context import generate_password
from infrastructure.email.auth import send_activation_email
from services.auth.token_issue import social_login_payload


def create_or_update_oauth_user(email: str, first_name: str, last_name: str, avatar: str | None, provider: str):
    """Create or update a user record from social provider data."""
    try:
        user = User.objects.get(email=email)
        if first_name and not user.meno:
            user.meno = first_name
        if last_name and not user.priezvisko:
            user.priezvisko = last_name
        user.save()
        created = False
    except User.DoesNotExist:
        user = User.objects.create_user(
            email=email,
            password=None,
            rola=User.ROLE_STUDENT,
            meno=first_name,
            priezvisko=last_name,
            musi_zmenit_heslo=False,
        )
        created = True

    return user, created


def register_company_from_oauth(
    *,
    email: str,
    requested_email: str | None,
    kontaktna_osoba_meno: str | None,
    kontaktna_osoba_email: str | None,
    kontaktna_osoba_telefon: str | None,
    adresa: str | None,
) -> dict:
    """Create or reuse a company user based on OAuth identity data."""
    if requested_email and requested_email.lower() != email.lower():
        return {"ok": False, "status": 400, "data": {"error": "Email from provider does not match request."}}

    try:
        user = User.objects.get(email=email)
        if user.rola != User.ROLE_FIRMA:
            return {"ok": False, "status": 400, "data": {"error": "User exists with different role."}}
        created = False
    except User.DoesNotExist:
        generated_password = generate_password()
        meno = None
        priezvisko = None
        if kontaktna_osoba_meno:
            meno_parts = kontaktna_osoba_meno.split(" ", 1)
            meno = meno_parts[0] if meno_parts else None
            priezvisko = meno_parts[1] if len(meno_parts) > 1 else None

        user = User(
            email=email,
            rola=User.ROLE_FIRMA,
            meno=meno,
            priezvisko=priezvisko,
            telefon=kontaktna_osoba_telefon or None,
            adresa=adresa or None,
            alternativny_email=kontaktna_osoba_email or None,
            aktivny=False,
            email_overeny=False,
            musi_zmenit_heslo=True,
        )
        user.set_password(generated_password)
        user.save()
        send_activation_email(user, generated_password)
        created = True

    payload = social_login_payload(user, created)
    return {"ok": True, "status": 201 if created else 200, "data": payload}
