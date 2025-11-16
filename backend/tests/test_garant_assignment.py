import pytest
from django.test import override_settings
from rest_framework.test import APIClient

from apps.users.models import User
from apps.companies.models import Firma
from apps.internships.models import Prax


@pytest.fixture
def client():
    return APIClient()


@pytest.mark.django_db
@override_settings(DEFAULT_GARANT_EMAIL="default@ukf.sk")
def test_assigns_default_garant_when_only_default_exists(client, monkeypatch):
    monkeypatch.setattr(
        "apps.internships.views.generate_dohoda_pdf",
        lambda prax: (None, "dummy.pdf"),
    )
    default_garant = User.objects.create_user(
        email="default@ukf.sk", password="StrongPass123!", rola="garant", aktivny=True
    )
    student = User.objects.create_user(
        email="student@student.ukf.sk", password="StrongPass123!", rola="student"
    )
    firma = Firma.objects.create(
        nazov="Firma", adresa="Adresa", kontakt_meno="KM", kontakt_email="k@example.com"
    )

    client.force_authenticate(user=student)
    resp = client.post(
        "/api/internships/create/",
        {
            "firma_id": firma.id,
            "rok": 2025,
            "semester": "zimny",
            "datum_zaciatku": "2025-01-01",
            "datum_konca": "2025-02-01",
        },
        format="json",
    )

    assert resp.status_code == 201
    prax = Prax.objects.get(id=resp.data["id"])
    assert prax.garant_id == default_garant.id


@pytest.mark.django_db
@override_settings(DEFAULT_GARANT_EMAIL="default@ukf.sk")
def test_prefers_non_default_garant_if_exists(client, monkeypatch):
    monkeypatch.setattr(
        "apps.internships.views.generate_dohoda_pdf",
        lambda prax: (None, "dummy.pdf"),
    )
    default_garant = User.objects.create_user(
        email="default@ukf.sk", password="StrongPass123!", rola="garant", aktivny=True
    )
    other_garant = User.objects.create_user(
        email="other@ukf.sk", password="StrongPass123!", rola="garant", aktivny=True
    )
    student = User.objects.create_user(
        email="student2@student.ukf.sk", password="StrongPass123!", rola="student"
    )
    firma = Firma.objects.create(
        nazov="Firma 2", adresa="Adresa 2", kontakt_meno="KM2", kontakt_email="k2@example.com"
    )

    client.force_authenticate(user=student)
    resp = client.post(
        "/api/internships/create/",
        {
            "firma_id": firma.id,
            "rok": 2025,
            "semester": "zimny",
            "datum_zaciatku": "2025-03-01",
            "datum_konca": "2025-04-01",
        },
        format="json",
    )

    assert resp.status_code == 201
    prax = Prax.objects.get(id=resp.data["id"])
    assert prax.garant_id == other_garant.id
    assert prax.garant_id != default_garant.id
