# backend/testOauth/rate_limit_test_simple.py
import requests
import time

BASE_URL = "http://localhost:8000/api/auth"

def test_token_rate_limit():
    """Test rate limiting na oauth/token endpoint"""
    print("🧪 Testing OAuth Token Rate Limiting...")
    
    for i in range(15):
        resp = requests.post(
            f"{BASE_URL}/oauth/token/",
            json={
                "grant_type": "authorization_code",
                "client_id": "test-client-123",
                "client_secret": "test-secret-456", 
                "code": f"fake_code_{i}",
                "redirect_uri": "http://localhost:3000/auth/callback"
            }
        )
        
        if resp.status_code == 400:
            print(f"   Request {i+1}: ✅ 400 (expected - invalid code)")
        elif resp.status_code == 429:
            print(f"   Request {i+1}: 🚫 429 RATE LIMITED!")
            print("🎉 Rate limiting is WORKING!")
            return True
        else:
            print(f"   Request {i+1}: ❌ {resp.status_code} - {resp.text}")
        
        time.sleep(0.1)
    
    print("❌ Rate limiting NOT working - no 429 response")
    return False

if __name__ == "__main__":
    test_token_rate_limit()
