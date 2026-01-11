"""Google OAuth client helpers."""
import requests


def fetch_google_user_data(access_token: str) -> dict:
    """Return a dict with Google user data or an error payload."""
    try:
        response = requests.get(
            "https://www.googleapis.com/oauth2/v3/userinfo",
            headers={"Authorization": f"Bearer {access_token}"},
            timeout=10,
        )
    except requests.RequestException:
        return {"ok": False, "error": {"code": "google_request_failed"}}

    if response.status_code != 200:
        return {"ok": False, "error": {"code": "invalid_google_token"}}

    data = response.json()
    email = data.get("email")
    if not email:
        return {"ok": False, "error": {"code": "missing_email"}}

    return {
        "ok": True,
        "data": {
        "email": email,
        "first_name": data.get("given_name", ""),
        "last_name": data.get("family_name", ""),
        "avatar": data.get("picture"),
    },
}


def exchange_google_code_for_token(
    client_id: str,
    client_secret: str,
    code: str,
    redirect_uri: str,
    code_verifier: str,
) -> dict:
    """Exchange a Google OAuth code for an access token."""
    try:
        response = requests.post(
            "https://oauth2.googleapis.com/token",
            data={
                "grant_type": "authorization_code",
                "code": code,
                "client_id": client_id,
                "client_secret": client_secret,
                "redirect_uri": redirect_uri,
                "code_verifier": code_verifier,
            },
            timeout=15,
        )
    except requests.RequestException:
        return {
            "ok": False,
            "status": 500,
            "data": {"error": "Failed to exchange code for token"},
            "error": {"code": "google_token_exchange_failed"},
        }

    token_data = response.json() if response.content else {}
    if response.status_code != 200:
        return {
            "ok": False,
            "status": 400,
            "data": {"error": "Google token exchange failed"},
            "error": {"code": "google_token_status", "status": response.status_code},
        }

    access_token = token_data.get("access_token")
    if not access_token:
        return {
            "ok": False,
            "status": 400,
            "data": {"error": "Google response missing access_token"},
            "error": {
                "code": "missing_access_token",
                "message": token_data.get("error_description"),
            },
        }

    return {"ok": True, "data": {"access_token": access_token}}
