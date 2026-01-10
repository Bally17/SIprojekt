"""Internship models mapped to existing database tables."""
from django.db import models

class Prax(models.Model):
    """Internship record mapped to 'praxe'."""
    SEMESTER_ZIMNY = "zimny"
    SEMESTER_LETNY = "letny"
    SEMESTER_CHOICES = [(SEMESTER_ZIMNY, 'Zimný'), (SEMESTER_LETNY, 'Letný')]

    FORMA_DOHODA = "dohoda"
    FORMA_ZAMESTNANIE = "zamestnanie"
    FORMA_CHOICES = [
        (FORMA_DOHODA, 'Dohoda o odbornej praxi'),
        (FORMA_ZAMESTNANIE, 'Platené zamestnanie'),
    ]

    STAV_VYTVORENA = "vytvorena"
    STAV_POTVRDENA = "potvrdena"
    STAV_ZAMIETNUTA = "zamietnuta"
    STAV_SCHVALENA = "schvalena"
    STAV_OBHAJENA = "obhajena"
    STAV_NEOBHAJENA = "neobhajena"
    STAV_CHOICES = [
        (STAV_VYTVORENA, 'Vytvorená'), (STAV_POTVRDENA, 'Potvrdená'),
        (STAV_ZAMIETNUTA, 'Zamietnutá'), (STAV_SCHVALENA, 'Schválená'),
        (STAV_OBHAJENA, 'Obhájená'), (STAV_NEOBHAJENA, 'Neobhájená')
    ]
    
    student = models.ForeignKey('users.User', on_delete=models.CASCADE, db_column='student_id')
    firma = models.ForeignKey('companies.Firma', on_delete=models.CASCADE, db_column='firma_id')
    garant = models.ForeignKey('users.User', on_delete=models.SET_NULL, blank=True, null=True, db_column='garant_id', related_name='garantovane_praxe')
    rok = models.IntegerField()
    semester = models.CharField(max_length=10, choices=SEMESTER_CHOICES)
    datum_zaciatku = models.DateField()
    datum_konca = models.DateField()
    forma = models.CharField(max_length=20, choices=FORMA_CHOICES, default=FORMA_DOHODA)
    stav = models.CharField(max_length=20, choices=STAV_CHOICES, default=STAV_VYTVORENA)
    vytvorene_at = models.DateTimeField(auto_now_add=True)
    zmenene_at = models.DateTimeField(auto_now=True)

    class Meta:
        managed = False
        db_table = 'praxe'

class HistoriaStavovPraxe(models.Model):
    """History of internship status transitions."""
    STAV_CHOICES = Prax.STAV_CHOICES
    
    prax = models.ForeignKey(Prax, on_delete=models.CASCADE, db_column='prax_id')
    stary_stav = models.CharField(max_length=20, choices=STAV_CHOICES, blank=True, null=True)
    novy_stav = models.CharField(max_length=20, choices=STAV_CHOICES)
    zmenil = models.ForeignKey('users.User', on_delete=models.SET_NULL, blank=True, null=True, db_column='zmenil_id')
    poznamka = models.TextField(blank=True, null=True)
    zmena_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        managed = False
        db_table = 'historia_stavov_praxe'
