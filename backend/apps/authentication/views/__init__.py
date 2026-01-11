from common.auth.context import get_tokens_for_user, get_user_data, password_reset_signer, signer
from .login import (
    company_login_view,
    garant_login_view,
    login_view,
    logout_view,
    profile,
    profile_missing_fields,
)
from .oauth_server import (
    oauth_authorize,
    oauth_client_detail,
    oauth_clients,
    oauth_token,
    oauth_userinfo,
)
from .password import change_password, password_reset_confirm, password_reset_request
from .registration import (
    CompanyRegistrationView,
    StudentRegistrationView,
    company_profile_complete,
    activate_account,
)
from .social import (
    google_auth,
    github_auth,
    github_callback,
    google_company_register,
    github_company_register,
)

__all__ = [
    "get_tokens_for_user",
    "get_user_data",
    "signer",
    "password_reset_signer",
    "login_view",
    "company_login_view",
    "garant_login_view",
    "profile",
    "profile_missing_fields",
    "logout_view",
    "oauth_authorize",
    "oauth_token",
    "oauth_userinfo",
    "oauth_clients",
    "oauth_client_detail",
    "password_reset_request",
    "password_reset_confirm",
    "change_password",
    "StudentRegistrationView",
    "CompanyRegistrationView",
    "activate_account",
    "company_profile_complete",
    "google_auth",
    "github_auth",
    "github_callback",
    "google_company_register",
    "github_company_register",
]
