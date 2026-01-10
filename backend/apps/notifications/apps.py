"""App configuration for notifications."""
from django.apps import AppConfig

class NotificationsConfig(AppConfig):
    """Django app config for notifications."""
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.notifications'

    def ready(self):
        import apps.notifications.signals
