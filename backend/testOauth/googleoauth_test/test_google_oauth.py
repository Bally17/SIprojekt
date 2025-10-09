import requests
import json
import webbrowser
import time

def get_google_token_interactive():
    print("🔵 INTERAKTÍVNY SPÔSOB ZÍSKANIA GOOGLE TOKENU")
    print("="*50)
    
    # Google OAuth Playground je najjednoduchší spôsob
    playground_url = "https://developers.google.com/oauthplayground"
    
    print("🌐 Otváram Google OAuth Playground...")
    print("POSTUP:")
    print("1. Otvorí sa OAuth Playground")
    print("2. V ľavom menu vyberte: 'Google OAuth2 API v2'")
    print("3. Zaškrtnite: https://www.googleapis.com/auth/userinfo.email")
    print("4. Zaškrtnite: https://www.googleapis.com/auth/userinfo.profile") 
    print("5. Kliknite 'Authorize APIs'")
    print("6. Prihláste sa a povolte prístup")
    print("7. Kliknite 'Exchange authorization code for tokens'")
    print("8. Skopírujte 'Access token'")
    print("")
    
    webbrowser.open(playground_url)
    
    time.sleep(5)
    
    access_token = input("🔑 ZADAJTE GOOGLE ACCESS TOKEN: ").strip()
    
    if not access_token:
        print("❌ Žiadny token zadaný")
        return None
    
    return access_token

def test_google_oauth_with_token(access_token):
    print(f"\n🧪 TESTUJEM GOOGLE OAUTH S TOKENOM...")
    
    # Najprv overíme token priamo s Google
    print("🔄 Overujem token s Google...")
    try:
        google_response = requests.get(
            "https://www.googleapis.com/oauth2/v3/userinfo",
            headers={"Authorization": f"Bearer {access_token}"},
            timeout=10
        )
        
        print(f"📡 Google Status: {google_response.status_code}")
        
        if google_response.status_code == 200:
            google_data = google_response.json()
            print("✅ Google token je platný!")
            print(f"   👤 Google User: {google_data.get('email')}")
            print(f"   📛 Name: {google_data.get('name')}")
        else:
            print(f"❌ Google token nie je platný: {google_response.status_code}")
            print(f"   Response: {google_response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Chyba pri overovaní tokenu: {e}")
        return False
    
    # Test našej backend endpoint
    print("\n🚀 Testujem našu backend endpoint...")
    try:
        backend_data = {"access_token": access_token}
        backend_response = requests.post(
            "http://localhost:8000/api/auth/google/",
            json=backend_data,
            timeout=10
        )
        
        print(f"📡 Backend Status: {backend_response.status_code}")
        
        if backend_response.status_code == 200:
            result = backend_response.json()
            print("🎉 GOOGLE OAUTH FUNGUJE!")
            print("="*50)
            print(f"👤 User: {result['user']['email']}")
            print(f"📱 Provider: {result['user']['oauth_provider']}")
            print(f"🆔 User ID: {result['user']['id']}")
            print(f"🔐 JWT Token: {result['tokens']['access'][:30]}...")
            
            # Test profile endpoint
            headers = {"Authorization": f"Bearer {result['tokens']['access']}"}
            profile_response = requests.get(
                "http://localhost:8000/api/auth/profile/",
                headers=headers,
                timeout=5
            )
            
            if profile_response.status_code == 200:
                print("✅ Profile endpoint funguje!")
            else:
                print("❌ Profile endpoint chyba!")
                
            return True
        else:
            print("❌ Backend chyba:", backend_response.json())
            return False
            
    except Exception as e:
        print(f"❌ Exception: {e}")
        return False

def test_google_oauth_manual():
    print("\n🔵 MANUÁLNY TEST GOOGLE OAUTH")
    print("="*50)
    
    # Test s fiktívnym tokenom
    test_cases = [
        {"access_token": "invalid_token_123"},
        {"access_token": ""},
        {}
    ]
    
    for i, test_data in enumerate(test_cases, 1):
        print(f"\n🧪 TEST {i}: {test_data}")
        
        try:
            response = requests.post(
                "http://localhost:8000/api/auth/google/",
                json=test_data,
                timeout=5
            )
            
            print(f"📡 Status: {response.status_code}")
            print(f"📄 Response: {response.json()}")
            
        except Exception as e:
            print(f"❌ Exception: {e}")

if __name__ == "__main__":
    print("🚀 TEST GOOGLE OAUTH")
    print("Poznámka: Google OAuth vyžaduje platný access_token")
    print("")
    
    # Interaktívny test s reálnym tokenom
    access_token = get_google_token_interactive()
    if access_token:
        test_google_oauth_with_token(access_token)
    
    # Manuálny test s neplatnými tokenmi
    test_google_oauth_manual()
