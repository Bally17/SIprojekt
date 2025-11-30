# backend/testOauth/rate_limit_test_simple.py
import pytest
import requests
import time

BASE_URL = "http://localhost:8000/api/auth"

BASE_URL = "http://localhost:8000/api/auth"

def test_token_rate_limit():
    """Test rate limiting na oauth/token endpoint"""
    print("🧪 Testing OAuth Token Rate Limiting...")

    # rýchly check dostupnosti backendu
    try:
        requests.get(f"{BASE_URL}/health/", timeout=3)
    except requests.RequestException:
        pytest.skip("Backend na localhost:8000 nie je dostupný.")

    rate_limited = False
    for i in range(15):
        try:
            resp = requests.post(
                f"{BASE_URL}/oauth/token/",
                json={
                    "grant_type": "authorization_code",
                    "client_id": "test-client-123",
                    "client_secret": "test-secret-456",
                    "code": f"fake_code_{i}",
                    "redirect_uri": "http://localhost:3000/auth/callback",
                },
                timeout=5,
            )
        except requests.RequestException:
            pytest.skip("Backend na localhost:8000 nie je dostupný.")

        if resp.status_code == 400:
            print(f"   Request {i+1}: ✅ 400 (expected - invalid code)")
        elif resp.status_code == 429:
            print(f"   Request {i+1}: 🚫 429 RATE LIMITED!")
            rate_limited = True
            break
        else:
            print(f"   Request {i+1}: ❌ {resp.status_code} - {resp.text}")

        time.sleep(0.1)

    assert rate_limited, "Rate limiting NOT working - no 429 response"

if __name__ == "__main__":
    test_token_rate_limit()
