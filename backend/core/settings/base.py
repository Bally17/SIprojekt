"""Django settings for the core project."""
from datetime import timedelta
import os
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()


def env_bool(name: str, default: bool = False) -> bool:
    """Parse boolean environment variables consistently."""
    value = os.getenv(name)
    if value is None:
        return default
    return value.lower() in ('true', '1', 'yes', 'on')


DJANGO_ENV = os.getenv('DJANGO_ENV', 'production').lower()

# -----------------------------------------------------------------------------
# ZÁKLAD
# -----------------------------------------------------------------------------
BASE_DIR = Path(__file__).resolve().parent.parent.parent

AUTH_USER_MODEL = 'users.User'

SECRET_KEY = os.getenv('SECRET_KEY', 'django-insecure-change-in-production')
DEBUG = env_bool('DEBUG', DJANGO_ENV != 'production')
if not DEBUG and SECRET_KEY == 'django-insecure-change-in-production':
    raise RuntimeError("SECRET_KEY must be set in production.")

ALLOWED_HOSTS = os.getenv('ALLOWED_HOSTS', 'localhost,127.0.0.1').split(',')

# Frontend URL (DEV: localhost:3000)
FRONTEND_URL = os.getenv('FRONTEND_URL', 'http://localhost:3000')
GITHUB_REDIRECT_URI = os.getenv(
    'GITHUB_REDIRECT_URI',
    'http://localhost:8000/api/auth/github/callback/',
)

# -----------------------------------------------------------------------------
# APLIKÁCIE
# -----------------------------------------------------------------------------
INSTALLED_APPS = [
    # Lokálne apps
    'users',
    'authentication',
    'companies',
    'documents',
    'internships',
    'notifications',

    # Django apps
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'django.contrib.sites',

    # 3rd party
    'rest_framework',
    'drf_yasg',
    'corsheaders',
    'django_filters',
    'allauth',
    'allauth.account',
    'allauth.socialaccount',
    'allauth.socialaccount.providers.google',
    'allauth.socialaccount.providers.github',
    'rest_framework_simplejwt.token_blacklist',  # migrate!
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',      # CORS najvyššie
    'django.middleware.security.SecurityMiddleware',
    'core.middleware.security_headers.SecurityHeadersMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',  # serve static files (e.g., swagger assets) in prod
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    # CSRF middleware môže ostať; s JWTAuthentication nevyžaduješ CSRF
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'allauth.account.middleware.AccountMiddleware',
]

ROOT_URLCONF = 'core.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / "templates"],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'core.wsgi.application'

# -----------------------------------------------------------------------------
# CACHE
# -----------------------------------------------------------------------------
REDIS_URL = os.getenv('REDIS_URL')
if REDIS_URL:
    CACHES = {
        'default': {
            'BACKEND': 'django_redis.cache.RedisCache',
            'LOCATION': REDIS_URL,
            'OPTIONS': {
                'CLIENT_CLASS': 'django_redis.client.DefaultClient',
            },
            'KEY_PREFIX': 'si_projekt',
        }
    }
else:
    CACHES = {
        'default': {
            'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
            'LOCATION': 'unique-snowflake',
        }
    }

CACHE_TTL_DETAIL = int(os.getenv('CACHE_TTL_DETAIL', 300))
CACHE_TTL_LIST = int(os.getenv('CACHE_TTL_LIST', 120))
CACHE_TTL_SEARCH = int(os.getenv('CACHE_TTL_SEARCH', 180))
CACHE_TTL_STATS = int(os.getenv('CACHE_TTL_STATS', 600))

# -----------------------------------------------------------------------------
# DATABÁZA
# -----------------------------------------------------------------------------
DATABASES = {
    'default': {
        'ENGINE': os.getenv('DB_ENGINE', 'django.db.backends.postgresql'),
        'NAME': os.getenv('DB_NAME', 'praxy_db'),
        'USER': os.getenv('DB_USER', 'postgres'),
        'PASSWORD': os.getenv('DB_PASSWORD', 'postgres'),
        'HOST': os.getenv('DB_HOST', 'db'),  # názov služby v docker-compose
        'PORT': os.getenv('DB_PORT', '5432'),
    }
}

