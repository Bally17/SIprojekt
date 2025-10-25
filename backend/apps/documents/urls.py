from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import DocumentViewSet

# Netreba prefixovať názvom 'documents' – bude to /api/documents/<id>/
router = DefaultRouter()
router.register(r'', DocumentViewSet, basename='documents')

urlpatterns = [
    path('', include(router.urls)),
]
