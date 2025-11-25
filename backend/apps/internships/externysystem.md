# Externý systém – integrácia (OAuth 2.0)

Cieľ: Umožniť externému systému (napr. školská aplikácia) čítať praxe a meniť stav z `schvalena` na `obhajena` cez OAuth 2.0.

## Čo treba mať vytvorené
- **Service účet** s rolou `externy` (prípadne `garant`).
- **OAuth klient** v DB:
  - private client_credentials (shared secret) **alebo** private_key_jwt.
  - Polia: `client_id`, `client_secret` (ak používaš secret), `allow_private_jwt` (True, ak používaš JWT assertion), `public_key` (PEM, ak JWT), `is_public=False`, `allow_password_grant=False`, `scope="read write"`.
- **Migrácie**: aplikované (vrátane 0003, 0004 v `authentication`).

Rýchly seed (secret varianta):
```
cd backend
python3.13 manage.py seed_external_client \
  --client-id external-client \
  --client-secret super-secret \
  --service-email externy@skola.example
```

## Získanie tokenu (client_credentials + secret)
```
curl -X POST http://localhost:8000/api/auth/oauth/token/ \
  -H "Content-Type: application/json" \
  -d '{"grant_type":"client_credentials","client_id":"external-client","client_secret":"super-secret"}'
```
Odpoveď: `access_token` (JWT), `expires_in` (~15 min), `refresh_token`.

## Získanie tokenu (private_key_jwt, bez secretu)
1) Ulož public key do OAuth klienta a nastav `allow_private_jwt=True`.
2) Podpíš JWT (RS256) privátnym kľúčom:
   - claims: `iss=client_id`, `sub=client_id`, `aud=http://localhost:8000/api/auth/oauth/token/`, krátky `exp`, `iat`, `jti`.
3) Pošli požiadavku:
```
curl -X POST http://localhost:8000/api/auth/oauth/token/ \
  -H "Content-Type: application/json" \
  -d '{
    "grant_type":"client_credentials",
    "client_id":"external-client-jwt",
    "client_assertion_type":"urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
    "client_assertion":"<PODPÍSANÝ_RS256_JWT>"
  }'
```

## Volanie API s access tokenom
- Prehľad praxí (externy/garant; filtruje sa `stav`, `rok`, `semester`, `search`):
```
curl -H "Authorization: Bearer ACCESS_TOKEN" \
  "http://localhost:8000/api/internships/external/internships/?stav=schvalena"
```
- Zmena stavu `schvalena` → `obhajena`:
```
curl -X POST http://localhost:8000/api/internships/external/defense/ \
  -H "Authorization: Bearer ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"prax_id": PRAX_ID, "note": "obhajene externym systemom", "external_reference": "EXT-123"}'
```
Očakávaný stav v odpovedi: `obhajena`.

## Poznámky k produkcii
- Použi HTTPS (ideálne mTLS) a ulož secrety/kľúče do trezora; rotuj ich.
- Nastav `allow_private_jwt` + public key pre partnerov, aby si nemusel posielať shared secret.
- Access token krátka životnosť, úzky scope (napr. `internships.read` + `internships.defense`).
- Logovanie/audit a rate limiting na `/oauth/token` a externé endpointy.
