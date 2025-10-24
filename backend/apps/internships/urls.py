from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views
from .views import student_my_internships  

router = DefaultRouter()
router.register(r'internships', views.InternshipViewSet)
router.register(r'history', views.InternshipHistoryViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('me/internships/', student_my_internships, name='student_my_internships'),
]
