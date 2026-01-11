from __future__ import annotations

from django.conf import settings


def build_csp_header() -> str:
    """Return a conservative CSP that is compatible with Django admin."""
    custom = getattr(settings, "CSP_HEADER", None)
    if custom:
        return custom

    directives = [
        "base-uri 'none'",
        "default-src 'self'",
        "object-src 'none'",
        "frame-ancestors 'none'",
        "form-action 'self'",
        "script-src 'self' 'unsafe-inline'",
        "script-src-attr 'none'",
        "style-src 'self' 'unsafe-inline'",
        "style-src-attr 'self' 'unsafe-inline'",
        "img-src 'self' data: blob:",
        "font-src 'self' data:",
        "manifest-src 'self'",
        "worker-src 'self' blob:",
        "media-src 'self'",
        "connect-src 'self'",
    ]
    return "; ".join(directives)


class SecurityHeadersMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response
        self.csp = build_csp_header()
        self.csp_report_only = getattr(settings, "CSP_REPORT_ONLY", settings.DEBUG)

    def __call__(self, request):
        response = self.get_response(request)

        if (
            "Content-Security-Policy" not in response
            and "Content-Security-Policy-Report-Only" not in response
        ):
            header_name = (
                "Content-Security-Policy-Report-Only"
                if self.csp_report_only
                else "Content-Security-Policy"
            )
            response[header_name] = self.csp

        response.setdefault("X-Content-Type-Options", "nosniff")
        response.setdefault("Referrer-Policy", "strict-origin-when-cross-origin")
        response.setdefault("Permissions-Policy", "geolocation=(), microphone=(), camera=()")
        response.setdefault("X-Frame-Options", "SAMEORIGIN")

        return response
