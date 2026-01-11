"""Email delivery adapters."""

from .auth import send_activation_email, send_password_email, send_password_reset_email

__all__ = ["send_activation_email", "send_password_email", "send_password_reset_email"]
