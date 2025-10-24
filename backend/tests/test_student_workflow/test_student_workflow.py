import re
import requests

BASE_URL = "http://localhost:8000/api/auth"

# 1️⃣ Registrácia študenta
def register_student():
    print("🧩 Registrujem študenta...")
    payload = {
        "email": "student_auto2@student.ukf.sk", #nutne menit mail zakazdym
        "meno": "Test",
        "priezvisko": "Student",
        "telefon": "0900000000",
        "adresa": "Testova 42, Nitra",
        "studijny_program": "Informatika"
    }

    resp = requests.post(f"{BASE_URL}/register/student/", json=payload)
    print("➡️ Status:", resp.status_code)
    print("➡️ Response:", resp.json())
    assert resp.status_code == 201, "Registrácia zlyhala"
    return resp.json()


# 2️⃣ Získanie posledného emailu z backend logu (console backend)
def extract_activation_link_and_password():
    """
    Pozrie do docker logu backendu a nájde link a heslo z emailu.
    Funguje len ak používaš EmailBackend = console.EmailBackend.
    """
    import subprocess

    logs = subprocess.check_output(["docker", "compose", "logs", "backend"], text=True)

    # Heslo
    password_match = re.search(r"Heslo:\s*(.+)", logs)
    activation_match = re.search(r"(http://[^\s]+/activate/[^\s]+)", logs)

    if not password_match or not activation_match:
        raise Exception("Nepodarilo sa nájsť heslo alebo aktivačný link v logu.")

    password = password_match.group(1).strip()
    activation_link = activation_match.group(1).strip()

    print(f"🔑 Heslo: {password}")
    print(f"🔗 Aktivácia: {activation_link}")

    return password, activation_link


# 3️⃣ Aktivácia účtu
def activate_account(activation_link):
    print("✅ Aktivujem účet...")
    resp = requests.get(activation_link.replace("http://localhost:3000", "http://localhost:8000/api/auth"))
    print("➡️ Status:", resp.status_code)
    print("➡️ Response:", resp.json())
    assert resp.status_code == 200, "Aktivácia zlyhala"


# 4️⃣ Login test
def login_student(email, password):
    print("🔐 Testujem prihlásenie...")
    resp = requests.post(f"{BASE_URL}/login/", json={
        "email": email,
        "password": password
    })
    print("➡️ Status:", resp.status_code)
    print("➡️ Response:", resp.json())
    assert resp.status_code == 200, "Login zlyhal"
    assert "tokens" in resp.json(), "Chýbajú JWT tokeny"
    print("🎉 Prihlásenie úspešné!")


if __name__ == "__main__":
    print("🚀 Spúšťam kompletný študentský workflow test...")
    register_student()
    password, activation_link = extract_activation_link_and_password()
    activate_account(activation_link)
    login_student("student_test@student.ukf.sk", password)
    print("\n✅ Celý študentský workflow úspešne otestovaný!")

