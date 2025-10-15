from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin

class CustomUserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('Email musí byť zadaný')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(email, password, **extra_fields)

class User(AbstractBaseUser, PermissionsMixin):
    ROLE_CHOICES = [
        ('student', 'Študent'),
        ('garant', 'Garant'), 
        ('firma', 'Firma'),
        ('externy', 'Externý'),
    ]
    
    email = models.EmailField(unique=True, max_length=255)
    rola = models.CharField(max_length=20, choices=ROLE_CHOICES)
    alternativny_email = models.EmailField(blank=True, null=True)
    heslo_hash = models.TextField(blank=True, null=True)
    meno = models.CharField(max_length=100, blank=True, null=True)
    priezvisko = models.CharField(max_length=100, blank=True, null=True)
    telefon = models.CharField(max_length=30, blank=True, null=True)
    adresa = models.TextField(blank=True, null=True)
    firma_id = models.BigIntegerField(blank=True, null=True)
    aktivny = models.BooleanField(default=True)
    email_overeny = models.BooleanField(default=False)
    musi_zmenit_heslo = models.BooleanField(default=True)
    posledne_prihlasenie = models.DateTimeField(blank=True, null=True)
    vytvorene_at = models.DateTimeField(auto_now_add=True)
    zmenene_at = models.DateTimeField(auto_now=True)
    
    is_staff = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    
    objects = CustomUserManager()
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []

    class Meta:
        managed = False
        db_table = 'pouzivatelia'

class StudentProfil(models.Model):
    pouzivatel = models.OneToOneField(User, on_delete=models.CASCADE, primary_key=True, db_column='pouzivatel_id')
    studijny_program = models.CharField(max_length=150)

    class Meta:
        managed = False
        db_table = 'student_profil'

class GarantProfil(models.Model):
    pouzivatel = models.OneToOneField(User, on_delete=models.CASCADE, primary_key=True, db_column='pouzivatel_id')
    titul_pred = models.CharField(max_length=50, blank=True, null=True)
    titul_za = models.CharField(max_length=50, blank=True, null=True)
    pracovisko = models.CharField(max_length=150, blank=True, null=True)
    organizacia = models.CharField(max_length=150, blank=True, null=True)
    konzultacne_hodiny = models.CharField(max_length=150, blank=True, null=True)
    poznamka = models.TextField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'garant_profil'
