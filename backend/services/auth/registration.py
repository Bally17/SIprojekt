"""Registration service functions (no HTTP dependencies)."""
import re

from django.conf import settings
from django.contrib.auth.hashers import make_password
from django.contrib.auth.password_validation import validate_password
from django.core.mail import send_mail

from apps.companies.models import Firma
from apps.users.models import StudentProfil, User
from common.auth.context import activation_signer, ACTIVATION_TOKEN_MAX_AGE, generate_password

PHONE_REGEX = r"^[+0-9][0-9\\s\\-]{6,18}$"
LEGAL_FORMS_COMPACT = {"sro", "as", "vos", "ks", "spolsro"}


def _normalize_company_name(name: str) -> str:
    """Normalize company name for duplicate detection."""
    base = re.sub(r"[^a-z0-9]", "", (name or "").lower())
    for form in LEGAL_FORMS_COMPACT:
        if base.endswith(form):
            base = base[: -len(form)]
            break
    return base


def _generate_random_password(length: int = 10) -> str:
    """Generate a random password for company accounts."""
    import secrets
    import string

    alphabet = string.ascii_letters + string.digits + string.punctuation
    return "".join(secrets.choice(alphabet) for _ in range(length))


def _send_company_activation_email(user: User, password: str | None = None) -> None:
    """Send activation email to company users with optional password."""
    token = activation_signer.sign(user.email)
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


def register_student(validated_data: dict) -> dict:
    """Create a student account and send activation email."""
    generated_password = generate_password()

    studijny_program = validated_data.pop("studijny_program")
    validated_data.pop("password_confirm", None)
    validated_data.pop("password", None)
    alternativny_email = validated_data.pop("alternativny_email", None)

    user = User(
        email=validated_data["email"],
        rola=User.ROLE_STUDENT,
        meno=validated_data.get("meno"),
        priezvisko=validated_data.get("priezvisko"),
        telefon=validated_data.get("telefon"),
        adresa=validated_data.get("adresa"),
        alternativny_email=alternativny_email,
        musi_zmenit_heslo=True,
        heslo_hash=make_password(generated_password),
    )
    user.save()

    StudentProfil.objects.create(pouzivatel=user, studijny_program=studijny_program)

    user.aktivny = False
    user.email_overeny = False
    user.save(update_fields=["aktivny", "email_overeny"])

    _send_student_activation_email(user, generated_password)

    return {
        "user": user,
        "data": {
            "message": "Študent bol úspešne zaregistrovaný. Aktivačný email bol odoslaný.",
            "user_id": user.id,
            "email": user.email,
        },
    }


def _send_student_activation_email(user: User, password: str) -> None:
    """Send an activation email with a signed token and initial password."""
    token = activation_signer.sign(user.email)
    activation_link = f"{settings.FRONTEND_URL}/auth/activate/{token}/"

    subject = "Aktivácia účtu – Študentská prax"
    message = f"""
Dobrý deň {user.meno},

váš účet bol úspešne vytvorený.

Pre aktiváciu účtu kliknite na tento odkaz:
{activation_link}

Prihlasovacie údaje:
Email: {user.email}
Heslo: {password}

Po aktivácii sa, prosím, prihláste a zmeňte heslo.

S pozdravom,
Tím Študentskej praxe
"""
    send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [user.email])


