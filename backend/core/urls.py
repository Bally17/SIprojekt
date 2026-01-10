"""Root URL configuration for the Django project."""
from django.http import JsonResponse
from django.urls import include, path
from django.contrib import admin
from drf_yasg.views import get_schema_view
from drf_yasg import openapi
from rest_framework import permissions
from django.conf import settings
from django.conf.urls.static import static

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
    authentication_classes=[],
)


def health_check(request):
    """Return a simple health check payload for monitoring."""
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
            'users': '/api/users/',
            'companies': '/api/companies/',
            'internships': '/api/internships/',
            'documents': '/api/documents/',
            'notifications': '/api/notifications/',
        }
    })


urlpatterns = [
    path('', health_check, name='health_check'),

    path('admin/', admin.site.urls),
    path('accounts/', include('allauth.urls')),

    path('api/auth/', include('apps.authentication.urls')),

    path('api/users/', include('apps.users.urls')),
    path('api/companies/', include('apps.companies.urls')),
    path('api/internships/', include('apps.internships.urls')),
    path('api/documents/', include('apps.documents.urls')),
    path('api/notifications/', include('apps.notifications.urls')),

    path('api/docs/', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
    path('api/redoc/', schema_view.with_ui('redoc', cache_timeout=0), name='schema-redoc'),

]
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
