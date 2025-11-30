from .login import LoginSerializer, GoogleAuthSerializer, GitHubAuthSerializer
from .registration import (
    StudentRegistrationSerializer,
    CompanyRegistrationSerializer,
    normalize_company_name,
)
from .password import (
    PasswordResetRequestSerializer,
    PasswordResetConfirmSerializer,
    ChangePasswordSerializer,
)

__all__ = [
    "LoginSerializer",
    "GoogleAuthSerializer",
    "GitHubAuthSerializer",
    "StudentRegistrationSerializer",
    "CompanyRegistrationSerializer",
    "normalize_company_name",
    "PasswordResetRequestSerializer",
    "PasswordResetConfirmSerializer",
    "ChangePasswordSerializer",
]
