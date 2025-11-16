import pytest
from django.urls import reverse
from rest_framework.test import APIClient

from apps.users.models import User


STUDENT_PAYLOAD = {
    "meno": "Ján",
    "priezvisko": "Testovací",
    "adresa": "Testova 42, Nitra",
    "email": "fr03_student@student.ukf.sk",
    "alternativny_email": "alt_fr03@student.ukf.sk",
    "telefon": "+421123456",
    "studijny_program": "Aplikovaná informatika",
}

COMPANY_PAYLOAD = {
    "email": "firma_fr03@example.com",
    "nazov": "Firma FR03 s.r.o.",
    "adresa": "Bratislavska 55",
    "kontaktna_osoba_meno": "Peter Podnikateľ",
    "kontaktna_osoba_email": "kontakt.firma_fr03@example.com",
    "kontaktna_osoba_telefon": "+421987654321",
}


@pytest.mark.django_db
class TestFR03Registration:
    def setup_method(self):
        self.client = APIClient()

    def test_student_registration_creates_inactive_account(self):
        url = reverse("student-registration")
        resp = self.client.post(url, STUDENT_PAYLOAD, format="json")

        assert resp.status_code == 201
        user = User.objects.get(email=STUDENT_PAYLOAD["email"])
        assert user.rola == "student"
        assert user.musi_zmenit_heslo is True
        # registrácia študenta je neaktívna a neoverená, čaká na aktiváciu
        assert user.aktivny is False
        assert user.email_overeny is False

    def test_company_registration_creates_inactive_account(self):
        url = reverse("company-registration")
        resp = self.client.post(url, COMPANY_PAYLOAD, format="json")

        assert resp.status_code == 201
        user = User.objects.get(email=COMPANY_PAYLOAD["email"])
        assert user.rola == "firma"
        assert user.aktivny is False
        assert user.email_overeny is False
        assert user.musi_zmenit_heslo is True

    def test_company_login_is_blocked_when_inactive(self):
        user = User.objects.create_user(
            email="inactive_firma@example.com",
            password="StrongPass123!",
            rola="firma",
            aktivny=False,
        )

        url = reverse("company-login")
        resp = self.client.post(url, {"email": user.email, "password": "StrongPass123!"}, format="json")

        assert resp.status_code == 403
        assert resp.data.get("error") == "inactive_user"

    def test_first_login_requires_password_change_flag(self):
        user = User.objects.create_user(
            email="student_login@student.ukf.sk",
            password="StrongPass123!",
            rola="student",
            aktivny=True,
            musi_zmenit_heslo=True,
        )

        url = reverse("login")
        resp = self.client.post(url, {"email": user.email, "password": "StrongPass123!"}, format="json")

        assert resp.status_code == 200
        assert resp.data["user"]["musi_zmenit_heslo"] is True
