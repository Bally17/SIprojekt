# backend/test_tables/test_crud_simple.py
import os
import django
import sys
import requests

sys.path.append('/app')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

def test_crud_simple():
    print("🎯 JEDNODUCHÉ TESTOVANIE CRUD ENDPOINTOV\n")
    
    base_url = "http://localhost:8000"
    
    # Test GET pre každý endpoint
    endpoints = [
        '/api/users/',
        '/api/companies/',
        '/api/internships/', 
        '/api/documents/',
    ]
    
    for endpoint in endpoints:
        try:
            response = requests.get(f"{base_url}{endpoint}")
            print(f"🔗 {endpoint:<25} | Status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                count = len(data) if isinstance(data, list) else 'N/A'
                print(f"   ✅ Úspešné - {count} záznamov")
            else:
                print(f"   ❌ Chyba: {response.text[:100]}...")
                
        except Exception as e:
            print(f"🔗 {endpoint:<25} | ❌ Výnimka: {e}")
    
    print("\n📊 ZHRNUTIE:")
    print("Otvorte http://localhost:8000/api/docs/ pre kompletnú dokumentáciu")

if __name__ == "__main__":
    test_crud_simple()
