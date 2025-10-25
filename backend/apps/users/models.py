from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.contrib.auth.hashers import make_password, check_password
from django.core.exceptions import ValidationError
import re


def validate_student_email(value):
    email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    if not re.match(email_pattern, value):
        raise ValidationError('Neplatný formát emailu.')

    allowed_domains = ['student.ukf.sk', 'ukf.sk']
    domain = value.split('@')[1].lower()
    if domain not in allowed_domains:
        raise ValidationError(f"Povolené sú len domény: {', '.join(allowed_domains)}")
    return value


# ==============================================
#               USER MANAGER
# ==============================================
class CustomUserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("Email musí byť zadaný")
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        if password:
            user.set_password(password)
        else:
            user.set_password(BaseUserManager().make_random_password())
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('rola', 'admin')
        extra_fields.setdefault('aktivny', True)
        return self.create_user(email, password, **extra_fields)


# ==============================================
#               USER MODEL
# ==============================================
class User(AbstractBaseUser, PermissionsMixin):
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
    heslo_hash = models.TextField(blank=True, null=True, db_column='heslo_hash')  # ✅ reálne DB pole

    meno = models.CharField(max_length=100, blank=True, null=True)
    priezvisko = models.CharField(max_length=100, blank=True, null=True)
    telefon = models.CharField(max_length=30, blank=True, null=True)
    adresa = models.TextField(blank=True, null=True)
    firma_id = models.BigIntegerField(blank=True, null=True)

    aktivny = models.BooleanField(default=True)
    email_overeny = models.BooleanField(default=False)
    musi_zmenit_heslo = models.BooleanField(default=True)

    posledne_prihlasenie = models.DateTimeField(blank=True, null=True, db_column='posledne_prihlasenie')
    vytvorene_at = models.DateTimeField(auto_now_add=True)
    zmenene_at = models.DateTimeField(auto_now=True)

    objects = CustomUserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['meno', 'priezvisko']

    class Meta:
        db_table = 'pouzivatelia'
        managed = False  # 🔥 zachovávaš pôvodnú DB, Django nič nemení

    def __str__(self):
        return self.email

    # =========================================
    #             PROPERTY ALIASY
    # =========================================
    @property
    def password(self):
        """Django alias pre heslo"""
        return self.heslo_hash

    @password.setter
    def password(self, raw_password):
        self.heslo_hash = make_password(raw_password)

    @property
    def last_login(self):
        """Django alias pre posledné prihlásenie"""
        return self.posledne_prihlasenie

    @last_login.setter
    def last_login(self, value):
        self.posledne_prihlasenie = value

    # =========================================
    #             AUTH FLAGS
    # =========================================
    @property
    def is_active(self):
        return self.aktivny

    @property
    def is_staff(self):
        return self.rola == 'admin'

    @property
    def is_superuser(self):
        return self.rola == 'admin'

    # =========================================
    #             PASSWORD LOGIC
    # =========================================
    def set_password(self, raw_password):
        self.heslo_hash = make_password(raw_password)

    def check_password(self, raw_password):
        if not self.heslo_hash:
            return False
        return check_password(raw_password, self.heslo_hash)


# ==============================================
#              STUDENT PROFIL
# ==============================================
class StudentProfil(models.Model):
    pouzivatel = models.OneToOneField(User, on_delete=models.CASCADE, primary_key=True, db_column='pouzivatel_id')
    studijny_program = models.CharField(max_length=150)

    class Meta:
        db_table = 'student_profil'
        managed = False


# ==============================================
#               GARANT PROFIL
# ==============================================
class GarantProfil(models.Model):
    pouzivatel = models.OneToOneField(User, on_delete=models.CASCADE, primary_key=True, db_column='pouzivatel_id')
    titul_pred = models.CharField(max_length=50, blank=True, null=True)
    titul_za = models.CharField(max_length=50, blank=True, null=True)
    pracovisko = models.CharField(max_length=150, blank=True, null=True)
    organizacia = models.CharField(max_length=150, blank=True, null=True)
    konzultacne_hodiny = models.CharField(max_length=150, blank=True, null=True)
    poznamka = models.TextField(blank=True, null=True)

    class Meta:
        db_table = 'garant_profil'
        managed = False
