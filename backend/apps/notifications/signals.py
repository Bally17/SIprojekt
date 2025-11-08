import logging
from smtplib import SMTPException

from django.db.models.signals import post_save
from django.dispatch import receiver
from django.core.mail import send_mail
from django.utils import timezone
from apps.notifications.models import Notifikacie

logger = logging.getLogger(__name__)

@receiver(post_save, sender=Notifikacie)
def send_notification_email(sender, instance, created, **kwargs):
    if not created:
        return
    
    # ak nemá komu poslať, skonči
    if not instance.prijemca_email:
        logger.info(f"🔕 Notifikácia {instance.id} vytvorená bez emailu – neodosiela sa.")
        return

    subject = instance.predmet

    # Payload JSON preformátujeme, ak existuje
    payload = ""
    if instance.payload_json:
        if isinstance(instance.payload_json, dict):
            for key, value in instance.payload_json.items():
                payload += f"- {key}: {value}\n"
        else:
            payload = str(instance.payload_json)

    message = (
        f"Dobrý deň,\n\n"
        f"Máte novú notifikáciu v systéme Študentské praxe:\n\n"
        f"📌 {instance.predmet}\n\n"
        f"{payload}\n"
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
        logger.warning(f"❌ Notifikácia {instance.id} sa nepodarila odoslať: {exc}")
        instance.stav = "zlyhalo"
        instance.save(update_fields=["stav"])
        return

    instance.odoslane_at = timezone.now()
    instance.stav = "odoslane"
    instance.save(update_fields=["odoslane_at", "stav"])

    logger.info(f"✅ Email notifikácia {instance.id} úspešne odoslaná na {instance.prijemca_email}")
