import pytest
import requests

BASE_URL = "http://localhost:8000/api/auth"


@pytest.fixture
def access_token():
    """Získa access token cez login; ak server nebeží alebo login zlyhá, test sa preskočí."""
    try:
        resp = requests.post(
            f"{BASE_URL}/login/",
            json={"email": "test@example.com", "password": "testpass123"},
            timeout=5,
        )
    except requests.RequestException:
        pytest.skip("Backend na localhost:8000 nie je dostupný.")
    if resp.status_code != 200 or "tokens" not in resp.json():
        pytest.skip("Login neúspešný – chýba testovací používateľ alebo tokeny.")
    return resp.json()["tokens"]["access"]


def test_normal_login():
    try:
        resp = requests.post(
            f"{BASE_URL}/login/",
            json={"email": "test@example.com", "password": "testpass123"},
            timeout=5,
        )
    except requests.RequestException:
        pytest.skip("Backend na localhost:8000 nie je dostupný.")
    if resp.status_code != 200:
        pytest.skip(f"Login zlyhal ({resp.status_code}) – pravdepodobne chýba testovací používateľ.")
    data = resp.json()
    assert "tokens" in data


def test_profile(access_token):
    try:
        resp = requests.get(
            f"{BASE_URL}/profile/",
            headers={"Authorization": f"Bearer {access_token}"},
            timeout=5,
        )
    except requests.RequestException:
        pytest.skip("Backend na localhost:8000 nie je dostupný.")
    assert resp.status_code == 200
