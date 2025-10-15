import requests
import json

# Test normálneho prihlásenia
def test_normal_login():
    url = "http://localhost:8000/api/auth/login/"
    data = {
        "email": "test@example.com",
        "password": "testpass123"
    }
    
    response = requests.post(url, json=data)
    print("Status Code:", response.status_code)
    print("Response:", response.json())
    return response.json()

# Test profile endpoint (po prihlásení)
def test_profile(access_token):
    url = "http://localhost:8000/api/auth/profile/"
    headers = {
        "Authorization": f"Bearer {access_token}"
    }
    
    response = requests.get(url, headers=headers)
    print("Profile Status:", response.status_code)
    print("Profile Data:", response.json())

if __name__ == "__main__":
    print("Testing normal login...")
    result = test_normal_login()
    
    if "tokens" in result:
        access_token = result["tokens"]["access"]
        print("\nTesting profile endpoint...")
        test_profile(access_token)
