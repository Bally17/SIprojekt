from django.db import models

class Firma(models.Model):
    nazov = models.CharField(unique=True, max_length=255)
    adresa = models.TextField(blank=True, null=True)
    kontakt_meno = models.CharField(max_length=150, blank=True, null=True)
    kontakt_email = models.CharField(max_length=255, blank=True, null=True)
    kontakt_telefon = models.CharField(max_length=30, blank=True, null=True)
    vytvorene_at = models.DateTimeField(auto_now_add=True)
    zmenene_at = models.DateTimeField(auto_now=True)

    class Meta:
        managed = False
        db_table = 'firmy'