# -----------------------------------------------------------------------------
# HESLÁ
# -----------------------------------------------------------------------------
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

# -----------------------------------------------------------------------------
# I18N
# -----------------------------------------------------------------------------
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

# -----------------------------------------------------------------------------
# STATIC/MEDIA
# -----------------------------------------------------------------------------
STATIC_URL = '/static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'
MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')
DOCUMENT_MAX_UPLOAD_SIZE = int(os.getenv("DOCUMENT_MAX_UPLOAD_SIZE", 10 * 1024 * 1024))

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# -----------------------------------------------------------------------------
# DJANGO-ALLAUTH
# -----------------------------------------------------------------------------
SITE_ID = 1
AUTHENTICATION_BACKENDS = [
    'django.contrib.auth.backends.ModelBackend',
    'allauth.account.auth_backends.AuthenticationBackend',
]

ACCOUNT_EMAIL_REQUIRED = True
ACCOUNT_USERNAME_REQUIRED = False
ACCOUNT_AUTHENTICATION_METHOD = 'email'
ACCOUNT_EMAIL_VERIFICATION = 'optional'
LOGIN_REDIRECT_URL = '/api/auth/success/'
LOGOUT_REDIRECT_URL = '/'

SOCIALACCOUNT_PROVIDERS = {
    'google': {
        'APP': {
            'client_id': os.getenv('GOOGLE_CLIENT_ID', ''),
            'secret': os.getenv('GOOGLE_CLIENT_SECRET', ''),
            'key': ''
        },
        'SCOPE': ['profile', 'email', 'openid'],
        'AUTH_PARAMS': {'access_type': 'online'},
    },
    'github': {
        'APP': {
            'client_id': os.getenv('GITHUB_CLIENT_ID', ''),
            'secret': os.getenv('GITHUB_CLIENT_SECRET', ''),
            'key': ''
        },
        'SCOPE': ['user:email', 'read:user'],
    }
}

# -----------------------------------------------------------------------------
# SWAGGER
# -----------------------------------------------------------------------------
SWAGGER_SETTINGS = {
    'SECURITY_DEFINITIONS': {
        'Bearer': {
            'type': 'apiKey',
            'name': 'Authorization',
            'in': 'header',
            'description': "Zadaj JWT token vo formáte:\n\n**Bearer &lt;tvoj_token&gt;**",
        }
    },
    'USE_SESSION_AUTH': False,
}

# -----------------------------------------------------------------------------
# DRF
# -----------------------------------------------------------------------------
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',  # Authorization: Bearer
    ),
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.UserRateThrottle',
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.ScopedRateThrottle',  # per-view scopes (login/reset/registration)
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': os.getenv('THROTTLE_RATE_ANON', '100/min'),
        'user': os.getenv('THROTTLE_RATE_USER', '300/min'),
        'login': os.getenv('THROTTLE_RATE_LOGIN', '20/min'),
        'password_reset': os.getenv('THROTTLE_RATE_PASSWORD_RESET', '10/min'),
        'registration': os.getenv('THROTTLE_RATE_REGISTRATION', '5/min'),
    },
    'DEFAULT_FILTER_BACKENDS': [
        'django_filters.rest_framework.DjangoFilterBackend',
        'rest_framework.filters.SearchFilter',
        'rest_framework.filters.OrderingFilter',
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
}

# -----------------------------------------------------------------------------
# JWT (SimpleJWT)
# -----------------------------------------------------------------------------
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=15),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=60),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'UPDATE_LAST_LOGIN': True,
    'ALGORITHM': 'HS256',
    'SIGNING_KEY': SECRET_KEY,
    'AUTH_HEADER_TYPES': ('Bearer',),
}

# -----------------------------------------------------------------------------
# CORS/CSRF (Bearer only, no auth cookies)
# -----------------------------------------------------------------------------
CORS_ALLOW_CREDENTIALS = True  # nepoužívame cookies na auth
CORS_ALLOWED_ORIGINS = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    FRONTEND_URL,
]
CORS_ALLOW_ALL_ORIGINS = DEBUG  # v DEV môžeš povoliť všetko (pomoc pri testovaní)

