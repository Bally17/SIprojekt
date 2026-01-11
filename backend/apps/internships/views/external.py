"""External system endpoints for internship status updates and listing."""
from django.conf import settings
from django.core.cache import cache
from drf_yasg import openapi
from drf_yasg.utils import swagger_auto_schema
from rest_framework.decorators import api_view, permission_classes
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from common.cache import build_cache_key
from apps.internships.serializers import ExternalDefenseSerializer, InternshipSerializer
from services.internships.access import get_external_internships
from services.internships.workflow import external_mark_defended as external_mark_defended_service


@swagger_auto_schema(
    method="post",
    operation_summary="Externý systém označí prax ako obhájenú",
    operation_description="""
    Endpoint pre integračných partnerov ktorý umožní zmenu stavu praxe zo `schvalena` na `obhajena`.
    Je dostupný len pre používateľov s rolou **externy** (resp. garant) a vyžaduje platný OAuth2/JWT token.
    """,
    request_body=ExternalDefenseSerializer,
    responses={
        200: openapi.Response("Aktualizovaná prax", InternshipSerializer),
        400: "Prax nie je v stave 'schvalena'",
        404: "Prax neexistuje",
        403: "Zakázané",
    },
)
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def external_mark_defended(request):
    """Mark an internship as defended for external integrations."""
    serializer = ExternalDefenseSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    result = external_mark_defended_service(request.user, serializer.validated_data)
    if not result["ok"]:
        return Response(result["data"], status=result["status"])

    return Response(InternshipSerializer(result["prax"]).data, status=result["status"])


@swagger_auto_schema(
    method="get",
    operation_summary="Externý systém: prehľad praxí",
    operation_description="Read-only prehľad praxí dostupný pre rolu externy/garant. Možno filtrovať podľa stavu, roku, semestra a fulltextu vo firme/študentovi.",
    manual_parameters=[
        openapi.Parameter("stav", openapi.IN_QUERY, description="Filter podľa stavu praxe", type=openapi.TYPE_STRING),
        openapi.Parameter("rok", openapi.IN_QUERY, description="Filter podľa roka", type=openapi.TYPE_INTEGER),
        openapi.Parameter(
            "semester", openapi.IN_QUERY, description="Filter podľa semestra (zimny/letny)", type=openapi.TYPE_STRING
        ),
        openapi.Parameter(
            "search", openapi.IN_QUERY, description="Fulltext v študentovi alebo firme", type=openapi.TYPE_STRING
        ),
    ],
    responses={200: openapi.Response("Zoznam praxí", InternshipSerializer(many=True)), 403: "Zakázané"},
)
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def external_list_internships(request):
    """List internships for external integrators or garants."""
    result = get_external_internships(request.user, request.query_params)
    if not result["ok"]:
        return Response(result["data"], status=result["status"])

    cache_key = build_cache_key("praxe:list:external", request.query_params, user=request.user)
    cached = cache.get(cache_key)
    if cached is not None:
        return Response(cached)

    qs = result["queryset"]
    paginator = PageNumberPagination()
    paginator.page_size = getattr(settings, "REST_FRAMEWORK", {}).get("PAGE_SIZE", 20)
    page = paginator.paginate_queryset(qs, request)
    serializer = InternshipSerializer(page, many=True)
    response = paginator.get_paginated_response(serializer.data)
    cache.set(cache_key, response.data, getattr(settings, "CACHE_TTL_LIST", 120))
    return response


__all__ = ["external_mark_defended", "external_list_internships"]
