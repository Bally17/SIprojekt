import requests
import json

def debug_backend_github():
    print("🐛 DEBUG BACKEND GITHUB ENDPOINT")
    
    # Test s rôznymi vstupmi
    test_cases = [
        {"code": "test_code_123"},
        {"access_token": "test_token_123"},
        {"code": ""},
        {},
    ]
    
    for i, test_data in enumerate(test_cases):
        print(f"\n🔧 TEST {i+1}: {test_data}")
        
        try:
            response = requests.post(
                "http://localhost:8000/api/auth/github/",
                json=test_data,
                timeout=5
            )
            
            print(f"📡 Status: {response.status_code}")
            print(f"📄 Response: {response.text}")
            
        except Exception as e:
            print(f"❌ Exception: {e}")

def test_github_callback_directly():
    print("\n🎯 TEST PRIAMY CALLBACK")
    
    # Simulujme čo sa deje v callback endpointe
    code = "a900650ed0ad9ff606ea"  # Použite najnovší code
    
    # Krok 1: Získanie token z GitHub
    token_data = {
        "client_id": "Ov23liOWTHd1m2SlMTW0",
        "client_secret": "427ad496fa6073b272bfead8b82f3258c64a85a6",
        "code": code,
        "redirect_uri": "http://localhost:8000/api/auth/github/callback/"
    }
    
    print("🔄 Získavam token z GitHub...")
    token_response = requests.post(
        "https://github.com/login/oauth/access_token",
        headers={"Accept": "application/json"},
        data=token_data
    )
    
    print(f"📡 GitHub Status: {token_response.status_code}")
    print(f"📄 GitHub Response: {token_response.json()}")
    
    if token_response.status_code == 200 and 'access_token' in token_response.json():
        access_token = token_response.json()['access_token']
        print(f"🔑 GitHub Access Token: {access_token}")
        
        # Test nášho backendu s access_token namiesto code
        print("\n🚀 Test backendu s access_token...")
        backend_data = {"access_token": access_token}
        backend_response = requests.post(
            "http://localhost:8000/api/auth/github/", 
            json=backend_data
        )
        
        print(f"📡 Backend Status: {backend_response.status_code}")
        print(f"📄 Backend Response: {backend_response.text}")

if __name__ == "__main__":
    debug_backend_github()
    # test_github_callback_directly()
