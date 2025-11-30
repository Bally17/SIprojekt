from django.db import models

class Dokument(models.Model):
    TYP_DOHODA = "dohoda"
    TYP_ZMLUVA = "zmluva"
    TYP_ZAMESTNANIE = "zamestnanie"
    TYP_VYKAZ = "vykaz"
    TYP_FAKTURA = "faktura"
    TYP_CHOICES = [
        (TYP_DOHODA, 'Dohoda'),
        (TYP_ZMLUVA, 'Zmluva'),
        (TYP_ZAMESTNANIE, 'Pracovná zmluva'),
        (TYP_VYKAZ, 'Výkaz'),
        (TYP_FAKTURA, 'Faktúra'),
    ]

    STAV_NAHRANY = "nahrany"
    STAV_POTVRDENY = "potvrdeny"
    STAV_ZAMIETNUTY = "zamietnuty"
    STAV_CHOICES = [
        (STAV_NAHRANY, 'Nahraný'),
        (STAV_POTVRDENY, 'Potvrdený'),
        (STAV_ZAMIETNUTY, 'Zamietnutý'),
    ]
    
    prax = models.ForeignKey('internships.Prax', on_delete=models.CASCADE, db_column='prax_id')
    typ_dokumentu = models.CharField(max_length=20, choices=TYP_CHOICES)
    subor_url = models.TextField()
    nahrane_pouzivatel = models.ForeignKey('users.User', on_delete=models.CASCADE, db_column='nahrane_pouzivatel_id')
    stav_dokumentu = models.CharField(max_length=20, choices=STAV_CHOICES, default=STAV_NAHRANY)
    skontroloval = models.ForeignKey('users.User', on_delete=models.SET_NULL, blank=True, null=True, db_column='skontroloval_id', related_name='skontrolovane_dokumenty')
    skontrolovane_at = models.DateTimeField(blank=True, null=True)
    vytvorene_at = models.DateTimeField(auto_now_add=True)
    zmenene_at = models.DateTimeField(auto_now=True)

    class Meta:
        managed = False
        db_table = 'dokumenty'
