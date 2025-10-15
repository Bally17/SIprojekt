from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'internships', views.InternshipViewSet)
router.register(r'history', views.InternshipHistoryViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
