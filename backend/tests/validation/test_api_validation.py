import datetime
import pytest
from django.utils import timezone
from rest_framework.test import APIClient

from apps.users.models import User
from apps.companies.models import Firma
from apps.internships.models import Prax
from apps.documents.models import Dokument


@pytest.mark.django_db
class TestRegistrationValidation:
    def setup_method(self):
        self.client = APIClient()

    def test_student_registration_rejects_wrong_domain(self):
        payload = {
            "email": "test@example.com",
            "password": "StrongPass123!",
            "password_confirm": "StrongPass123!",
            "meno": "Test",
            "priezvisko": "User",
            "telefon": "+421123456789",
            "adresa": "Somewhere 1",
            "studijny_program": "INF",
        }

        response = self.client.post("/api/auth/register/student/", payload, format="json")

        assert response.status_code == 400
        assert "email" in response.data

    def test_company_registration_rejects_weak_password(self):
        payload = {
            "email": "firma@example.com",
            "nazov": "Firma s.r.o.",
            "adresa": "Adresa 1",
            "kontaktna_osoba_meno": "Kontakt Osoba",
            "kontaktna_osoba_email": "kontakt@example.com",
            "kontaktna_osoba_telefon": "+421123456789",
            "password": "123",  # príliš slabé/krátke
        }

        response = self.client.post("/api/auth/register/company/", payload, format="json")

        assert response.status_code == 400
        assert "password" in response.data or "non_field_errors" in response.data


@pytest.mark.django_db
class TestCreateInternshipValidation:
    def setup_method(self):
        self.client = APIClient()
        self.student = User.objects.create_user(
            email="student@student.ukf.sk",
            password="StrongPass123!",
            rola="student",
        )
        self.firma = Firma.objects.create(
            nazov="Test Firma",
            adresa="Adresa 123",
            kontakt_meno="Kontakt",
            kontakt_email="kontakt@example.com",
            kontakt_telefon="+421123456789",
        )

    def test_end_date_cannot_precede_start(self):
        self.client.force_authenticate(user=self.student)
        payload = {
            "firma_id": self.firma.id,
            "rok": timezone.now().year,
            "semester": "zimny",
            "datum_zaciatku": "2025-06-10",
            "datum_konca": "2025-06-01",
        }

        response = self.client.post("/api/internships/create/", payload, format="json")

        assert response.status_code == 400
        assert "datum_konca" in response.data

    def test_rejects_missing_firma(self):
        self.client.force_authenticate(user=self.student)
        today = timezone.now().date()
        payload = {
            "firma_id": 99999,
            "rok": timezone.now().year,
            "semester": "zimny",
            "datum_zaciatku": today.isoformat(),
            "datum_konca": (today + datetime.timedelta(days=10)).isoformat(),
        }

        response = self.client.post("/api/internships/create/", payload, format="json")

        assert response.status_code == 400
        assert "firma_id" in response.data

    def test_rejects_invalid_semester(self):
        self.client.force_authenticate(user=self.student)
        today = timezone.now().date()
        payload = {
            "firma_id": self.firma.id,
            "rok": timezone.now().year,
            "semester": "jar",  # neplatná hodnota
            "datum_zaciatku": today.isoformat(),
            "datum_konca": (today + datetime.timedelta(days=10)).isoformat(),
        }

        response = self.client.post("/api/internships/create/", payload, format="json")

        assert response.status_code == 400
        assert "semester" in response.data

    def test_company_name_normalization_blocks_duplicates(self):
        self.client.force_authenticate(user=self.student)
        # existujúca firma s právnou formou
        Firma.objects.create(
            nazov="TechCorp s.r.o.",
            adresa="Adresa 1",
            kontakt_meno="Kontakt",
            kontakt_email="kontakt@example.com",
            kontakt_telefon="+421123456789",
        )

        payload = {
            "email": "dup_firma@example.com",
            "nazov": "TechCorp sro",  # odlišný zápis tej istej firmy
            "adresa": "Adresa 2",
            "kontaktna_osoba_meno": "Kontakt Osoba",
            "kontaktna_osoba_email": "kontakt2@example.com",
            "kontaktna_osoba_telefon": "+421987654321",
            "password": "StrongPass123!",
        }

        response = self.client.post("/api/auth/register/company/", payload, format="json")

        assert response.status_code == 400
        assert "nazov" in response.data


@pytest.mark.django_db
class TestDocumentRequirementValidation:
    def setup_method(self):
        self.client = APIClient()
        self.garant = User.objects.create_user(
            email="garant@example.com",
            password="StrongPass123!",
            rola="garant",
        )
        self.student = User.objects.create_user(
            email="student2@student.ukf.sk",
            password="StrongPass123!",
            rola="student",
        )
        self.firma = Firma.objects.create(
            nazov="Valid Firma",
            adresa="Adresa 123",
            kontakt_meno="Kontakt",
            kontakt_email="kontakt@example.com",
        )
        today = timezone.now().date()
        self.prax = Prax.objects.create(
            student=self.student,
            firma=self.firma,
            garant=self.garant,
            rok=today.year,
            semester="zimny",
            datum_zaciatku=today,
            datum_konca=today,
            stav="potvrdena",
        )
        self.contract = Dokument.objects.create(
            prax=self.prax,
            typ_dokumentu="zmluva",
            subor_url="contract.pdf",
            nahrane_pouzivatel=self.student,
            stav_dokumentu="nahrany",
        )

    def test_garant_cannot_mark_schvalena_without_confirmed_contract(self):
        self.client.force_authenticate(user=self.garant)
        response = self.client.patch(
            f"/api/internships/garant/internships/{self.prax.id}/",
            {"stav": "schvalena"},
            format="json",
        )

        assert response.status_code == 400
        assert "stav" in response.data

    def test_garant_cannot_mark_schvalena_with_empty_contract_file(self):
        # potvrdeny, ale bez súboru → stále chýba
        self.contract.stav_dokumentu = "potvrdeny"
        self.contract.subor_url = ""
        self.contract.save(update_fields=["stav_dokumentu", "subor_url"])

        self.client.force_authenticate(user=self.garant)
        response = self.client.patch(
            f"/api/internships/garant/internships/{self.prax.id}/",
            {"stav": "schvalena"},
            format="json",
        )

        assert response.status_code == 400
        assert "stav" in response.data

    def test_garant_can_mark_schvalena_with_confirmed_contract(self):
        self.contract.stav_dokumentu = "potvrdeny"
        self.contract.save(update_fields=["stav_dokumentu"])

        self.client.force_authenticate(user=self.garant)
        response = self.client.patch(
            f"/api/internships/garant/internships/{self.prax.id}/",
            {"stav": "schvalena"},
            format="json",
        )

        assert response.status_code == 200
        assert response.data["stav"] == "schvalena"

    def test_garant_can_force_mark_schvalena_even_without_contract(self):
        # force=True obíde validačný blok na povinné dokumenty
        self.client.force_authenticate(user=self.garant)
        response = self.client.patch(
            f"/api/internships/garant/internships/{self.prax.id}/",
            {"stav": "schvalena", "force": True},
            format="json",
        )

        assert response.status_code == 200
        assert response.data["stav"] == "schvalena"
