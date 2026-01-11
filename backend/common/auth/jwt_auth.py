"""JWT helpers for cookie-based authentication."""
from django.conf import settings
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import AuthenticationFailed
from rest_framework_simplejwt.settings import api_settings


ACCESS_COOKIE_NAME = "access"
REFRESH_COOKIE_NAME = "refresh"

ACCESS_COOKIE_SAMESITE = "Lax"
REFRESH_COOKIE_SAMESITE = "Lax"

REFRESH_COOKIE_PATH = "/api/auth/"
ACCESS_COOKIE_PATH = "/"


def _cookie_domain():
    return getattr(settings, "COOKIE_DOMAIN", None)


def _secure_flag():
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
