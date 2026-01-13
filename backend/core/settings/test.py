"""Test settings overrides for Django."""
import os

from .base import *  # noqa: F401,F403

os.environ.setdefault("DJANGO_ENV", "test")

DATABASES = {
    "default": {
        "ENGINE": os.getenv("DB_ENGINE", "django.db.backends.postgresql"),
        "NAME": os.getenv("DB_NAME"),
        "USER": os.getenv("DB_USER"),
        "PASSWORD": os.getenv("DB_PASSWORD"),
        "HOST": os.getenv("DB_HOST"),
        "PORT": os.getenv("DB_PORT"),
        "TEST": {
            "NAME": os.getenv("DB_TEST_NAME", "test_db"),
            "MIGRATE": False,
        },
    }
}

EMAIL_BACKEND = "django.core.mail.backends.locmem.EmailBackend"
