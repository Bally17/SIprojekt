"""Signals for invalidating company-related cache entries."""
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver

from common.cache import invalidate_company_cache
from .models import Firma


@receiver(post_save, sender=Firma)
def invalidate_company_cache_on_save(sender, instance, **kwargs):
    """Invalidate company cache after create/update."""
    invalidate_company_cache()


@receiver(post_delete, sender=Firma)
def invalidate_company_cache_on_delete(sender, instance, **kwargs):
    """Invalidate company cache after delete."""
    invalidate_company_cache()
