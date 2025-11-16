from .settings import *  # noqa: F401,F403

# Použi in-memory SQLite počas testov, aby nebolo treba docker Postgres.
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": BASE_DIR / "test_db.sqlite3",
    }
}

# Testy nepotrebujú reálne migrácie tretích strán, stačí syncdb zo schémy.
MIGRATION_MODULES = {
    "account": None,
    "socialaccount": None,
    "users": None,
    "companies": None,
    "documents": None,
    "internships": None,
    "notifications": None,
    "authentication": None,
}

# Neposielať reálne emaily počas testov
EMAIL_BACKEND = "django.core.mail.backends.locmem.EmailBackend"
