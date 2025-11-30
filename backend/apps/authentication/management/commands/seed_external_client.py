import json
from django.core.management.base import BaseCommand
from django.conf import settings

from apps.authentication.models import OAuthClient
from apps.users.models import User


class Command(BaseCommand):
    help = "Seed externý OAuth klient a service účet pre M2M integráciu"

    def add_arguments(self, parser):
        parser.add_argument(
            "--client-id",
            default=getattr(settings, "EXTERNAL_CLIENT_ID", "external-client"),
            help="client_id pre externý systém",
        )
        parser.add_argument(
            "--client-secret",
            default=getattr(settings, "EXTERNAL_CLIENT_SECRET", "super-secret"),
            help="client_secret pre externý systém (private client)",
        )
        parser.add_argument(
            "--service-email",
            default=getattr(settings, "EXTERNAL_SERVICE_EMAIL", "externy@skola.example"),
            help="Email service účtu s rolou externy",
        )
        parser.add_argument(
            "--redirect-uri",
            default="https://dummy.local/callback",
            help="Redirect URI (povinné pole v modeli, aj keď pri client_credentials sa nepoužíva)",
        )

    def handle(self, *args, **options):
        client_id = options["client_id"]
        client_secret = options["client_secret"]
        service_email = options["service_email"]
        redirect_uri = options["redirect_uri"]

        service_user, created_user = User.objects.get_or_create(
            email=service_email, defaults={"rola": User.ROLE_EXTERNY}
        )
        if created_user:
            self.stdout.write(self.style.SUCCESS(f"Vytvorený service user {service_email} (externy)"))
        else:
            self.stdout.write(self.style.WARNING(f"Service user {service_email} už existuje"))

        defaults = {
            "client_secret": client_secret,
            "name": "External Integration",
            "redirect_uris": json.dumps([redirect_uri]),
            "scope": "read write",
            "is_public": False,
            "allow_password_grant": False,
            "service_user": service_user,
            "is_active": True,
        }
        client, created_client = OAuthClient.objects.update_or_create(
            client_id=client_id, defaults=defaults
        )
        if created_client:
            msg = f"Vytvorený OAuth klient {client_id}"
        else:
            msg = f"Aktualizovaný OAuth klient {client_id}"
        self.stdout.write(self.style.SUCCESS(msg))
        self.stdout.write(self.style.SUCCESS(f"client_id={client.client_id} client_secret={client.client_secret}"))
