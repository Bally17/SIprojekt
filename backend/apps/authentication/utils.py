# apps/authentication/utils.py
import secrets
import string
from django.core.mail import send_mail
from django.conf import settings
from django.core.signing import TimestampSigner

# ---- tvoje pôvodné utily ----------------------------------------------------
activation_signer = TimestampSigner()

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

def send_password_reset_email(user, reset_link):
    """Odošle používateľovi link na obnovenie hesla."""
    greeting = getattr(user, "meno", None) or user.email
    subject = "Obnovenie hesla – Študentská prax"
    message = (
        f"Dobrý deň {greeting},\n\n"
        f"Dostali sme požiadavku na obnovu Vášho hesla. Pokračujte kliknutím na odkaz:\n\n"
        f"{reset_link}\n\n"
        f"Ak ste o reset nepožiadali, tento email môžete ignorovať.\n\n"
        f"Tím Študentskej praxe"
    )
    send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [user.email], fail_silently=False)

# ---- JWT cez HttpOnly cookies (nové) ----------------------------------------
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import AuthenticationFailed
from rest_framework_simplejwt.settings import api_settings

# Názvy a parametre cookies
ACCESS_COOKIE_NAME = "access"
REFRESH_COOKIE_NAME = "refresh"

# Ak FE a BE zdieľajú eTLD+1 (napr. app.example.com + api.example.com) ponechaj "Lax".
# Ak sú na rôznych doménach (napr. vercel.app ↔ api.example.com), zmeň na "None"
# a uisti sa, že ide všetko cez HTTPS.
ACCESS_COOKIE_SAMESITE = "Lax"
REFRESH_COOKIE_SAMESITE = "Lax"

# Voliteľne môžeš dať menší scope pre refresh cookie:
REFRESH_COOKIE_PATH = "/api/auth/"
ACCESS_COOKIE_PATH = "/"

def _cookie_domain():
    # nastav v settings.py: COOKIE_DOMAIN = ".example.com" ak zdieľate doménu
    return getattr(settings, "COOKIE_DOMAIN", None)

def _secure_flag():
    # v produkcii musí byť True (HTTPS)
    return not getattr(settings, "DEBUG", False)

def set_token_cookies(response, access_token: str, refresh_token: str | None = None):
    """Nastaví HttpOnly Secure cookies pre access a refresh token."""
    response.set_cookie(
        key=ACCESS_COOKIE_NAME,
        value=str(access_token),
        max_age=int(settings.SIMPLE_JWT["ACCESS_TOKEN_LIFETIME"].total_seconds()),
        httponly=True,
        secure=_secure_flag(),
        samesite=ACCESS_COOKIE_SAMESITE,
        domain=_cookie_domain(),
        path=ACCESS_COOKIE_PATH,
    )
    if refresh_token:
        response.set_cookie(
            key=REFRESH_COOKIE_NAME,
            value=str(refresh_token),
            max_age=int(settings.SIMPLE_JWT["REFRESH_TOKEN_LIFETIME"].total_seconds()),
            httponly=True,
            secure=_secure_flag(),
            samesite=REFRESH_COOKIE_SAMESITE,
            domain=_cookie_domain(),
            path=REFRESH_COOKIE_PATH,
        )
    return response

def clear_token_cookies(response):
    """Vymaže obidve cookies (access, refresh)."""
    response.delete_cookie(
        key=ACCESS_COOKIE_NAME,
        domain=_cookie_domain(),
        path=ACCESS_COOKIE_PATH,
    )
    response.delete_cookie(
        key=REFRESH_COOKIE_NAME,
        domain=_cookie_domain(),
        path=REFRESH_COOKIE_PATH,
    )
    return response

class CookieJWTAuthentication(JWTAuthentication):
    """
    Autentifikácia cez JWT uložené v HttpOnly 'access' cookie.
    Ak cookie chýba, skúsi Authorization: Bearer <token>.
    """
    def authenticate(self, request):
        raw_token = request.COOKIES.get(ACCESS_COOKIE_NAME)
        if raw_token:
            validated_token = self.get_validated_token(raw_token)
            return self.get_user(validated_token), validated_token
        return super().authenticate(request)


class AllowInactiveJWTAuthentication(JWTAuthentication):
    """JWT auth that allows inactive users (used for profile completion)."""

    def get_user(self, validated_token):
        try:
            user_id = validated_token[api_settings.USER_ID_CLAIM]
        except KeyError as exc:
            raise AuthenticationFailed("Invalid token", code="token_not_valid") from exc

        try:
            user = self.user_model.objects.get(**{api_settings.USER_ID_FIELD: user_id})
        except self.user_model.DoesNotExist as exc:
            raise AuthenticationFailed("User not found", code="user_not_found") from exc

        return user
