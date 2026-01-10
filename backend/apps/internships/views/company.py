"""Company-facing internship endpoints."""
from django.conf import settings
from django.core.cache import cache
from django.db import transaction
from drf_yasg import openapi
from drf_yasg.utils import swagger_auto_schema
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.cache_utils import build_cache_key
from apps.users.serializers import UserSerializer
from apps.users.models import User

from ..models import HistoriaStavovPraxe, Prax
from ..serializers import InternshipSerializer


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

    if user.rola != User.ROLE_FIRMA:
        return Response({"error": "Prístup povolený len pre firemných používateľov."}, status=status.HTTP_403_FORBIDDEN)

    if not user.firma_id:
        return Response({"error": "Firma nemá priradené ID (firma_id)."}, status=status.HTTP_400_BAD_REQUEST)

    cache_key = build_cache_key("praxe:list:company", request.query_params, user=user)
    cached = cache.get(cache_key)
    if cached is not None:
        return Response(cached)

    internships = (
        Prax.objects.filter(firma_id=user.firma_id)
        .select_related("student", "garant")
        .order_by("-vytvorene_at")
    )

    rok = request.query_params.get("rok")
    stav = request.query_params.get("stav")
    semester = request.query_params.get("semester")

    if rok:
        internships = internships.filter(rok=rok)
    if stav:
        internships = internships.filter(stav__iexact=stav)
    if semester:
        internships = internships.filter(semester__iexact=semester)

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

    if user.rola != User.ROLE_FIRMA:
        return Response({"error": "Prístup povolený len pre firemných používateľov."}, status=status.HTTP_403_FORBIDDEN)

    if not user.firma_id:
        return Response({"error": "Firma nemá priradené ID (firma_id)."}, status=status.HTTP_400_BAD_REQUEST)

    cache_key = build_cache_key("praxe:list:company:pending", request.query_params, user=user)
    cached = cache.get(cache_key)
    if cached is not None:
        return Response(cached)

    internships = (
        Prax.objects.filter(firma_id=user.firma_id, stav__iexact=Prax.STAV_VYTVORENA)
        .select_related("student", "garant")
        .order_by("-vytvorene_at")
    )

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
    user = request.user

    if user.rola != User.ROLE_FIRMA:
        return Response({"error": "Len firma môže potvrdiť prax."}, status=status.HTTP_403_FORBIDDEN)

    if not user.firma_id:
        return Response({"error": "Firma nemá priradené ID (firma_id)."}, status=status.HTTP_400_BAD_REQUEST)

    try:
        prax = Prax.objects.get(id=prax_id, firma_id=user.firma_id)
    except Prax.DoesNotExist:
        return Response({"error": "Prax neexistuje alebo nepatrí tejto firme."}, status=status.HTTP_404_NOT_FOUND)

    if prax.stav.lower() != Prax.STAV_VYTVORENA:
        return Response({"error": "Prax už nie je v stave 'vytvorena'."}, status=status.HTTP_400_BAD_REQUEST)

    with transaction.atomic():
        prax.stav = Prax.STAV_POTVRDENA
        prax.save()

        HistoriaStavovPraxe.objects.create(
            prax=prax,
            stary_stav=Prax.STAV_VYTVORENA,
            novy_stav=Prax.STAV_POTVRDENA,
            zmenil_id=user.id,
            poznamka="Prax bola potvrdená firmou.",
        )

    return Response(InternshipSerializer(prax).data, status=status.HTTP_200_OK)


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
    user = request.user

    if user.rola != User.ROLE_FIRMA:
        return Response({"error": "Len firma môže zamietnuť prax."}, status=status.HTTP_403_FORBIDDEN)

    if not user.firma_id:
        return Response({"error": "Firma nemá priradené ID (firma_id)."}, status=status.HTTP_400_BAD_REQUEST)

    try:
        prax = Prax.objects.get(id=prax_id, firma_id=user.firma_id)
    except Prax.DoesNotExist:
        return Response({"error": "Prax neexistuje alebo nepatrí tejto firme."}, status=status.HTTP_404_NOT_FOUND)

    if prax.stav.lower() != Prax.STAV_VYTVORENA:
        return Response({"error": "Prax už nie je v stave 'vytvorena'."}, status=status.HTTP_400_BAD_REQUEST)

    with transaction.atomic():
        prax.stav = Prax.STAV_ZAMIETNUTA
        prax.save()

        HistoriaStavovPraxe.objects.create(
            prax=prax,
            stary_stav=Prax.STAV_VYTVORENA,
            novy_stav=Prax.STAV_ZAMIETNUTA,
            zmenil_id=user.id,
            poznamka="Prax bola zamietnutá firmou.",
        )

    return Response(InternshipSerializer(prax).data, status=status.HTTP_200_OK)
