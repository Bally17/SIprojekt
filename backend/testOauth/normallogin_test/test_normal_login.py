import requests
import json

def test_normal_login():
    print("🔐 TEST NORMÁLNEHO PRIHLÁSENIA (EMAIL/HESLO)")
    print("="*50)
    
    # Testovací používateľ (už by mal existovať)
    test_cases = [
        {
            "email": "test@example.com",
            "password": "testpass123"
        },
        {
            "email": "test@example.com", 
            "password": "nespravne_heslo"
        },
        {
            "email": "neexistujuci@example.com",
            "password": "heslo"
        }
    ]
    
    for i, credentials in enumerate(test_cases, 1):
        print(f"\n🧪 TEST {i}: {credentials['email']}")
        
        try:
            response = requests.post(
                "http://localhost:8000/api/auth/login/",
                json=credentials,
                timeout=10
            )
            
            print(f"📡 Status: {response.status_code}")
            
            if response.status_code == 200:
                result = response.json()
                print("✅ PRIHLÁSENIE ÚSPEŠNÉ!")
                print(f"   👤 User: {result['user']['email']}")
                print(f"   🆔 User ID: {result['user']['id']}")
                print(f"   🔐 Access Token: {result['tokens']['access'][:30]}...")
                
                # Test profile endpoint
                headers = {"Authorization": f"Bearer {result['tokens']['access']}"}
                profile_response = requests.get(
                    "http://localhost:8000/api/auth/profile/",
                    headers=headers,
                    timeout=5
                )
                
                if profile_response.status_code == 200:
                    print("   ✅ Profile endpoint funguje!")
                else:
                    print("   ❌ Profile endpoint chyba!")
                    
            else:
                error_data = response.json()
                print(f"❌ CHYBA: {error_data}")
                
        except Exception as e:
            print(f"❌ EXCEPTION: {e}")

def create_test_user():
    print("\n👤 VYTVÁRAM TESTOVACIEHO POUŽÍVATEĽA...")
    
    # Skontrolujeme či používateľ už existuje
    try:
        response = requests.post(
            "http://localhost:8000/api/auth/login/",
            json={
                "email": "test@example.com",
                "password": "testpass123"
            },
            timeout=5
        )
        
        if response.status_code == 200:
            print("✅ Test používateľ už existuje!")
            return True
        else:
            print("ℹ️  Test používateľ neexistuje, vytváram...")
            
            # Vytvorte používateľa cez Django shell
            print("Spustite tento príkaz v Django shell:")
            print("""
from django.contrib.auth.models import User
user = User.objects.create_user('testuser', 'test@example.com', 'testpass123')
user.first_name = 'Test'
user.last_name = 'User'
user.save()
print(f"User created: {user.email}")
            """)
            return False
            
    except Exception as e:
        print(f"❌ Chyba pri kontrole používateľa: {e}")
        return False

if __name__ == "__main__":
    print("🚀 TEST NORMÁLNEHO PRIHLÁSENIA")
    create_test_user()
    test_normal_login()
