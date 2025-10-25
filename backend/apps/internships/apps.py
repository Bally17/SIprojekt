from django.apps import AppConfig

class InternshipsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.internships'

    def ready(self):
        import apps.internships.signals
