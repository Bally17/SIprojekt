# apps/users/signals.py
from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import User, GarantProfil

@receiver(post_save, sender=User)
def ensure_garant_profile(sender, instance: User, created, **kwargs):
    if instance.rola == "garant":
        GarantProfil.objects.get_or_create(pouzivatel=instance)
