import requests
import json
import sys

def print_separator(title):
    print(f"\n{'='*50}")
    print(f"🔧 {title}")
    print(f"{'='*50}")

def test_normal_login():
    print_separator("TEST NORMÁLNEHO PRIHLÁSENIA")
    
    # Test s existujúcim používateľom
    data = {
        "email": "test@example.com",
        "password": "testpass123"
    }
    
    try:
        response = requests.post(
            "http://localhost:8000/api/auth/login/",
            json=data
        )
        
        print(f"📡 Status: {response.status_code}")
        if response.status_code == 200:
            result = response.json()
            print("✅ PRIHLÁSENIE ÚSPEŠNÉ!")
            print(f"👤 User: {result['user']['email']}")
            print(f"🆔 User ID: {result['user']['id']}")
            print(f"🔑 Access Token: {result['tokens']['access'][:50]}...")
            return result['tokens']['access']
        else:
            print("❌ CHYBA:", response.json())
            return None
            
    except Exception as e:
        print(f"❌ EXCEPTION: {e}")
        return None

def test_profile(access_token):
    print_separator("TEST PROFILE ENDPOINT")
    
    if not access_token:
        print("❌ Žiadny access token")
        return
    
    headers = {
        "Authorization": f"Bearer {access_token}"
    }
    
    try:
        response = requests.get(
            "http://localhost:8000/api/auth/profile/",
            headers=headers
        )
        
        print(f"📡 Status: {response.status_code}")
        if response.status_code == 200:
            print("✅ PROFILE ÚSPEŠNÝ!")
            print("User Data:", json.dumps(response.json(), indent=2))
        else:
            print("❌ CHYBA:", response.json())
            
    except Exception as e:
        print(f"❌ EXCEPTION: {e}")

def test_github_oauth_direct():
    print_separator("TEST GITHUB OAUTH (PRIAMY)")
    
    # Tu vložte GitHub access token
    github_token = input("Zadajte GitHub Access Token (alebo Enter pre skip): ").strip()
    
    if not github_token:
        print("⏭️  Preskakujem GitHub test")
        return None
    
    data = {
        "access_token": github_token
    }
    
    try:
        response = requests.post(
            "http://localhost:8000/api/auth/github/",
            json=data
        )
        
        print(f"📡 Status: {response.status_code}")
        if response.status_code == 200:
            result = response.json()
            print("✅ GITHUB OAUTH ÚSPEŠNÝ!")
            print(f"👤 User: {result['user']['email']}")
            print(f"🆔 User ID: {result['user']['id']}")
            print(f"🔑 Access Token: {result['tokens']['access'][:50]}...")
            print(f"📱 Provider: {result['user']['oauth_provider']}")
            return result['tokens']['access']
        else:
            print("❌ CHYBA:", response.json())
            return None
            
    except Exception as e:
        print(f"❌ EXCEPTION: {e}")
        return None

def test_google_oauth():
    print_separator("TEST GOOGLE OAUTH")
    
    # Tu vložte Google access token
    google_token = input("Zadajte Google Access Token (alebo Enter pre skip): ").strip()
    
    if not google_token:
        print("⏭️  Preskakujem Google test")
        return None
    
    data = {
        "access_token": google_token
    }
    
    try:
        response = requests.post(
            "http://localhost:8000/api/auth/google/",
            json=data
        )
        
        print(f"📡 Status: {response.status_code}")
        if response.status_code == 200:
            result = response.json()
            print("✅ GOOGLE OAUTH ÚSPEŠNÝ!")
            print(f"👤 User: {result['user']['email']}")
            print(f"🆔 User ID: {result['user']['id']}")
            print(f"🔑 Access Token: {result['tokens']['access'][:50]}...")
            print(f"📱 Provider: {result['user']['oauth_provider']}")
            return result['tokens']['access']
        else:
            print("❌ CHYBA:", response.json())
            return None
            
    except Exception as e:
        print(f"❌ EXCEPTION: {e}")
        return None

def main():
    print("🚀 SPUSTENIE TESTOV AUTENTIFIKÁCIE")
    print("Uistite sa, že server beží na http://localhost:8000")
    
    # Test normálneho prihlásenia
    access_token = test_normal_login()
    
    # Test profile endpoint
    if access_token:
        test_profile(access_token)
    
    # Test GitHub OAuth
    github_token = test_github_oauth_direct()
    if github_token:
        test_profile(github_token)
    
    # Test Google OAuth
    google_token = test_google_oauth()
    if google_token:
        test_profile(google_token)
    
    print_separator("TESTOVANIE UKONČENÉ")

if __name__ == "__main__":
    main()
