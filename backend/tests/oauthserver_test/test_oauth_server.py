# test_oauth_server.py
import requests
import json

BASE_URL = "http://localhost:8000/api/auth"

def test_oauth_flow():
    print("🚀 Testing OAuth Server Flow...")
    
    # 1. Normal login s testovacími údajmi
    print("\n1. Normal login...")
    login_data = {
        "email": "test@example.com",   # Tento email
        "password": "password123"      # Toto heslo
    }
    
    login_resp = requests.post(f"{BASE_URL}/login/", json=login_data)
    print(f"Login status: {login_resp.status_code}")
    
    if login_resp.status_code != 200:
        print(f"❌ Login failed: {login_resp.text}")
        # Skús vytvoriť usera ak neexistuje
        print("Skúšam vytvoriť usera...")
        return
    
    login_data = login_resp.json()
    access_token = login_data['tokens']['access']
    print("✅ Login successful")
    print(f"User: {login_data['user']['email']}")
    
    # 2. OAuth authorize request
    print("\n2. OAuth authorize...")
    auth_params = {
        "client_id": "test-client-123",
        "redirect_uri": "http://localhost:3000/auth/callback", 
        "response_type": "code",
        "state": "test123"
    }
    
    auth_resp = requests.get(
        f"{BASE_URL}/oauth/authorize/",
        params=auth_params,
        headers={"Authorization": f"Bearer {access_token}"}
    )
    
    print(f"Auth status: {auth_resp.status_code}")
    
    if auth_resp.status_code != 200:
        print(f"❌ OAuth authorize failed: {auth_resp.text}")
        return
        
    auth_data = auth_resp.json()
    auth_code = auth_data.get('code')
    print(f"✅ Authorization code: {auth_code}")
    
    # 3. Token exchange
    print("\n3. Token exchange...")
    token_data = {
        "grant_type": "authorization_code",
        "client_id": "test-client-123",
        "client_secret": "test-secret-456",
        "code": auth_code,
        "redirect_uri": "http://localhost:3000/auth/callback"
    }
    
    token_resp = requests.post(f"{BASE_URL}/oauth/token/", json=token_data)
    print(f"Token status: {token_resp.status_code}")
    
    if token_resp.status_code != 200:
        print(f"❌ Token exchange failed: {token_resp.text}")
        return
        
    token_data = token_resp.json()
    oauth_access_token = token_data['access_token']
    print(f"✅ OAuth access token: {oauth_access_token[:30]}...")
    
    # 4. Test UserInfo endpoint
    print("\n4. UserInfo endpoint...")
    userinfo_resp = requests.get(
        f"{BASE_URL}/oauth/userinfo/", 
        headers={"Authorization": f"Bearer {oauth_access_token}"}
    )
    
    if userinfo_resp.status_code == 200:
        user_data = userinfo_resp.json()
        print(f"✅ UserInfo: {user_data['email']}")
        print("🎉 OAuth server working correctly!")
    else:
        print(f"❌ UserInfo failed: {userinfo_resp.text}")

if __name__ == "__main__":
    test_oauth_flow()
