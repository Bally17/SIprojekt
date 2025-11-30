# test_oauth_server.py
import pytest
import requests
import json

BASE_URL = "http://localhost:8000/api/auth"
TEST_EMAIL = "test@example.com"
TEST_PASSWORD = "testpass123"


def _login():
    """Vráti access token testovacieho používateľa alebo skipne, ak nie je dostupný."""
    try:
        resp = requests.post(
            f"{BASE_URL}/login/",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD},
            timeout=5,
        )
    except requests.RequestException:
        pytest.skip("Backend na localhost:8000 nie je dostupný.")
    if resp.status_code != 200:
        pytest.skip(f"Login zlyhal ({resp.status_code}) – chýba testovací používateľ?")
    data = resp.json()
    return data["tokens"]["access"], data


def test_oauth_flow():
    print("🚀 Testing OAuth Server Flow...")

    access_token, login_data = _login()
    print(f"✅ Login successful: {login_data['user']['email']}")

    # 2. OAuth authorize request
    auth_params = {
        "client_id": "test-client-123",
        "redirect_uri": "http://localhost:3000/auth/callback",
        "response_type": "code",
        "state": "test123",
    }

    auth_resp = requests.get(
        f"{BASE_URL}/oauth/authorize/",
        params=auth_params,
        headers={"Authorization": f"Bearer {access_token}"},
        timeout=5,
    )
    assert auth_resp.status_code == 200, f"OAuth authorize failed: {auth_resp.text}"
    auth_code = auth_resp.json().get("code")
    assert auth_code, "Authorization code missing"

    # 3. Token exchange
    token_data = {
        "grant_type": "authorization_code",
        "client_id": "test-client-123",
        "client_secret": "test-secret-456",
        "code": auth_code,
        "redirect_uri": "http://localhost:3000/auth/callback",
    }

    token_resp = requests.post(f"{BASE_URL}/oauth/token/", json=token_data, timeout=5)
    assert token_resp.status_code == 200, f"Token exchange failed: {token_resp.text}"
    oauth_access_token = token_resp.json().get("access_token")
    assert oauth_access_token, "Missing OAuth access token"

    # 4. Test UserInfo endpoint
    userinfo_resp = requests.get(
        f"{BASE_URL}/oauth/userinfo/",
        headers={"Authorization": f"Bearer {oauth_access_token}"},
        timeout=5,
    )
    assert userinfo_resp.status_code == 200, f"UserInfo failed: {userinfo_resp.text}"
    user_data = userinfo_resp.json()
    assert "email" in user_data
