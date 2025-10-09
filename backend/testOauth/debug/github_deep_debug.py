import requests
import json
import webbrowser
import time

def github_deep_debug():
    print("🐛 HĽBKOVÝ DEBUG GITHUB OAUTH")
    
    # Nová autorizácia
    state = str(int(time.time()))
    auth_url = (
        "https://github.com/login/oauth/authorize"
        "?client_id=Ov23liOWTHd1m2SlMTW0"
        "&redirect_uri=http://localhost:8000/api/auth/github/callback/"
        "&scope=user:email,read:user"
        f"&state={state}"
    )
    
    print("🌐 OTVÁRAM NOVÚ AUTORIZÁCIU...")
    webbrowser.open(auth_url)
    
    code = input("🔑 ZADAJTE NOVÝ GITHUB CODE: ").strip()
    
    if not code:
        print("❌ Žiadny code zadaný")
        return
    
    print(f"🔑 Code: {code}")
    print(f"🔑 Dĺžka: {len(code)} znakov")
    
    # Test 1: Priama komunikácia s GitHub
    print("\n" + "="*50)
    print("1. 🔄 TEST PRIAMEJ KOMUNIKÁCIE S GITHUB")
    print("="*50)
    
    token_url = "https://github.com/login/oauth/access_token"
    token_data = {
        "client_id": "Ov23liOWTHd1m2SlMTW0",
        "client_secret": "427ad496fa6073b272bfead8b82f3258c64a85a6", 
        "code": code,
        "redirect_uri": "http://localhost:8000/api/auth/github/callback/"
    }
    
    print(f"📍 URL: {token_url}")
    print(f"📦 Data: {json.dumps(token_data, indent=2)}")
    
    try:
        response = requests.post(
            token_url,
            headers={
                "Accept": "application/json",
                "Content-Type": "application/x-www-form-urlencoded"
            },
            data=token_data,
            timeout=15
        )
        
        print(f"📡 Status Code: {response.status_code}")
        print(f"📄 Headers: {dict(response.headers)}")
        print(f"📝 Response Text: {response.text}")
        
        if response.status_code == 200:
            token_json = response.json()
            print("✅ GitHub odpovedal 200 OK")
            
            if 'access_token' in token_json:
                access_token = token_json['access_token']
                print(f"🎉 ÚSPECH! Access Token: {access_token[:30]}...")
                
                # Získanie user info
                user_response = requests.get(
                    "https://api.github.com/user",
                    headers={"Authorization": f"Bearer {access_token}"}
                )
                
                if user_response.status_code == 200:
                    user_data = user_response.json()
                    print(f"👤 GitHub User: {user_data.get('login')}")
                    print(f"📛 Name: {user_data.get('name')}")
                    print(f"📧 Email: {user_data.get('email')}")
                    
                    # Test emails endpoint
                    emails_response = requests.get(
                        "https://api.github.com/user/emails",
                        headers={"Authorization": f"Bearer {access_token}"}
                    )
                    
                    if emails_response.status_code == 200:
                        emails = emails_response.json()
                        primary_email = next((e for e in emails if e['primary']), None)
                        if primary_email:
                            print(f"📨 Primary Email: {primary_email['email']}")
                    
                    print("\n🎉 GITHUB OAUTH FUNGUJE SPRÁVNE!")
                    
                else:
                    print(f"❌ Chyba user info: {user_response.status_code}")
                    
            else:
                print("❌ GitHub NEVRÁTIL access_token")
                print(f"Error: {token_json.get('error')}")
                print(f"Error Description: {token_json.get('error_description')}")
                print(f"Error URI: {token_json.get('error_uri')}")
                
        else:
            print(f"❌ GitHub vrátil chybu: {response.status_code}")
            
    except Exception as e:
        print(f"❌ Exception: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    github_deep_debug()
