import requests
import json
import time
import webbrowser

def github_device_flow_fixed():
    print("📱 GITHUB DEVICE FLOW - OPRAVENÁ VERZIA")
    print("="*50)
    
    # Krok 1: Získanie device code
    print("🔄 KROK 1: Žiadam o device code...")
    device_response = requests.post(
        "https://github.com/login/device/code",
        headers={"Accept": "application/json"},
        data={
            "client_id": "Ov23liOWTHd1m2SlMTW0",
            "scope": "user:email,read:user"
        },
        timeout=10
    )
    
    if device_response.status_code != 200:
        print(f"❌ Chyba pri získavaní device code: {device_response.status_code}")
        print(f"Response: {device_response.text}")
        return
    
    device_data = device_response.json()
    print("✅ Device code získaný!")
    
    device_code = device_data["device_code"]
    user_code = device_data["user_code"]
    verification_uri = device_data["verification_uri"]
    expires_in = device_data["expires_in"]
    interval = device_data["interval"]
    
    print(f"🔢 USER CODE: {user_code}")
    print(f"🌐 Verification URI: {verification_uri}")
    print(f"⏰ Platnosť: {expires_in} sekúnd")
    
    # Otvorte verification URI
    print(f"\n🌐 Otváram: {verification_uri}")
    webbrowser.open(verification_uri)
    
    print("\n🎯 POSTUP:")
    print("1. Otvorí sa GitHub stránka: https://github.com/login/device")
    print("2. ZADAJTE TENTO USER CODE: " + user_code)
    print("3. Kliknite 'Continue'")
    print("4. Kliknite 'Authorize'")
    print("5. Script bude automaticky pokračovať...")
    print("")
    
    # Krok 2: Čakanie na autorizáciu
    print("⏳ Čakám na autorizáciu...")
    start_time = time.time()
    poll_count = 0
    
    while time.time() - start_time < expires_in:
        poll_count += 1
        elapsed = int(time.time() - start_time)
        remaining = expires_in - elapsed
        
        print(f"🔍 Kontrola #{poll_count} ({elapsed}s/{expires_in}s, zostáva {remaining}s)...")
        
        try:
            token_response = requests.post(
                "https://github.com/login/oauth/access_token",
                headers={"Accept": "application/json"},
                data={
                    "client_id": "Ov23liOWTHd1m2SlMTW0",
                    "device_code": device_code,
                    "grant_type": "urn:ietf:params:oauth:grant-type:device_code"
                },
                timeout=10
            )
            
            token_data = token_response.json()
            
            if "access_token" in token_data:
                access_token = token_data["access_token"]
                print("\n🎉 ÚSPECH! GitHub access token získaný!")
                print(f"🔑 Access Token: {access_token}")
                
                # Krok 3: Použite access_token v našom backende
                print("\n🚀 Posielam access_token na náš backend...")
                backend_response = requests.post(
                    "http://localhost:8000/api/auth/github/",
                    json={"access_token": access_token},
                    timeout=10
                )
                
                print(f"📡 Backend Status: {backend_response.status_code}")
                
                if backend_response.status_code == 200:
                    result = backend_response.json()
                    print("\n" + "="*60)
                    print("✅ GITHUB OAUTH FUNGUJE!")
                    print("="*60)
                    print(f"👤 User: {result['user']['email']}")
                    print(f"📱 Provider: {result['user']['oauth_provider']}")
                    print(f"🆔 User ID: {result['user']['id']}")
                    print(f"🔐 JWT Access Token: {result['tokens']['access'][:30]}...")
                    
                    # Test profile endpoint
                    print("\n🧪 Testovanie profile endpointu...")
                    headers = {"Authorization": f"Bearer {result['tokens']['access']}"}
                    profile_response = requests.get(
                        "http://localhost:8000/api/auth/profile/",
                        headers=headers,
                        timeout=10
                    )
                    
                    if profile_response.status_code == 200:
                        print("✅ Profile endpoint funguje!")
                    else:
                        print("❌ Profile endpoint chyba:", profile_response.json())
                    
                    return True
                else:
                    print("❌ Backend chyba:", backend_response.json())
                    return False
                    
            elif token_data.get("error") == "authorization_pending":
                # Ešte neautorizované, čakáme
                print("   ⏳ Ešte neautorizované...")
                time.sleep(interval)
            elif token_data.get("error") == "slow_down":
                # Príliš rýchle requesty, zvýšime interval
                interval += 5
                print(f"   ⚠️  Príliš rýchle requesty, nový interval: {interval}s")
                time.sleep(interval)
            elif token_data.get("error") == "expired_token":
                print("❌ Token expiroval")
                return False
            elif token_data.get("error") == "access_denied":
                print("❌ Používateľ zrušil autorizáciu")
                return False
            else:
                print(f"   ❌ Chyba: {token_data}")
                time.sleep(interval)
                
        except requests.Timeout:
            print("   ❌ Timeout pri komunikácii s GitHub")
            time.sleep(interval)
        except requests.ConnectionError:
            print("   ❌ Connection error")
            time.sleep(interval)
        except Exception as e:
            print(f"   ❌ Exception: {e}")
            time.sleep(interval)
    
    print("\n❌ Timeout: Autorizácia neprebehla v stanovenom čase (15 minút)")
    return False

if __name__ == "__main__":
    print("🚀 SPUSTENIE GITHUB DEVICE FLOW")
    print("Uistite sa, že:")
    print("1. Server beží na http://localhost:8000")
    print("2. Device Flow je povolený v GitHub OAuth App")
    print("3. Ste prihlásený na GitHub v prehliadači")
    print("")
    
    success = github_device_flow_fixed()
    
    if success:
        print("\n" + "🎉" * 20)
        print("🎉 GITHUB OAUTH JE FUNKČNÝ! 🎉")
        print("🎉" * 20)
    else:
        print("\n💥 GITHUB OAUTH ZLYHAL")
        print("\n🔧 Riešenie problémov:")
        print("1. Skontrolujte či je Device Flow povolený v GitHub OAuth App")
        print("2. Skontrolujte či server beží")
        print("3. Skúste znova")
