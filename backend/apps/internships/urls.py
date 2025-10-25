from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'internships', views.InternshipViewSet)
router.register(r'history', views.InternshipHistoryViewSet)

urlpatterns = [
    path('', include(router.urls)),

    # 🔹 Študentské endpointy
    path('me/internships/', views.me_internships, name='me_internships'),  # ✅ opravené

    # 🔹 Firemné endpointy
    path('company/me/internships/', views.company_my_internships, name='company_my_internships'),
    path('company/me/internships/pending/', views.company_pending_internships, name='company_pending_internships'),

    # 🔹 Vytvorenie praxe
    path('create/', views.create_internship, name='create_internship'),
]
