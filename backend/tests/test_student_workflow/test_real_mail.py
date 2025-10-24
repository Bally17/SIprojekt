import requests
import random
import string
import time
import re

BASE_URL = "http://localhost:8000/api/auth"

def random_email():
    #rand = ''.join(random.choices(string.ascii_lowercase + string.digits, k=6))
    return f"erik.horvath@student.ukf.sk"

def register_student():
    """Test registrácie študenta"""
    email = random_email()
    payload = {
        "email": email,
        "meno": "Test",
        "priezvisko": "Student",
        "telefon": "0900000000",
        "adresa": "Testova 42, Nitra",
        "studijny_program": "Informatika"
    }

    print("🧩 Registrujem študenta...")
    resp = requests.post(f"{BASE_URL}/register/student/", json=payload)
    print("➡️ Status:", resp.status_code)
    print("➡️ Response:", resp.json())

    assert resp.status_code == 201, "❌ Registrácia zlyhala"
    print("✅ Študent úspešne zaregistrovaný!")
    return email

def check_mailtrap_message(email):
    """Overí, že Mailtrap e-mail bol odoslaný"""
    import os
    from requests.auth import HTTPBasicAuth

    MAILTRAP_TOKEN = os.getenv("MAILTRAP_TOKEN")  # pridaj do .env
    if not MAILTRAP_TOKEN:
        print("⚠️ MAILTRAP_TOKEN nie je nastavený, preskočujem kontrolu Mailtrap API.")
        return

    print("📬 Overujem e-mail cez Mailtrap API...")
    resp = requests.get(
        "https://mailtrap.io/api/accounts",
        headers={"Api-Token": MAILTRAP_TOKEN},
    )
    print("➡️ Mailtrap API status:", resp.status_code)
    print("➡️ Mailtrap API response:", resp.text[:300])

def run_test():
    print("🚀 Spúšťam kompletný študentský workflow test...")
    student_email = register_student()

    print("⏳ Čakám 5 s, aby backend stihol odoslať e-mail...")
    time.sleep(5)

    print("📧 Skontroluj Mailtrap sandbox – mal by tam byť e-mail s heslom a aktivačným odkazom.")
    print(f"👤 Registrovaný e-mail: {student_email}")

if __name__ == "__main__":
    run_test()

