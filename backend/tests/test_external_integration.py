import json

import pytest
from rest_framework.test import APIClient

from apps.authentication.models import OAuthClient
from apps.companies.models import Firma
from apps.internships.models import Prax
from apps.users.models import User


@pytest.mark.django_db
def test_client_credentials_token_allows_external_list_and_defense_flow():
    service_user = User.objects.create_user(
        email="service@external.example",
        password="StrongPass123!",
        rola="externy",
    )
    garant = User.objects.create_user(
        email="garant-ext@example.com",
        password="StrongPass123!",
        rola="garant",
    )
    student = User.objects.create_user(
        email="student-ext@example.com",
        password="StrongPass123!",
        rola="student",
    )
    firma = Firma.objects.create(
        nazov="Extern Firma CC",
        adresa="Street",
        kontakt_meno="Meno",
        kontakt_email="kontakt@example.com",
    )
    prax = Prax.objects.create(
        student=student,
        firma=firma,
        garant=garant,
        rok=2025,
        semester="zimny",
        datum_zaciatku="2025-09-01",
        datum_konca="2025-10-01",
        stav="schvalena",
    )
    other_prax = Prax.objects.create(
        student=student,
        firma=firma,
        garant=garant,
        rok=2025,
        semester="zimny",
        datum_zaciatku="2025-11-01",
        datum_konca="2025-12-01",
        stav="vytvorena",
    )

    client = APIClient()
    oauth_client = OAuthClient.objects.create(
        client_id="external-client",
        client_secret="super-secret",
        name="External Integration",
        redirect_uris=json.dumps(["https://example.com/callback"]),
        scope="read write",
        allow_password_grant=False,
        is_public=False,
        service_user=service_user,
    )

    token_resp = client.post(
        "/api/auth/oauth/token/",
        {
            "grant_type": "client_credentials",
            "client_id": oauth_client.client_id,
            "client_secret": oauth_client.client_secret,
        },
        format="json",
    )

    assert token_resp.status_code == 200
    access_token = token_resp.data.get("access_token")
    assert access_token, "Missing access token in response"

    client.credentials(HTTP_AUTHORIZATION=f"Bearer {access_token}")
    list_resp = client.get("/api/internships/external/internships/?stav=schvalena")
    assert list_resp.status_code == 200
    results = list_resp.data.get("results", list_resp.data)
    returned_ids = {item["id"] for item in results}
    assert prax.id in returned_ids
    assert other_prax.id not in returned_ids

    defense_resp = client.post(
        "/api/internships/external/defense/",
        {"prax_id": prax.id, "note": "obhajene externym systemom"},
        format="json",
    )

    assert defense_resp.status_code == 200
    assert defense_resp.data["stav"] == "obhajena"


@pytest.mark.django_db
def test_external_list_rejects_non_external_roles():
    student = User.objects.create_user(
        email="student-only@example.com",
        password="StrongPass123!",
        rola="student",
    )
    client = APIClient()
    client.force_authenticate(user=student)
    resp = client.get("/api/internships/external/internships/")
    assert resp.status_code == 403
