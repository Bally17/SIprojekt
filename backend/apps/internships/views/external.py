"""External system endpoints for internship status updates and listing."""
from django.conf import settings
from django.core.cache import cache
from django.db import transaction
from django.db.models import Q
from drf_yasg import openapi
from drf_yasg.utils import swagger_auto_schema
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.cache_utils import build_cache_key
from apps.users.models import User
from ..models import Prax
from ..serializers import ExternalDefenseSerializer, InternshipSerializer


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
    user = request.user

    if user.rola not in (User.ROLE_EXTERNY, User.ROLE_GARANT):
        return Response(
            {"error": "Prístup povolený len pre externých integrátorov."},
            status=status.HTTP_403_FORBIDDEN,
        )

    serializer = ExternalDefenseSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    prax_id = serializer.validated_data["prax_id"]
    reference = serializer.validated_data.get("external_reference")
    note = serializer.validated_data.get("note")

    try:
        with transaction.atomic():
            prax = Prax.objects.select_for_update().get(id=prax_id)

            if (prax.stav or "").lower() != Prax.STAV_SCHVALENA:
                return Response(
                    {"error": "Prax je možné obhájiť len zo stavu 'schvalena'."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            custom_note = note or "Externý systém označil prax ako obhájenú."
            if reference:
                custom_note = f"{custom_note} Referencia: {reference}"

            prax._changed_by = user
            prax._status_change_note = custom_note
            prax.stav = Prax.STAV_OBHAJENA
            prax.save()

    except Prax.DoesNotExist:
        return Response({"error": "Prax so zadaným ID neexistuje."}, status=status.HTTP_404_NOT_FOUND)

    return Response(InternshipSerializer(prax).data, status=status.HTTP_200_OK)


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
    user = request.user
    if user.rola not in (User.ROLE_EXTERNY, User.ROLE_GARANT):
        return Response({"error": "Prístup povolený len pre externých integrátorov."}, status=status.HTTP_403_FORBIDDEN)

    cache_key = build_cache_key("praxe:list:external", request.query_params, user=user)
    cached = cache.get(cache_key)
    if cached is not None:
        return Response(cached)

    qs = (
        Prax.objects.select_related("student", "student__studentprofil", "firma", "garant")
        .all()
        .order_by("-vytvorene_at")
    )

    stav = request.query_params.get("stav")
    # Zakladna validacia filtrov z query parametrov
    allowed_stav = {choice[0] for choice in Prax.STAV_CHOICES}
    allowed_semester = {choice[0] for choice in Prax.SEMESTER_CHOICES}
    if stav:
        stav_value = str(stav).lower()
        if stav_value not in allowed_stav:
            return Response({"error": "Neplatný stav."}, status=status.HTTP_400_BAD_REQUEST)
        qs = qs.filter(stav__iexact=stav_value)

    rok = request.query_params.get("rok")
    if rok:
        try:
            qs = qs.filter(rok=int(rok))
        except (TypeError, ValueError):
            return Response({"error": "rok musí byť číslo"}, status=status.HTTP_400_BAD_REQUEST)

    semester = request.query_params.get("semester")
    if semester:
        semester_value = str(semester).lower()
        if semester_value not in allowed_semester:
            return Response({"error": "Neplatný semester."}, status=status.HTTP_400_BAD_REQUEST)
        qs = qs.filter(semester__iexact=semester_value)

    search = request.query_params.get("search")
    if search:
        qs = qs.filter(
            Q(firma__nazov__icontains=search)
            | Q(student__email__icontains=search)
            | Q(student__meno__icontains=search)
            | Q(student__priezvisko__icontains=search)
        )

    paginator = PageNumberPagination()
    paginator.page_size = getattr(settings, "REST_FRAMEWORK", {}).get("PAGE_SIZE", 20)
    page = paginator.paginate_queryset(qs, request)
    serializer = InternshipSerializer(page, many=True)
    response = paginator.get_paginated_response(serializer.data)
    cache.set(cache_key, response.data, getattr(settings, "CACHE_TTL_LIST", 120))
    return response
