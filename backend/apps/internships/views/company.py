"""Company-facing internship endpoints."""
from django.conf import settings
from django.core.cache import cache
from drf_yasg import openapi
from drf_yasg.utils import swagger_auto_schema
from rest_framework.decorators import api_view, permission_classes
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from common.cache import build_cache_key
from apps.internships.serializers import InternshipSerializer
from apps.users.serializers import UserSerializer
from services.internships.access import get_company_internships
from services.internships.workflow import (
    company_confirm_internship as company_confirm_internship_service,
    company_reject_internship as company_reject_internship_service,
)


@swagger_auto_schema(
    method="get",
    operation_summary="Zoznam praxí prihlásenej firmy",
    operation_description="Vracia všetky praxe patriace firme podľa `request.user.firma_id`.",
    manual_parameters=[
        openapi.Parameter("rok", openapi.IN_QUERY, description="Filter podľa roku", type=openapi.TYPE_INTEGER),
        openapi.Parameter("stav", openapi.IN_QUERY, description="Filter podľa stavu", type=openapi.TYPE_STRING),
        openapi.Parameter("semester", openapi.IN_QUERY, description="Filter podľa semestra", type=openapi.TYPE_STRING),
    ],
    responses={200: "Zoznam praxí firmy"},
)
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def company_my_internships(request):
    """Return all internships for the authenticated company."""
    user = request.user
    result = get_company_internships(user, request.query_params, pending=False)
    if not result["ok"]:
        return Response(result["data"], status=result["status"])

    cache_key = build_cache_key("praxe:list:company", request.query_params, user=user)
    cached = cache.get(cache_key)
    if cached is not None:
        return Response(cached)

    internships = result["queryset"]
    paginator = PageNumberPagination()
    paginator.page_size = 10
    result_page = paginator.paginate_queryset(internships, request)

    data = {
        "firma": UserSerializer(user).data,
        "internships": InternshipSerializer(result_page, many=True).data,
    }

    response = paginator.get_paginated_response(data)
    cache.set(cache_key, response.data, getattr(settings, "CACHE_TTL_LIST", 120))
    return response


@swagger_auto_schema(
    method="get",
    operation_summary="Zoznam praxí čakajúcich na potvrdenie",
    operation_description="Vracia všetky praxe firmy, ktoré majú stav = 'vytvorena'.",
    responses={200: "Zoznam čakajúcich praxí"},
)
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def company_pending_internships(request):
    """Return company internships pending confirmation."""
    user = request.user
    result = get_company_internships(user, request.query_params, pending=True)
    if not result["ok"]:
        return Response(result["data"], status=result["status"])

    cache_key = build_cache_key("praxe:list:company:pending", request.query_params, user=user)
    cached = cache.get(cache_key)
    if cached is not None:
        return Response(cached)

    internships = result["queryset"]
    paginator = PageNumberPagination()
    paginator.page_size = 10
    result_page = paginator.paginate_queryset(internships, request)

    data = {
        "firma": UserSerializer(user).data,
        "internships": InternshipSerializer(result_page, many=True).data,
    }

    response = paginator.get_paginated_response(data)
    cache.set(cache_key, response.data, getattr(settings, "CACHE_TTL_LIST", 120))
    return response


@swagger_auto_schema(
    method="patch",
    operation_summary="Firma potvrdí prax",
    operation_description="Zmení stav praxe na `potvrdena` a pridá záznam do histórie.",
    responses={
        200: openapi.Response("Aktualizovaná prax", InternshipSerializer),
        400: "Prax nie je v stave 'vytvorena'",
        403: "Len firma môže potvrdiť prax",
        404: "Prax neexistuje alebo nepatrí firme",
    },
)
@api_view(["PATCH"])
@permission_classes([IsAuthenticated])
def company_confirm_internship(request, prax_id):
    """Confirm an internship as a company (status to potvrdena)."""
    result = company_confirm_internship_service(request.user, prax_id)
    if not result["ok"]:
        return Response(result["data"], status=result["status"])

    return Response(InternshipSerializer(result["prax"]).data, status=result["status"])


@swagger_auto_schema(
    method="patch",
    operation_summary="Firma zamietne prax",
    operation_description="Zmení stav praxe na `zamietnuta` a pridá záznam do histórie.",
    responses={
        200: openapi.Response("Aktualizovaná prax", InternshipSerializer),
        400: "Prax nie je v stave 'vytvorena'",
        403: "Len firma môže zamietnuť prax",
        404: "Prax neexistuje alebo nepatrí firme",
    },
)
@api_view(["PATCH"])
@permission_classes([IsAuthenticated])
def company_reject_internship(request, prax_id):
    """Reject an internship as a company (status to zamietnuta)."""
    result = company_reject_internship_service(request.user, prax_id)
    if not result["ok"]:
        return Response(result["data"], status=result["status"])

    return Response(InternshipSerializer(result["prax"]).data, status=result["status"])


__all__ = [
    "company_my_internships",
    "company_pending_internships",
    "company_confirm_internship",
    "company_reject_internship",
]
