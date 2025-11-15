from django.db import models

class Dokument(models.Model):
    TYP_CHOICES = [
        ('dohoda', 'Dohoda'),
        ('zmluva', 'Zmluva'),
        ('vykaz', 'Výkaz'),
    ]
    STAV_CHOICES = [('nahrany', 'Nahraný'), ('potvrdeny', 'Potvrdený'), ('zamietnuty', 'Zamietnutý')]
    
    prax = models.ForeignKey('internships.Prax', on_delete=models.CASCADE, db_column='prax_id')
    typ_dokumentu = models.CharField(max_length=10, choices=TYP_CHOICES)
    subor_url = models.TextField()
    nahrane_pouzivatel = models.ForeignKey('users.User', on_delete=models.CASCADE, db_column='nahrane_pouzivatel_id')
    stav_dokumentu = models.CharField(max_length=20, choices=STAV_CHOICES, default='nahrany')
    skontroloval = models.ForeignKey('users.User', on_delete=models.SET_NULL, blank=True, null=True, db_column='skontroloval_id', related_name='skontrolovane_dokumenty')
    skontrolovane_at = models.DateTimeField(blank=True, null=True)
    vytvorene_at = models.DateTimeField(auto_now_add=True)
    zmenene_at = models.DateTimeField(auto_now=True)

    class Meta:
        managed = False
        db_table = 'dokumenty'
