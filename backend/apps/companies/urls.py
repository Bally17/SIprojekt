# apps/companies/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views  # musí byť

# router pre CRUD firmy
router = DefaultRouter()
router.register(r'companies', views.CompanyViewSet, basename='company')

urlpatterns = [
    # CRUD firmy
    path('', include(router.urls)),

    # 🔍 Fulltext vyhľadávanie
    path('search/', views.search_companies, name='search_companies'),

    # 🔹 Detail firmy + praxe
    path('<int:company_id>/internships/', views.company_internships_overview, name='company_internships_overview'),
]
