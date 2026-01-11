"""Custom user model and related profiles."""
import secrets
import re
import string

from django.contrib.auth.hashers import check_password, make_password
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager
from django.core.exceptions import ValidationError
from django.db import models


def validate_student_email(value):
    """Validate student email address and allowed domains."""
    email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    if not re.match(email_pattern, value):
        raise ValidationError('Neplatný formát emailu.')
    allowed_domains = ['student.ukf.sk', 'ukf.sk']
    domain = value.split('@')[1].lower()
    if domain not in allowed_domains:
        raise ValidationError(f"Povolené sú len domény: {', '.join(allowed_domains)}")
    return value


# ============================
#       USER MANAGER
# ============================
class CustomUserManager(BaseUserManager):
    """User manager that enforces roles and password generation."""
    use_in_migrations = False

    def _generate_random_password(self, length=12):
        """Generate a random password for new users."""
        chars = string.ascii_letters + string.digits + "!@#$%^&*()"
        return ''.join(secrets.choice(chars) for _ in range(length))

    def create_user(self, email, password=None, **extra_fields):
        """Create a user with a normalized email and default role."""
        if not email:
            raise ValueError("Email musí byť zadaný")
        email = self.normalize_email(email)
        extra_fields.setdefault('rola', User.ROLE_EXTERNY)

        user = self.model(email=email, **extra_fields)
        user.set_password(password or self._generate_random_password())
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        """Create a garant superuser with elevated flags."""
        # Garant = plné práva v admin rozhraní
        extra_fields.setdefault('rola', User.ROLE_GARANT)
        extra_fields.setdefault('aktivny', True)
        extra_fields.setdefault('email_overeny', True)
        extra_fields.setdefault('musi_zmenit_heslo', False)
        return self.create_user(email, password, **extra_fields)


# ============================
#         USER MODEL
# ============================
class User(AbstractBaseUser):
    """Custom user model mapped to existing database columns."""
    # zneplatní DB mapovanie na neexistujúce stĺpce
    password = None
    last_login = None

    ROLE_STUDENT = "student"
    ROLE_GARANT = "garant"
    ROLE_FIRMA = "firma"
    ROLE_EXTERNY = "externy"
    ROLE_ADMIN = "admin"  # historické

    ROLE_CHOICES = [
        (ROLE_STUDENT, 'Študent'),
        (ROLE_GARANT, 'Garant'),
        (ROLE_FIRMA, 'Firma'),
        (ROLE_EXTERNY, 'Externý'),
        (ROLE_ADMIN, 'Admin'),
    ]

    id = models.BigAutoField(primary_key=True)
    rola = models.CharField(max_length=20, choices=ROLE_CHOICES)
    email = models.EmailField(unique=True, max_length=255)
    alternativny_email = models.EmailField(blank=True, null=True)
    heslo_hash = models.TextField(blank=True, null=True, db_column='heslo_hash')

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
        managed = False

    def __str__(self):
        return self.email

    # --- aliasy/heslo ---
    def set_password(self, raw_password):
        """Hash and store the password in the legacy column."""
        self.heslo_hash = make_password(raw_password)

    def check_password(self, raw_password):
        """Verify a raw password against the stored hash."""
        return bool(self.heslo_hash) and check_password(raw_password, self.heslo_hash)

    @property
    def last_login(self):
        return self.posledne_prihlasenie

    @last_login.setter
    def last_login(self, value):
        self.posledne_prihlasenie = value

    # --- admin flagy ---
    @property
    def is_active(self):
        return self.aktivny

    @property
    def is_staff(self):
        return self.rola == self.ROLE_GARANT

    @property
    def is_superuser(self):
        return self.rola == self.ROLE_GARANT

    # minimal permissions API
    def has_perm(self, perm, obj=None):
        return self.is_superuser or self.is_staff

    def has_perms(self, perm_list, obj=None):
        return self.is_superuser or self.is_staff

    def has_module_perms(self, app_label):
        return self.is_superuser or self.is_staff


# ============================
#      STUDENT PROFIL
# ============================
class StudentProfil(models.Model):
    """Student profile linked to a user record."""
    pouzivatel = models.OneToOneField(User, on_delete=models.CASCADE, primary_key=True, db_column='pouzivatel_id')
    studijny_program = models.CharField(max_length=150)

    class Meta:
        db_table = 'student_profil'
        managed = False


# ============================
#      GARANT PROFIL
# ============================
class GarantProfil(models.Model):
    """Garant profile linked to a user record."""
    pouzivatel = models.OneToOneField(User, on_delete=models.CASCADE, primary_key=True, db_column='pouzivatel_id')
    titul_pred = models.CharField(max_length=50, blank=True, null=True)
    titul_za = models.CharField(max_length=50, blank=True, null=True)  # POZOR: oprav ak máš v DB max_length
    pracovisko = models.CharField(max_length=150, blank=True, null=True)
    organizacia = models.CharField(max_length=150, blank=True, null=True)
    konzultacne_hodiny = models.CharField(max_length=150, blank=True, null=True)
    poznamka = models.TextField(blank=True, null=True)

    class Meta:
        db_table = 'garant_profil'
        managed = False


class AktivacneTokeny(models.Model):
    """Activation tokens emitted for firm accounts."""
    id = models.BigAutoField(primary_key=True)
    pouzivatel = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        db_column='pouzivatel_id',
        related_name='aktivacne_tokeny',
    )
    token = models.UUIDField(unique=True)
    vyprsi_at = models.DateTimeField()
    pouzity = models.BooleanField(default=False)
    vytvorene_at = models.DateTimeField()

    class Meta:
        db_table = 'aktivacne_tokeny'
        managed = False


class ResetHeslaTokeny(models.Model):
    """Password reset tokens."""
    id = models.BigAutoField(primary_key=True)
    pouzivatel = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        db_column='pouzivatel_id',
        related_name='reset_tokeny',
    )
    token = models.UUIDField(unique=True)
    vyprsi_at = models.DateTimeField()
    pouzity = models.BooleanField(default=False)
    vytvorene_at = models.DateTimeField()

    class Meta:
        db_table = 'reset_hesla_tokeny'
        managed = False
