from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver

from apps.cache_utils import invalidate_company_cache
from .models import Firma


@receiver(post_save, sender=Firma)
def invalidate_company_cache_on_save(sender, instance, **kwargs):
    invalidate_company_cache()


@receiver(post_delete, sender=Firma)
def invalidate_company_cache_on_delete(sender, instance, **kwargs):
    invalidate_company_cache()
