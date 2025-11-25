import json

import pytest
from rest_framework.test import APIClient
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.hazmat.primitives import serialization
import jwt
from datetime import datetime, timedelta, timezone

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


@pytest.mark.django_db
def test_external_list_shows_all_firms_for_externy():
    externy = User.objects.create_user(
        email="ext-all@example.com",
        password="StrongPass123!",
        rola="externy",
    )
    garant = User.objects.create_user(
        email="garant-all@example.com",
        password="StrongPass123!",
        rola="garant",
    )
    firma_a = Firma.objects.create(
        nazov="Firma A", adresa="Street A", kontakt_meno="A", kontakt_email="a@example.com"
    )
    firma_b = Firma.objects.create(
        nazov="Firma B", adresa="Street B", kontakt_meno="B", kontakt_email="b@example.com"
    )
    student_a = User.objects.create_user(
        email="student-a@example.com", password="StrongPass123!", rola="student"
    )
    student_b = User.objects.create_user(
        email="student-b@example.com", password="StrongPass123!", rola="student"
    )

    prax_a = Prax.objects.create(
        student=student_a,
        firma=firma_a,
        garant=garant,
        rok=2025,
        semester="zimny",
        datum_zaciatku="2025-01-01",
        datum_konca="2025-02-01",
        stav="schvalena",
    )
    prax_b = Prax.objects.create(
        student=student_b,
        firma=firma_b,
        garant=garant,
        rok=2025,
        semester="zimny",
        datum_zaciatku="2025-03-01",
        datum_konca="2025-04-01",
        stav="schvalena",
    )

    client = APIClient()
    client.force_authenticate(user=externy)
    resp = client.get("/api/internships/external/internships/?stav=schvalena")
    assert resp.status_code == 200
    results = resp.data.get("results", resp.data)
    ids = {item["id"] for item in results}
    assert {prax_a.id, prax_b.id}.issubset(ids)


@pytest.mark.django_db
def test_private_key_jwt_allows_client_credentials_and_defense():
    # RSA keypair
    private_key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    private_pem = private_key.private_bytes(
        serialization.Encoding.PEM,
        serialization.PrivateFormat.PKCS8,
        serialization.NoEncryption(),
    ).decode("utf-8")
    public_pem = private_key.public_key().public_bytes(
        serialization.Encoding.PEM,
        serialization.PublicFormat.SubjectPublicKeyInfo,
    ).decode("utf-8")

    service_user = User.objects.create_user(
        email="service-jwt@example.com",
        password="StrongPass123!",
        rola="externy",
    )
    garant = User.objects.create_user(
        email="garant-jwt@example.com",
        password="StrongPass123!",
        rola="garant",
    )
    student = User.objects.create_user(
        email="student-jwt@example.com",
        password="StrongPass123!",
        rola="student",
    )
    firma = Firma.objects.create(
        nazov="Firma JWT",
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
        datum_zaciatku="2025-01-01",
        datum_konca="2025-02-01",
        stav="schvalena",
    )

    client = APIClient()
    oauth_client = OAuthClient.objects.create(
        client_id="external-client-jwt",
        client_secret="",  # not used
        name="External Integration JWT",
        redirect_uris=json.dumps(["https://example.com/callback"]),
        scope="read write",
        allow_password_grant=False,
        is_public=False,
        service_user=service_user,
        allow_private_jwt=True,
        public_key=public_pem,
    )

    now = datetime.now(timezone.utc)
    assertion_payload = {
        "iss": oauth_client.client_id,
        "sub": oauth_client.client_id,
        "aud": "http://testserver/api/auth/oauth/token/",
        "exp": now + timedelta(minutes=5),
        "iat": now,
        "jti": "test-jti",
    }
    assertion = jwt.encode(assertion_payload, private_pem, algorithm="RS256")

    token_resp = client.post(
        "/api/auth/oauth/token/",
        {
            "grant_type": "client_credentials",
            "client_id": oauth_client.client_id,
            "client_assertion_type": "urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
            "client_assertion": assertion,
        },
        format="json",
    )

    assert token_resp.status_code == 200, token_resp.data
    access_token = token_resp.data.get("access_token")
    assert access_token

    client.credentials(HTTP_AUTHORIZATION=f"Bearer {access_token}")
    defense_resp = client.post(
        "/api/internships/external/defense/",
        {"prax_id": prax.id, "note": "obhajene JWT klientom"},
        format="json",
    )
    assert defense_resp.status_code == 200
    assert defense_resp.data["stav"] == "obhajena"
