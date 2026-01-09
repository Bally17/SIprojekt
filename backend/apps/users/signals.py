from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver

from apps.cache_utils import invalidate_student_cache
from .models import User, StudentProfil


@receiver(post_save, sender=StudentProfil)
def invalidate_student_cache_on_profile_save(sender, instance, **kwargs):
    invalidate_student_cache()


@receiver(post_delete, sender=StudentProfil)
def invalidate_student_cache_on_profile_delete(sender, instance, **kwargs):
    invalidate_student_cache()


@receiver(post_save, sender=User)
def invalidate_student_cache_on_user_save(sender, instance, **kwargs):
    if getattr(instance, "rola", "") == User.ROLE_STUDENT:
        invalidate_student_cache()


@receiver(post_delete, sender=User)
def invalidate_student_cache_on_user_delete(sender, instance, **kwargs):
    if getattr(instance, "rola", "") == User.ROLE_STUDENT:
        invalidate_student_cache()
