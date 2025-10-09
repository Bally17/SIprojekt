# backend/testOauth/oauth_test_updated.py
import requests
import time

BASE_URL = "http://localhost:8000/api/auth"

class OAuthTester:
    def __init__(self):
        self.access_token = None
        self.refresh_token = None
        
    def test_complete_flow(self):
        print("🚀 Testing Complete OAuth Flow...")
        
        # Počkaj 60 sekúnd kým sa resetne rate limit
        print("⏳ Waiting 60 seconds for rate limit reset...")
        for i in range(60, 0, -1):
            print(f"   {i} seconds remaining...", end='\r')
            time.sleep(1)
        print("\n✅ Rate limit should be reset now")
        
        # 1. Najprv sa prihlás normálne
        if not self._login():
            return False
            
        # 2. OAuth authorize
        auth_code = self._test_authorize()
        if not auth_code:
            return False
            
        # 3. Token exchange
        if not self._test_token_exchange(auth_code):
            return False
            
        # 4. UserInfo endpoint
        if not self._test_userinfo():
            return False
            
        print("🎉 ALL TESTS PASSED! OAuth server is working correctly!")
        return True
    
    def _login(self):
        print("\n1. Testing normal login...")
        login_data = {
            "email": "test@example.com",
            "password": "password123"
        }
        
        resp = requests.post(f"{BASE_URL}/login/", json=login_data)
        print(f"   Login status: {resp.status_code}")
        
        if resp.status_code == 200:
            data = resp.json()
            self.access_token = data['tokens']['access']
            self.refresh_token = data['tokens']['refresh']
            print("   ✅ Login successful")
            return True
        else:
            print(f"   ❌ Login failed: {resp.text}")
            return False
    
    def _test_authorize(self):
        print("\n2. Testing OAuth authorize...")
        params = {
            "client_id": "test-client-123",
            "redirect_uri": "http://localhost:3000/auth/callback", 
            "response_type": "code",
            "state": "test123"
        }
        
        resp = requests.get(
            f"{BASE_URL}/oauth/authorize/",
            params=params,
            headers={"Authorization": f"Bearer {self.access_token}"}
        )
        
        print(f"   Authorize status: {resp.status_code}")
        
        if resp.status_code == 200:
            data = resp.json()
            auth_code = data.get('code')
            print(f"   ✅ Authorization code: {auth_code}")
            return auth_code
        else:
            print(f"   ❌ Authorize failed: {resp.text}")
            return None
    
    def _test_token_exchange(self, auth_code):
        print("\n3. Testing token exchange...")
        token_data = {
            "grant_type": "authorization_code",
            "client_id": "test-client-123",
            "client_secret": "test-secret-456",
            "code": auth_code,
            "redirect_uri": "http://localhost:3000/auth/callback"
        }
        
        resp = requests.post(f"{BASE_URL}/oauth/token/", json=token_data)
        print(f"   Token exchange status: {resp.status_code}")
        
        if resp.status_code == 200:
            data = resp.json()
            self.oauth_access_token = data['access_token']
            print(f"   ✅ OAuth access token: {self.oauth_access_token[:30]}...")
            return True
        else:
            print(f"   ❌ Token exchange failed: {resp.text}")
            return False
    
    def _test_userinfo(self):
        print("\n4. Testing UserInfo endpoint...")
        resp = requests.get(
            f"{BASE_URL}/oauth/userinfo/", 
            headers={"Authorization": f"Bearer {self.oauth_access_token}"}
        )
        
        print(f"   UserInfo status: {resp.status_code}")
        
        if resp.status_code == 200:
            user_data = resp.json()
            print(f"   ✅ UserInfo: {user_data['email']}")
            return True
        else:
            print(f"   ❌ UserInfo failed: {resp.text}")
            return False

if __name__ == "__main__":
    tester = OAuthTester()
    success = tester.test_complete_flow()
    exit(0 if success else 1)