def register_company(validated_data: dict) -> dict:
    """Create a company account and send activation credentials."""
    generated_password = _generate_random_password()

    password = generated_password
    nazov = validated_data.pop("nazov")
    kontaktna_osoba_meno = validated_data.pop("kontaktna_osoba_meno")
    kontaktna_osoba_email = validated_data.pop("kontaktna_osoba_email")
    kontaktna_osoba_telefon = validated_data.pop("kontaktna_osoba_telefon")

    normalized = _normalize_company_name(nazov)
    existing = {_normalize_company_name(n) for n in Firma.objects.values_list("nazov", flat=True)}
    if normalized in existing:
        return {
            "ok": False,
            "errors": {"nazov": ["Firma s týmto názvom už existuje."]},
        }

    meno_parts = kontaktna_osoba_meno.split(" ", 1)
    meno = meno_parts[0]
    priezvisko = meno_parts[1] if len(meno_parts) > 1 else ""

    user = User(
        email=validated_data["email"],
        rola=User.ROLE_FIRMA,
        meno=meno,
        priezvisko=priezvisko,
        telefon=kontaktna_osoba_telefon,
        adresa=validated_data.get("adresa"),
        alternativny_email=kontaktna_osoba_email,
        aktivny=False,
        email_overeny=False,
        musi_zmenit_heslo=True,
    )

    if password:
        validate_password(password)
        user.set_password(password)
    else:
        user.heslo_hash = None
    user.save()

    firma = Firma.objects.create(
        nazov=nazov,
        adresa=user.adresa,
        kontakt_meno=kontaktna_osoba_meno,
        kontakt_email=kontaktna_osoba_email,
        kontakt_telefon=kontaktna_osoba_telefon,
    )

    user.firma_id = firma.id
    user.save(update_fields=["firma_id"])

    user.musi_zmenit_heslo = True
    user.save(update_fields=["musi_zmenit_heslo"])

    _send_company_activation_email(user, generated_password)

    return {
        "ok": True,
        "user": user,
        "data": {
            "message": "Firma bola úspešne zaregistrovaná. Aktivačný email s údajmi bol odoslaný.",
            "user_id": user.id,
            "email": user.email,
            "status": "neaktívny - vyžaduje aktiváciu",
        },
    }


def activate_account(token: str) -> dict:
    """Activate an account from a signed token."""
    from django.core.signing import BadSignature, SignatureExpired

    try:
        email = activation_signer.unsign(token, max_age=ACTIVATION_TOKEN_MAX_AGE)
        user = User.objects.get(email=email)
        user.aktivny = True
        user.email_overeny = True
        user.save()
        return {"ok": True, "data": {"message": "Účet bol úspešne aktivovaný."}, "status": 200}
    except SignatureExpired:
        return {"ok": False, "data": {"error": "Aktivačný odkaz expiroval."}, "status": 400}
    except (User.DoesNotExist, BadSignature):
        return {"ok": False, "data": {"error": "Neplatný alebo expirovaný odkaz."}, "status": 400}


def complete_company_profile(user: User, data: dict) -> dict:
    """Complete company profile data for social-registered accounts."""
    if user.rola != User.ROLE_FIRMA:
        return {"ok": False, "data": {"error": "Only company users can complete company profile."}, "status": 403}

    meno_parts = data["kontaktna_osoba_meno"].split(" ", 1)
    meno = meno_parts[0]
    priezvisko = meno_parts[1] if len(meno_parts) > 1 else ""

    user.meno = meno
    user.priezvisko = priezvisko
    user.telefon = data["kontaktna_osoba_telefon"]
    user.adresa = data["adresa"]
    user.alternativny_email = data["kontaktna_osoba_email"]
    user.aktivny = True
    user.email_overeny = True
    user.musi_zmenit_heslo = False
    user.save(
        update_fields=[
            "meno",
            "priezvisko",
            "telefon",
            "adresa",
            "alternativny_email",
            "aktivny",
            "email_overeny",
            "musi_zmenit_heslo",
        ]
    )

    firma = None
    if user.firma_id:
        firma = Firma.objects.filter(id=user.firma_id).first()

    if firma:
        firma.nazov = data["nazov"]
        firma.adresa = data["adresa"]
        firma.kontakt_meno = data["kontaktna_osoba_meno"]
        firma.kontakt_email = data["kontaktna_osoba_email"]
        firma.kontakt_telefon = data["kontaktna_osoba_telefon"]
        firma.save()
    else:
        firma = Firma.objects.create(
            nazov=data["nazov"],
            adresa=data["adresa"],
            kontakt_meno=data["kontaktna_osoba_meno"],
            kontakt_email=data["kontaktna_osoba_email"],
            kontakt_telefon=data["kontaktna_osoba_telefon"],
        )
        user.firma_id = firma.id
        user.save(update_fields=["firma_id"])

    return {"ok": True, "user": user, "firma": firma, "status": 200}
