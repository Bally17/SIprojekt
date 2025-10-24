from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CompanyViewSet, company_internships_overview

router = DefaultRouter()
router.register(r'companies', CompanyViewSet)

urlpatterns = [
    path('', include(router.urls)),

    # 🔹 Explicitný endpoint na prehľad praxí firmy
    path('<int:company_id>/internships/', company_internships_overview, name='company-internships-overview'),
]
