from .settings import *  # noqa: F401,F403

# Pouzi PostgreSQL test DB klonovanu zo skutocnej DB.
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": os.getenv("POSTGRES_DB", "praxy_db"),
        "USER": os.getenv("POSTGRES_USER", "postgres"),
        "PASSWORD": os.getenv("POSTGRES_PASSWORD", "postgres"),
        "HOST": os.getenv("POSTGRES_HOST", "db"),
        "PORT": os.getenv("POSTGRES_PORT", "5432"),
        "TEST": {
            "NAME": os.getenv("POSTGRES_TEST_DB", "test_praxy_db"),
            "MIGRATE": False,
        },
    }
}

# Neposielat realne emaily pocas testov.
EMAIL_BACKEND = "django.core.mail.backends.locmem.EmailBackend"
