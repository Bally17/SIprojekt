import json

import pytest
from rest_framework.test import APIClient

from apps.authentication.models import OAuthClient
from apps.users.models import User


@pytest.mark.django_db
def test_garant_can_create_oauth_client_via_api():
    garant = User.objects.create_user(
        email="garant-client@example.com",
        password="StrongPass123!",
        rola=User.ROLE_GARANT,
    )
    client = APIClient()
    client.force_authenticate(user=garant)

    payload = {
        "name": "Partner App",
        "redirect_uris": ["https://partner.example.com/callback"],
        "scope": "read write",
    }

    resp = client.post("/api/auth/oauth/clients/", payload, format="json")
    assert resp.status_code == 201, resp.data
    data = resp.data
    assert data["client_id"]
    assert data["client_secret"]
    assert data["service_user"]["id"] == garant.id

    created = OAuthClient.objects.get(client_id=data["client_id"])
    assert created.service_user_id == garant.id
    assert json.loads(created.redirect_uris) == payload["redirect_uris"]
    assert created.scope == payload["scope"]


@pytest.mark.django_db
def test_non_garant_cannot_create_oauth_client():
    student = User.objects.create_user(
        email="student-client@example.com",
        password="StrongPass123!",
        rola=User.ROLE_STUDENT,
    )
    client = APIClient()
    client.force_authenticate(user=student)

    resp = client.post(
        "/api/auth/oauth/clients/",
        {
            "name": "Forbidden App",
            "redirect_uris": ["https://example.com/callback"],
        },
        format="json",
    )
    assert resp.status_code == 403
    assert OAuthClient.objects.count() == 0


@pytest.mark.django_db
def test_garant_can_deactivate_oauth_client():
    garant = User.objects.create_user(
        email="garant-del@example.com",
        password="StrongPass123!",
        rola=User.ROLE_GARANT,
    )
    client = APIClient()
    client.force_authenticate(user=garant)

    oauth_client = OAuthClient.objects.create(
        client_id="delete-me",
        client_secret="secret",
        name="To Delete",
        redirect_uris=json.dumps(["https://example.com/cb"]),
        scope="read",
        is_public=False,
        allow_password_grant=False,
        service_user=garant,
        is_active=True,
    )

    resp = client.delete(f"/api/auth/oauth/clients/{oauth_client.client_id}/")
    assert resp.status_code == 204
    oauth_client.refresh_from_db()
    assert oauth_client.is_active is False
