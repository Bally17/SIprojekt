from django.db import models

class Prax(models.Model):
    SEMESTER_CHOICES = [('zimny', 'Zimný'), ('letny', 'Letný')]
    STAV_CHOICES = [
        ('vytvorena', 'Vytvorená'), ('potvrdena', 'Potvrdená'),
        ('zamietnuta', 'Zamietnutá'), ('schvalena', 'Schválená'),
        ('obhajena', 'Obhájená'), ('neobhajena', 'Neobhájená')
    ]
    
    student = models.ForeignKey('users.User', on_delete=models.CASCADE, db_column='student_id')
    firma = models.ForeignKey('companies.Firma', on_delete=models.CASCADE, db_column='firma_id')
    garant = models.ForeignKey('users.User', on_delete=models.SET_NULL, blank=True, null=True, db_column='garant_id', related_name='garantovane_praxe')
    rok = models.IntegerField()
    semester = models.CharField(max_length=10, choices=SEMESTER_CHOICES)
    datum_zaciatku = models.DateField()
    datum_konca = models.DateField()
    stav = models.CharField(max_length=20, choices=STAV_CHOICES, default='vytvorena')
    vytvorene_at = models.DateTimeField(auto_now_add=True)
    zmenene_at = models.DateTimeField(auto_now=True)

    class Meta:
        managed = False
        db_table = 'praxe'

class HistoriaStavovPraxe(models.Model):
    # Pridajte STAV_CHOICES aj sem alebo importujte z Prax
    STAV_CHOICES = [
        ('vytvorena', 'Vytvorená'), ('potvrdena', 'Potvrdená'),
        ('zamietnuta', 'Zamietnutá'), ('schvalena', 'Schválená'),
        ('obhajena', 'Obhájená'), ('neobhajena', 'Neobhájená')
    ]
    
    prax = models.ForeignKey(Prax, on_delete=models.CASCADE, db_column='prax_id')
    stary_stav = models.CharField(max_length=20, choices=STAV_CHOICES, blank=True, null=True)
    novy_stav = models.CharField(max_length=20, choices=STAV_CHOICES)
    zmenil = models.ForeignKey('users.User', on_delete=models.SET_NULL, blank=True, null=True, db_column='zmenil_id')
    poznamka = models.TextField(blank=True, null=True)
    zmena_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        managed = False
        db_table = 'historia_stavov_praxe'
