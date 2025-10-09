from django.contrib import admin
from django.urls import path, include, re_path
from django.http import JsonResponse
from rest_framework_simplejwt.views import TokenVerifyView, TokenRefreshView
from rest_framework import permissions
from drf_yasg.views import get_schema_view
from drf_yasg import openapi

# Swagger schema configuration
schema_view = get_schema_view(
    openapi.Info(
        title="SI Projekt API",
        default_version='v1',
        description="OAuth 2.0 API pre stáže a stážistov",
        terms_of_service="https://www.google.com/policies/terms/",
        contact=openapi.Contact(email="mailnavsetko206@gmail.com"),
        license=openapi.License(name="BSD License"),
    ),
    public=True,
    permission_classes=(permissions.AllowAny,),
)

def health_check(request):
    return JsonResponse({
        'status': 'success', 
        'message': 'Django OAuth API is running!',
        'endpoints': {
            'admin': '/admin/',
            'api_docs': '/api/docs/',
            'google_oauth': '/api/auth/google/',
            'github_oauth': '/api/auth/github/',
            'user_profile': '/api/auth/profile/',
            'token_refresh': '/api/token/refresh/',
            'token_verify': '/api/token/verify/',
        }
    })

urlpatterns = [
    path('', health_check, name='health_check'),
    path('admin/', admin.site.urls),
    path('accounts/', include('allauth.urls')),
    
    # API URLs
    path('api/auth/', include('apps.authentication.urls')),
    
    # JWT URLs
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/token/verify/', TokenVerifyView.as_view(), name='token_verify'),
    
    # Swagger URLs
    path('api/docs/', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
    path('api/redoc/', schema_view.with_ui('redoc', cache_timeout=0), name='schema-redoc'),
]
