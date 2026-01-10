"""Signals for internship status history, notifications, and cache invalidation."""
from django.db.models.signals import pre_save, post_save, post_delete
from django.dispatch import receiver
from apps.internships.models import Prax, HistoriaStavovPraxe
from apps.notifications.models import Notifikacie
from apps.cache_utils import invalidate_prax_cache

STATUS_TEMPLATE_PRACTICE = "prax_zmena_stavu"

@receiver(pre_save, sender=Prax)
def cache_old_state(sender, instance, **kwargs):
    """Cache old status before saving to detect changes."""
    if instance.pk:
        try:
            old_instance = Prax.objects.get(pk=instance.pk)
            instance._old_stav = old_instance.stav
        except Prax.DoesNotExist:
            instance._old_stav = None


@receiver(post_save, sender=Prax)
def create_notification_on_status_change(sender, instance, created, **kwargs):
    """Create history and notifications when internship status changes."""
    if created:
        return  # pri vytvorení nič neposielame

    old_stav = getattr(instance, "_old_stav", None)
    new_stav = instance.stav

    # ak sa stav nezmenil, nič nerobíme
    if old_stav == new_stav:
        return

    # 🔹 zapíšeme históriu zmeny
    zmenil = getattr(instance, "_changed_by", getattr(instance, "garant", None))
    poznamka = getattr(instance, "_status_change_note", f"Automatická zmena stavu z {old_stav} na {new_stav}")

    HistoriaStavovPraxe.objects.create(
        prax=instance,
        stary_stav=old_stav,
        novy_stav=new_stav,
        zmenil=zmenil,
        poznamka=poznamka,
    )

    predmet = f"Zmena stavu praxe: {new_stav.capitalize()}"
    sablona_kluc = STATUS_TEMPLATE_PRACTICE
    payload = {"old": old_stav, "new": new_stav, "prax_id": instance.id}

    # 🔹 notifikácia pre študenta
    if instance.student and instance.student.email:
        Notifikacie.objects.create(
            prax_id=instance.id,
            prijemca_id=instance.student.id,
            prijemca_email=instance.student.email,
            predmet=predmet,
            sablona_kluc=sablona_kluc,
            payload_json=payload,
            stav=Notifikacie.STAV_NOVE,
        )

    # 🔹 notifikácia pre firmu
    if instance.firma and hasattr(instance.firma, "kontakt_email"):
        Notifikacie.objects.create(
            prax_id=instance.id,
            prijemca_email=instance.firma.kontakt_email,
            predmet=predmet,
            sablona_kluc=sablona_kluc,
            payload_json=payload,
            stav=Notifikacie.STAV_NOVE,
        )

    # 🔹 notifikácia pre garanta (len ak existuje)
    if instance.garant and instance.garant.email:
        Notifikacie.objects.create(
            prax_id=instance.id,
            prijemca_id=instance.garant.id,
            prijemca_email=instance.garant.email,
            predmet=predmet,
            sablona_kluc=sablona_kluc,
            payload_json=payload,
            stav=Notifikacie.STAV_NOVE,
        )

    # vyčisti pomocné atribúty, aby sa neprenášali do ďalších uložení
    if hasattr(instance, "_changed_by"):
        delattr(instance, "_changed_by")
    if hasattr(instance, "_status_change_note"):
        delattr(instance, "_status_change_note")


@receiver(post_save, sender=Prax)
def invalidate_prax_cache_on_save(sender, instance, **kwargs):
    """Invalidate cached internship data after save."""
    invalidate_prax_cache(instance.id)


@receiver(post_delete, sender=Prax)
def invalidate_prax_cache_on_delete(sender, instance, **kwargs):
    """Invalidate cached internship data after delete."""
    invalidate_prax_cache(instance.id)
