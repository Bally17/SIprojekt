import logging
from smtplib import SMTPException

from django.db.models.signals import post_save
from django.dispatch import receiver
from django.core.mail import send_mail
from django.utils import timezone
from apps.notifications.models import Notifikacie
import time 

logger = logging.getLogger(__name__)

@receiver(post_save, sender=Notifikacie)
def send_notification_email(sender, instance, created, **kwargs):
    if created and instance.prijemca_email:
        time.sleep(0.5)
        subject = instance.predmet
        message = (
            f"Dobrý deň,\n\n"
            f"Bola zaznamenaná nová notifikácia v systéme Študentské praxe:\n\n"
            f"📌 {instance.predmet}\n\n"
            f"Zmena: {instance.payload_json}\n\n"
            f"S pozdravom,\n"
            f"Tím Študentských praxí"
        )

        try:
            send_mail(
                subject=subject,
                message=message,
                from_email="noreply@studentpraxe.sk",
                recipient_list=[instance.prijemca_email],
                fail_silently=False,
            )
        except (SMTPException, Exception) as exc:
            logger.warning("Notifikácia %s sa nepodarila odoslať: %s", instance.id, exc)
            instance.stav = "zlyhalo"
            instance.save(update_fields=["stav"])
            return

        instance.odoslane_at = timezone.now()
        instance.stav = "odoslane"
        instance.save(update_fields=["odoslane_at", "stav"])
