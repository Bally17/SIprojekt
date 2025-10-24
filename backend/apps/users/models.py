from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager
from django.contrib.auth.hashers import check_password, make_password
import re
from django.core.exceptions import ValidationError


def validate_student_email(value):
    """
    Validácia študentského emailu - overenie formátu a domény
    """
    email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    if not re.match(email_pattern, value):
        raise ValidationError('Neplatný formát emailu.')
    
    allowed_student_domains = [
        'student.ukf.sk',
        'ukf.sk',
    ]
    
    email_domain = value.split('@')[1].lower()
    if email_domain not in allowed_student_domains:
        raise ValidationError(
            f'Povolené sú len študentské emaily z domén: {", ".join(allowed_student_domains)}'
        )
    
    return value


class CustomUserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('Email musí byť zadaný')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        if password:
            user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('rola', 'admin')
        extra_fields.setdefault('aktivny', True)
        return self.create_user(email, password, **extra_fields)


class User(AbstractBaseUser):
    ROLE_CHOICES = [
        ('student', 'Študent'),
        ('garant', 'Garant'), 
        ('firma', 'Firma'),
        ('externy', 'Externý'),
        ('admin', 'Admin'),
    ]
    
    id = models.BigAutoField(primary_key=True)
    rola = models.CharField(max_length=20, choices=ROLE_CHOICES)
    email = models.EmailField(unique=True, max_length=255)
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


    # Alias pre Django ORM (zabraňuje chybe "column password does not exist")
    @property
    def password(self):
        return self.heslo_hash

    @password.setter
    def password(self, raw_password):
        self.heslo_hash = make_password(raw_password)

    # Pre mapovanie Django polí
    @property
    def is_staff(self):
        return self.rola == 'admin'

    @is_staff.setter
    def is_staff(self, value):
    # ignorujeme, Django ho občas volá pri init
        pass


    @property
    def is_active(self):
        return self.aktivny

    @is_active.setter
    def is_active(self, value):
        self.aktivny = value


    @property
    def is_superuser(self):
        return self.rola == 'admin'

    @is_superuser.setter
    def is_superuser(self, value):
    # ignorujeme, Django ho občas volá
        pass


    @property
    def last_login(self):
        return self.posledne_prihlasenie

    @last_login.setter
    def last_login(self, value):
        self.posledne_prihlasenie = value

    objects = CustomUserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['meno', 'priezvisko']

    class Meta:
        managed = False
        db_table = 'pouzivatelia'

    def __str__(self):
        return self.email

    def get_full_name(self):
        return f"{self.meno} {self.priezvisko}".strip()

    def get_short_name(self):
        return self.meno

    def check_password(self, raw_password):
        if not self.heslo_hash:
            return False
        return check_password(raw_password, self.heslo_hash)

    def set_password(self, raw_password):
        self.heslo_hash = make_password(raw_password)

    def has_perm(self, perm, obj=None):
        return self.is_superuser

    def has_module_perms(self, app_label):
        return self.is_superuser


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
