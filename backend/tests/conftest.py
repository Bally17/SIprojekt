import os
import pytest
from django.apps import apps

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "core.settings.test")

@pytest.fixture(autouse=True, scope="session")
def _make_unmanaged_models_managed():
    """
    In test mode we run against SQLite with syncdb, so models that are normally
    managed=False need to be marked managed to create tables.
    """
    target_apps = {"users", "companies", "documents", "internships", "notifications", "authentication"}
    for model in apps.get_models():
        if model._meta.app_label in target_apps:
            model._meta.managed = True


@pytest.fixture(autouse=True)
def _disable_migrations_for_core_apps(settings):
    """
    Disable migrations for unmanaged apps so Django's syncdb can create tables
    directly from models during test DB setup.
    """
    settings.MIGRATION_MODULES = {
        "users": None,
        "companies": None,
        "documents": None,
        "internships": None,
        "notifications": None,
        "authentication": None,
    }
