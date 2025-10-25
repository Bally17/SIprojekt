# Password Reset Flow:
## Backend
- `POST /api/auth/password/reset/` – prijme primárny e-mail používateľa (študent, firma, garant, admin) a ak existuje, vygeneruje podpisovaný token (platný 60 min) a odošle e-mail s odkazom `FRONTEND_URL/reset-password/<token>/`.
- `POST /api/auth/password/reset/confirm/` – očakáva token a nové heslo (vrátane potvrdenia), overí platnosť tokenu a nastaví heslo cez `User.set_password`.
- E-mail sa posiela cez existujúce nastavenie (v dev prostredí sa zobrazuje priamo v konzole).

## Frontend
- `/forgot-password` – formulár na zadanie e-mailu; po odoslaní vypíše, že ak účet existuje, bol odoslaný odkaz.
- `/reset-password/[token]` – komponent na nastavenie nového hesla, volá backend confirm endpoint.
- Login stránka obsahuje link "Zabudli ste heslo?" vedúci na `/forgot-password`.

## Ako testovať
1. Spusti backend (`docker compose up`).
2. V Postmane alebo frontend formulári odošli `POST http://localhost:8000/api/auth/password/reset/` s existujúcim primárnym e-mailom (napr. `student1@student.ukf.sk`).
3. Sleduj backend konzolu – v dev režime sa zobrazí text e-mailu s linkom.
4. Otvor link (napr. `http://localhost:3000/reset-password/<token>/`), zadaj nové heslo a odošli. Alternatívne pošli `POST /api/auth/password/reset/confirm/` s JSON:
   ```json
   {
     "token": "<token>",
     "new_password": "NoveHeslo123!",
     "new_password_confirm": "NoveHeslo123!"
   }
   ```
5. Pri 200 OK môžeš skúsiť prihlásenie novým heslom.

Poznámka: Reset funguje len pre primárne e-maily.
