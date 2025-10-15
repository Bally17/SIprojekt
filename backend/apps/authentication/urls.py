from django.urls import path
from . import views
from rest_framework_simplejwt.views import TokenRefreshView, TokenVerifyView

urlpatterns = [
    # GitHub OAuth
    path('github/', views.github_auth, name='github-auth'),
    path('github/callback/', views.github_callback, name='github-callback'),
    
    # Nové endpointy
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
]