# CSRF je relevantné najmä s cookie/session auth. S JWT headerom nie je nutné.
# Necháme lokálne hodnoty pre dev ui/testy; v prod môžeš vypnúť alebo prispôsobiť.
CSRF_TRUSTED_ORIGINS = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    FRONTEND_URL.replace('https://', 'http://').replace('http://', 'http://'),
]

SESSION_COOKIE_SECURE = not DEBUG
CSRF_COOKIE_SECURE = not DEBUG

# -----------------------------------------------------------------------------
# EMAIL
# -----------------------------------------------------------------------------
EMAIL_BACKEND = os.getenv("EMAIL_BACKEND", "django.core.mail.backends.smtp.EmailBackend")
EMAIL_HOST = os.getenv("EMAIL_HOST", "sandbox.smtp.mailtrap.io")
EMAIL_PORT = int(os.getenv("EMAIL_PORT", 587))
EMAIL_USE_TLS = os.getenv("EMAIL_USE_TLS", "True").lower() == "true"
EMAIL_HOST_USER = os.getenv("EMAIL_HOST_USER")
EMAIL_HOST_PASSWORD = os.getenv("EMAIL_HOST_PASSWORD")
DEFAULT_FROM_EMAIL = os.getenv("DEFAULT_FROM_EMAIL", "noreply@studentpraxe.sk")

# -----------------------------------------------------------------------------
# LOGGING (toggleable via env)
# -----------------------------------------------------------------------------
LOGGING_ENABLED = os.getenv('LOGGING_ENABLED', 'true').lower() == 'true'
LOG_LEVEL = os.getenv('LOG_LEVEL', 'INFO')

LOGGING_BASE = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'simple': {
            'format': '%(asctime)s %(levelname)s %(name)s %(message)s',
        },
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'simple',
        },
    },
    'root': {
        'handlers': ['console'],
        'level': LOG_LEVEL,
    },
}

LOGGING_DISABLED = {
    'version': 1,
    'disable_existing_loggers': True,
    'handlers': {
        'null': {'class': 'logging.NullHandler'},
    },
    'root': {'handlers': ['null'], 'level': 'CRITICAL'},
}

LOGGING = LOGGING_BASE if LOGGING_ENABLED else LOGGING_DISABLED

# -----------------------------------------------------------------------------
# DOCKER ŠPECIFIKÁ
# -----------------------------------------------------------------------------
if os.getenv('DOCKER_CONTAINER'):
    ALLOWED_HOSTS.extend(['web', 'backend', '0.0.0.0'])
    LOGGING = LOGGING_BASE if LOGGING_ENABLED else LOGGING_DISABLED

# -----------------------------------------------------------------------------
# SECURITY (PROD hardening)
# -----------------------------------------------------------------------------
if not DEBUG:
    SECURE_SSL_REDIRECT = True
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
    SECURE_BROWSER_XSS_FILTER = True
    SECURE_CONTENT_TYPE_NOSNIFF = True
    SECURE_REFERRER_POLICY = "strict-origin-when-cross-origin"
    SESSION_COOKIE_SAMESITE = "Lax"

# CSP: enforce by default outside dev; override with CSP_ENFORCE=true/false.
CSP_ENFORCE = env_bool("CSP_ENFORCE", not DEBUG)
CSP_REPORT_ONLY = not CSP_ENFORCE
X_FRAME_OPTIONS = "DENY"

# -----------------------------------------------------------------------------
# DEFAULT GARANT (ENV)
# -----------------------------------------------------------------------------
DEFAULT_GARANT_EMAIL = os.getenv("DEFAULT_GARANT_EMAIL")
DEFAULT_GARANT_PASSWORD = os.getenv("DEFAULT_GARANT_PASSWORD")
DEFAULT_GARANT_FIRSTNAME = os.getenv("DEFAULT_GARANT_FIRSTNAME", "Hlavny")
DEFAULT_GARANT_LASTNAME = os.getenv("DEFAULT_GARANT_LASTNAME", "Garant")
DEFAULT_GARANT_WORKPLACE = os.getenv("DEFAULT_GARANT_WORKPLACE", "Rektorát")
DEFAULT_GARANT_ORG = os.getenv("DEFAULT_GARANT_ORG", "Univerzita Konštantína Filozofa")
