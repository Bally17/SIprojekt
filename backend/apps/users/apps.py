"""App configuration for users."""
from django.apps import AppConfig


class UsersConfig(AppConfig):
    """Django app config for users."""
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.users'

    def ready(self):
        import apps.users.signals
