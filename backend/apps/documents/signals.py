from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver

from common.cache import invalidate_prax_cache
from .models import Dokument


@receiver(post_save, sender=Dokument)
def invalidate_cache_on_document_save(sender, instance, **kwargs):
    invalidate_prax_cache(instance.prax_id)


@receiver(post_delete, sender=Dokument)
def invalidate_cache_on_document_delete(sender, instance, **kwargs):
    invalidate_prax_cache(instance.prax_id)
