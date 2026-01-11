from .login import (
    LoginSerializer,
    GoogleAuthSerializer,
    GitHubAuthSerializer,
    GitHubCompanySerializer,
)
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
from .oauth import (
    OAuthAuthorizeSerializer,
    OAuthTokenSerializer,
    OAuthClientCreateSerializer,
)

__all__ = [
    "LoginSerializer",
    "GoogleAuthSerializer",
    "GitHubAuthSerializer",
    "GitHubCompanySerializer",
    "StudentRegistrationSerializer",
    "CompanyRegistrationSerializer",
    "CompanyProfileCompletionSerializer",
    "normalize_company_name",
    "PasswordResetRequestSerializer",
    "PasswordResetConfirmSerializer",
    "ChangePasswordSerializer",
    "OAuthAuthorizeSerializer",
    "OAuthTokenSerializer",
    "OAuthClientCreateSerializer",
]
