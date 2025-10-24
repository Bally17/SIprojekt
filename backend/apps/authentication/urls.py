from django.urls import path
from . import views
from rest_framework_simplejwt.views import TokenRefreshView, TokenVerifyView
from .views import StudentRegistrationView, CompanyRegistrationView  # PRIDAŤ tieto importy

urlpatterns = [
    # GitHub OAuth
    path('github/', views.github_auth, name='github-auth'),
    path('github/callback/', views.github_callback, name='github-callback'),
    
    # login
    path('login/', views.login_view, name='login'),
    path('google/', views.google_auth, name='google-auth'),
    path('profile/', views.profile, name='profile'),
    path('logout/', views.logout_view, name='logout'),
    
    # Token management
    path('token/refresh/', TokenRefreshView.as_view(), name='token-refresh'),
    path('token/verify/', TokenVerifyView.as_view(), name='token-verify'),

    #OAuth Server endpoints
    path('oauth/authorize/', views.oauth_authorize, name='oauth-authorize'),
    path('oauth/token/', views.oauth_token, name='oauth-token'),
    path('oauth/userinfo/', views.oauth_userinfo, name='oauth-userinfo'),
    path('oauth/clients/', views.oauth_clients, name='oauth-clients'),

    #Student and Company registeration
    path('register/student/', StudentRegistrationView.as_view(), name='student-registration'),
    path('register/company/', CompanyRegistrationView.as_view(), name='company-registration'),

    path('activate/<str:token>/', views.activate_account, name='activate_account'),

]
