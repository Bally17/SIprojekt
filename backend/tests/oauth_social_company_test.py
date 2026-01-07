import pytest
from django.urls import reverse
from rest_framework.test import APIClient

from apps.companies.models import Firma
from apps.users.models import User
from apps.authentication.views import social as social_views


@pytest.mark.django_db
class TestCompanySocialRegistration:
    def setup_method(self):
        self.client = APIClient()

    def test_github_company_register_and_complete_profile(self, monkeypatch):
        github_email = "firma_github_test@example.com"

        def _fake_github_user_data(_access_token):
            return {
                "email": github_email,
                "first_name": "Git",
                "last_name": "Hub",
                "avatar": "https://example.com/avatar.png",
            }

        monkeypatch.setattr(social_views, "_fetch_github_user_data", _fake_github_user_data)

        register_url = reverse("company-github-registration")
        resp = self.client.post(register_url, {"access_token": "fake-token"}, format="json")
        assert resp.status_code == 201
        assert resp.data["created"] is True

        user = User.objects.get(email=github_email)
        assert user.rola == User.ROLE_FIRMA
        assert user.aktivny is False
        assert user.meno is None
        assert user.priezvisko is None
        assert user.telefon is None
        assert user.adresa is None
        assert user.alternativny_email is None
        assert user.firma_id is None

        access_token = resp.data["tokens"]["access"]
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {access_token}")

        missing_url = reverse("profile-missing-fields")
        missing_resp = self.client.get(missing_url)
        assert missing_resp.status_code == 200
        assert set(missing_resp.data["missing_required_fields"]) == {
            "nazov",
            "kontaktna_osoba_meno",
            "kontaktna_osoba_email",
            "kontaktna_osoba_telefon",
            "adresa",
        }

        complete_url = reverse("company-profile-complete")
        payload = {
            "nazov": "GitHub Firma s.r.o.",
            "kontaktna_osoba_meno": "Test Kontakt",
            "kontaktna_osoba_email": "kontakt_github@example.com",
            "kontaktna_osoba_telefon": "+421900123456",
            "adresa": "Hlavna 1, Nitra",
        }
        complete_resp = self.client.post(complete_url, payload, format="json")
        assert complete_resp.status_code == 200

        user.refresh_from_db()
        assert user.aktivny is True
        assert user.firma_id is not None

        firma = Firma.objects.get(id=user.firma_id)
        assert firma.nazov == payload["nazov"]
        assert firma.adresa == payload["adresa"]
        assert firma.kontakt_meno == payload["kontaktna_osoba_meno"]
        assert firma.kontakt_email == payload["kontaktna_osoba_email"]
        assert firma.kontakt_telefon == payload["kontaktna_osoba_telefon"]

        missing_resp = self.client.get(missing_url)
        assert missing_resp.status_code == 200
        assert missing_resp.data["missing_required_fields"] == []

        # Second call acts like "login" for existing company via OAuth.
        resp_repeat = self.client.post(register_url, {"access_token": "fake-token"}, format="json")
        assert resp_repeat.status_code == 200
        assert resp_repeat.data["created"] is False

    def test_google_company_register_without_contact_data(self, monkeypatch):
        google_email = "firma_google_test@example.com"

        def _fake_google_user_data(_access_token):
            return {
                "email": google_email,
                "first_name": "Goo",
                "last_name": "Gle",
                "avatar": "https://example.com/avatar.png",
            }

        monkeypatch.setattr(social_views, "_fetch_google_user_data", _fake_google_user_data)

        register_url = reverse("company-google-registration")
        resp = self.client.post(register_url, {"access_token": "fake-token"}, format="json")
        assert resp.status_code == 201
        assert resp.data["created"] is True

        user = User.objects.get(email=google_email)
        assert user.rola == User.ROLE_FIRMA
        assert user.aktivny is False
        assert user.meno is None
        assert user.priezvisko is None
        assert user.telefon is None
        assert user.adresa is None
        assert user.alternativny_email is None
        assert user.firma_id is None
