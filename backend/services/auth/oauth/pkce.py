"""PKCE helpers."""
import secrets


def verify_pkce(code_verifier: str, code_challenge: str, method: str = "plain") -> bool:
    """Verify PKCE code_verifier matches the stored code_challenge."""
    if not code_challenge:
        return True
    if not code_verifier:
        return False
    method = method or "plain"
    if method == "S256":
        import hashlib
        import base64

        digest = hashlib.sha256(code_verifier.encode("ascii")).digest()
        computed = base64.urlsafe_b64encode(digest).decode("ascii").rstrip("=")
    else:
        computed = code_verifier
    return secrets.compare_digest(computed, code_challenge)
