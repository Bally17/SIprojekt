from .login import LoginSerializer, GoogleAuthSerializer, GitHubAuthSerializer
from .registration import (
    StudentRegistrationSerializer,
    CompanyRegistrationSerializer,
    CompanyProfileCompletionSerializer,
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
    "CompanyProfileCompletionSerializer",
    "normalize_company_name",
    "PasswordResetRequestSerializer",
    "PasswordResetConfirmSerializer",
    "ChangePasswordSerializer",
]
