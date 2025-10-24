import requests
import json
import random
import string
import time

BASE_URL = "http://localhost:8000/api/auth"

def print_separator(title):
    print(f"\n{'='*70}")
    print(f"🧪 {title}")
    print(f"{'='*70}")

def random_email(domain="student.ukf.sk"):
    rand = ''.join(random.choices(string.ascii_lowercase, k=6))
    return f"student_{rand}@{domain}"

def random_firm_email():
    rand = ''.join(random.choices(string.ascii_lowercase, k=6))
    return f"firma_{rand}@company.com"

# 1️⃣ REGISTRÁCIA ŠTUDENTA
def test_register_student():
    print_separator("REGISTRÁCIA ŠTUDENTA")

    email = random_email()
    data = {
        "meno": "Ján",
        "priezvisko": "Testovací",
        "adresa": "Testova 42, Nitra",
        "email": email,
        "alternativny_email": "alt_" + email,
        "telefon": "0901234567",
        "studijny_program": "Aplikovaná informatika",
        "password": "hesloTest123",
        "password_confirm": "hesloTest123"
    }

    response = requests.post(f"{BASE_URL}/register/student/", json=data)
    print(f"📡 Status: {response.status_code}")
    print(f"📦 Odpoveď: {response.text}")

    if response.status_code == 201:
        print("✅ Registrácia študenta úspešná.")
        return email, data["password"]
    else:
        print("❌ Chyba registrácie študenta.")
        return None, None

# 2️⃣ PRIHLÁSENIE
def test_login(email, password):
    print_separator(f"PRIHLÁSENIE POUŽÍVATEĽA ({email})")

    data = {"email": email, "password": password}
    response = requests.post(f"{BASE_URL}/login/", json=data)
    print(f"📡 Status: {response.status_code}")
    print(f"📦 Odpoveď: {response.text}")

    if response.status_code == 200:
        result = response.json()
        token = result["tokens"]["access"]
        print("✅ Prihlásenie úspešné.")
        print(f"🔑 Access token: {token[:50]}...")
        print(f"🧭 Musí zmeniť heslo: {result['user'].get('musi_zmenit_heslo', False)}")
        return token
    else:
        print("❌ Prihlásenie zlyhalo.")
        return None

# 3️⃣ OVERENIE PROFILU
def test_profile(token):
    print_separator("OVERENIE PROFILU")

    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(f"{BASE_URL}/profile/", headers=headers)
    print(f"📡 Status: {response.status_code}")
    print(f"📦 Odpoveď: {response.text}")

    if response.status_code == 200:
        print("✅ Profil úspešne načítaný.")
    else:
        print("❌ Nepodarilo sa načítať profil.")

# 4️⃣ REGISTRÁCIA FIRMY
def test_register_company():
    print_separator("REGISTRÁCIA FIRMY")

    email = random_firm_email()
    data = {
        "email": email,
        "adresa": "Bratislavska 55",
        "kontaktna_osoba_meno": "Peter Podnikateľ",
        "kontaktna_osoba_email": "kontakt_" + email,
        "kontaktna_osoba_telefon": "0910123456"
    }

    response = requests.post(f"{BASE_URL}/register/company/", json=data)
    print(f"📡 Status: {response.status_code}")
    print(f"📦 Odpoveď: {response.text}")

    if response.status_code == 201:
        print("✅ Firma úspešne zaregistrovaná (neaktívna).")
        return email
    else:
        print("❌ Chyba pri registrácii firmy.")
        return None

# 5️⃣ POKUS O PRIHLÁSENIE NEAKTÍVNEJ FIRMY
def test_login_inactive_company(email):
    print_separator("POKUS O PRIHLÁSENIE NEAKTÍVNEJ FIRMY")

    data = {"email": email, "password": "nahodneheslo"}
    response = requests.post(f"{BASE_URL}/login/", json=data)
    print(f"📡 Status: {response.status_code}")
    print(f"📦 Odpoveď: {response.text}")

    if response.status_code == 400 or response.status_code == 401:
        print("✅ Prihlásenie neaktívnej firmy správne odmietnuté.")
    else:
        print("❌ Firma by nemala byť schopná sa prihlásiť.")

# 🔁 HLAVNÝ TESTOVACÍ TOK
def main():
    print_separator("🚀 ZAČIATOK KOMPLEXNÉHO TESTU FR-03")

    # 🧩 1. Registrácia študenta
    student_email, student_password = test_register_student()
    if not student_email:
        return

    # 🧩 2. Prihlásenie študenta
    token = test_login(student_email, student_password)
    if not token:
        return

    # 🧩 3. Načítanie profilu
    test_profile(token)

    # 🧩 4. Registrácia firmy
    firm_email = test_register_company()
    if firm_email:
        # 🧩 5. Pokus o prihlásenie neaktívnej firmy
        test_login_inactive_company(firm_email)

    print_separator("✅ TESTOVANIE DOKONČENÉ")

if __name__ == "__main__":
    main()

