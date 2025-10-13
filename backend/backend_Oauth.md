Na základe testov a dokumentácie mám prehľad o všetkých dostupných endpointoch. Tu je kompletný zoznam:

🔐 Autentifikačné Endpointy
1. Normálne prihlásenie
URL: POST /api/auth/login/

Popis: Prihlásenie s emailom a heslom

Body:

json
{
  "email": "test@example.com",
  "password": "testpass123"
}
2. Profil používateľa
URL: GET /api/auth/profile/

Popis: Získanie profilu prihláseného používateľa

Headers: Authorization: Bearer {access_token}

3. Obnovenie tokenu
URL: POST /api/auth/token/refresh/

Popis: Obnovenie access tokenu pomocou refresh tokenu

Body:

json
{
  "refresh": "refresh_token"
}
🔗 OAuth 2.0 Endpointy
4. GitHub OAuth
URL: POST /api/auth/github/

Popis: Prihlásenie pomocou GitHub OAuth

Body:

json
{
  "access_token": "github_access_token"
}
5. Google OAuth
URL: POST /api/auth/google/

Popis: Prihlásenie pomocou Google OAuth

Body:

json
{
  "access_token": "google_access_token"
}
🌐 OAuth 2.0 Authorization Flow Endpointy
6. Authorization Endpoint
URL: GET /api/auth/oauth/authorize/

Parametre:

client_id - identifikátor klienta

redirect_uri - URL pre presmerovanie

response_type=code - musí byť "code"

state - bezpečnostný parameter

scope - požadované oprávnenia

7. Token Endpoint
URL: POST /api/auth/oauth/token/

Popis: Výmena authorization code za access token

Body:

json
{
  "grant_type": "authorization_code",
  "client_id": "test-client-123",
  "client_secret": "test-secret-456",
  "code": "authorization_code",
  "redirect_uri": "http://localhost:3000/auth/callback"
}
8. UserInfo Endpoint
URL: GET /api/auth/oauth/userinfo/

Popis: Získanie informácií o používateľovi pomocou OAuth tokenu

Headers: Authorization: Bearer {oauth_access_token}

📊 Štruktúra odpovedí
Úspešné prihlásenie
json
{
  "user": {
    "id": 1,
    "email": "test@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "avatar": "url_to_avatar",
    "oauth_provider": "github|google|null",
    "phone": "+421...",
    "created_at": "2024-01-01T00:00:00Z"
  },
  "tokens": {
    "access": "access_token",
    "refresh": "refresh_token"
  }
}
UserInfo odpoveď
json
{
  "id": 1,
  "email": "test@example.com",
  "first_name": "John",
  "last_name": "Doe",
  "avatar": "url_to_avatar",
  "oauth_provider": "github|google|null",
  "phone": "+421...",
  "created_at": "2024-01-01T00:00:00Z"
}
🔧 Testovacie údaje
Pre testovanie môžete použiť:

Normálne prihlásenie:

email: test@example.com

password: testpass123

OAuth klient:

client_id: test-client-123

client_secret: test-secret-456

🌟 Kľúčové vlastnosti
Podpora viacerých OAuth providerov (GitHub, Google)

Štandardný OAuth 2.0 flow (Authorization Code)

Refresh token podpora

Bezpečnostné parametre (state parameter)

Profilové informácie s podporou avatarov

Všetky endpointy sú pripravené na integráciu s frontendom a podporujú moderné autentifikačné postupy.
