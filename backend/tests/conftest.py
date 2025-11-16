import pytest
from django.apps import apps


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
