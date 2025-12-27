# apps/users/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'users', views.UserViewSet)
router.register(r'student-profiles', views.StudentProfileViewSet)
router.register(r'garant-profiles', views.GarantProfileViewSet)
router.register(r'garants', views.GarantAccountViewSet, basename="garants")

urlpatterns = [
    path('', include(router.urls)),
    path('students/search/', views.search_students, name='search_students'),
]
