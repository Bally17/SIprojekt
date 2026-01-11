"""GitHub OAuth client helpers."""
import requests


def fetch_github_user_data(access_token: str) -> dict:
    """Return a dict with GitHub user data or an error payload."""
    try:
        user_response = requests.get(
            "https://api.github.com/user",
            headers={"Authorization": f"Bearer {access_token}"},
            timeout=10,
        )
    except requests.RequestException:
        return {"ok": False, "error": {"code": "github_request_failed"}}

    if user_response.status_code != 200:
        return {"ok": False, "error": {"code": "github_userinfo_failed"}}

    user_data = user_response.json()

    try:
        email_response = requests.get(
            "https://api.github.com/user/emails",
            headers={"Authorization": f"Bearer {access_token}"},
            timeout=10,
        )
    except requests.RequestException:
        return {"ok": False, "error": {"code": "github_email_failed"}}

    if email_response.status_code == 200:
        emails = email_response.json()
        primary_email = next((email["email"] for email in emails if email.get("primary")), None)
        email = primary_email or user_data.get("email")
    else:
        email = user_data.get("email")

    if not email:
        return {"ok": False, "error": {"code": "missing_email"}}

    full_name = user_data.get("name", "") or ""
    first_name = full_name.split(" ")[0] if full_name else ""
    last_name = " ".join(full_name.split(" ")[1:]) if full_name else ""
    avatar = user_data.get("avatar_url")

    return {
        "ok": True,
        "data": {
            "email": email,
            "first_name": first_name,
            "last_name": last_name,
            "avatar": avatar,
        },
    }


def exchange_github_code_for_token(client_id: str, client_secret: str, code: str, redirect_uri: str, code_verifier: str | None = None) -> dict:
    """Exchange GitHub OAuth code for an access token."""
    try:
        token_data = {
            "client_id": client_id,
            "client_secret": client_secret,
            "code": code,
            "redirect_uri": redirect_uri,
        }
        if code_verifier:
            token_data["code_verifier"] = code_verifier

        response = requests.post(
            "https://github.com/login/oauth/access_token",
            headers={"Accept": "application/json", "Content-Type": "application/x-www-form-urlencoded"},
            data=token_data,
            timeout=10,
        )
    except requests.RequestException:
        return {"ok": False, "error": {"code": "github_token_exchange_failed"}}

    if response.status_code != 200:
        return {"ok": False, "error": {"code": "github_token_status", "status": response.status_code}}

    token_json = response.json()
    access_token = token_json.get("access_token")
    if not access_token:
        return {"ok": False, "error": {"code": "missing_access_token", "message": token_json.get("error_description")}}

    return {"ok": True, "data": {"access_token": access_token}}
