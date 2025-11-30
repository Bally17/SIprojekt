import csv
from typing import Optional

from django.conf import settings
from django.http import HttpResponse
from django.utils import timezone
from django.db import transaction
from django.db.models import Q
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from drf_yasg import openapi
from drf_yasg.utils import swagger_auto_schema

from apps.users.models import User

from ..models import Prax, HistoriaStavovPraxe
from ..serializers import InternshipSerializer


GARANT_LIST_FILTERS = [
    openapi.Parameter("rok", openapi.IN_QUERY, description="Filtruj podľa roku", type=openapi.TYPE_INTEGER),
    openapi.Parameter(
        "semester", openapi.IN_QUERY, description="Filtruj podľa semestra (zimny/letny)", type=openapi.TYPE_STRING
    ),
    openapi.Parameter("stav", openapi.IN_QUERY, description="Filtruj podľa stavu praxe", type=openapi.TYPE_STRING),
    openapi.Parameter("student_id", openapi.IN_QUERY, description="ID študenta", type=openapi.TYPE_INTEGER),
    openapi.Parameter("firma_id", openapi.IN_QUERY, description="ID firmy", type=openapi.TYPE_INTEGER),
    openapi.Parameter(
        "search", openapi.IN_QUERY, description="Fulltext v mene študenta alebo názve firmy", type=openapi.TYPE_STRING
    ),
    openapi.Parameter(
        "student", openapi.IN_QUERY, description="Textový filter mena alebo emailu študenta", type=openapi.TYPE_STRING
    ),
    openapi.Parameter(
        "firma", openapi.IN_QUERY, description="Textový filter názvu firmy", type=openapi.TYPE_STRING
    ),
    openapi.Parameter(
        "odbor", openapi.IN_QUERY, description="Filter podľa študijného programu", type=openapi.TYPE_STRING
    ),
]


def _pick_garant():
    """
    Ak existuje aspoň jeden garant, uprednostníme ne-defaultného.
    Inak použijeme defaultného garanta podľa ENV, ak existuje.
    """
    default_email = getattr(settings, "DEFAULT_GARANT_EMAIL", None)
    garants = User.objects.filter(rola="garant", aktivny=True)
    if not garants.exists():
        return None

    non_default = garants
    if default_email:
        non_default = garants.exclude(email__iexact=default_email)

    candidate = non_default.order_by("id").first()
    if candidate:
        return candidate
    return garants.order_by("id").first()


def init_csv_response(filename_prefix: str) -> HttpResponse:
    timestamp = timezone.now().strftime("%Y%m%d_%H%M%S")
    filename = f"{filename_prefix}_{timestamp}.csv"
    response = HttpResponse(content_type="text/csv")
    response["Content-Disposition"] = f'attachment; filename="{filename}"'
    return response
