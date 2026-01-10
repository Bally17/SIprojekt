from django.urls import include, path
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r"companies", views.CompanyViewSet, basename="company")

urlpatterns = [
    path("", include(router.urls)),
    path("search/", views.search_companies, name="search_companies"),
    path(
        "<int:company_id>/internships/",
        views.company_internships_overview,
        name="company_internships_overview",
    ),
]
