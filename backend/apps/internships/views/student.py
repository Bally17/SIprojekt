"""Student-facing internship endpoints."""
from django.conf import settings
from django.core.cache import cache
from drf_yasg import openapi
from drf_yasg.utils import swagger_auto_schema
from rest_framework.decorators import api_view, permission_classes
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from common.cache import build_cache_key
from apps.documents.models import Dokument
from apps.documents.serializers import DocumentSerializer
from apps.internships.models import HistoriaStavovPraxe, Prax
from apps.internships.serializers import InternshipSerializer, StudentCreateInternshipSerializer
from services.internships.access import get_student_internships
from services.internships.workflow import create_internship as create_internship_service


@swagger_auto_schema(
    method="get",
    operation_summary="Zoznam praxí prihláseného študenta",
    operation_description="""
    Tento endpoint vráti všetky praxe, ktoré patria **aktuálne prihlásenému študentovi**.
    Podporuje:
    - 🔍 Filtrovanie podľa `rok`, `semester`, `stav`
    - 📄 Stránkovanie (10 záznamov na stránku)
    - ↕️ Triedenie pomocou parametra `ordering`
    """,
    manual_parameters=[
        openapi.Parameter("rok", openapi.IN_QUERY, description="Filter podľa roku (napr. 2025)", type=openapi.TYPE_INTEGER),
        openapi.Parameter(
            "semester",
            openapi.IN_QUERY,
            description="Filter podľa semestra (zimny/letny)",
            type=openapi.TYPE_STRING,
        ),
        openapi.Parameter(
            "stav",
            openapi.IN_QUERY,
            description="Filter podľa stavu praxe (napr. schvalena, vytvorena)",
            type=openapi.TYPE_STRING,
        ),
        openapi.Parameter(
            "ordering",
            openapi.IN_QUERY,
            description="Triedenie podľa poľa (napr. -rok, stav, datum_zaciatku)",
            type=openapi.TYPE_STRING,
        ),
    ],
    responses={200: "Zoznam praxí prihláseného študenta"},
)
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def me_internships(request):
    """Return internships for the authenticated student with pagination."""
    user = request.user

    result = get_student_internships(user)
    if not result["ok"]:
        return Response(result["data"], status=result["status"])

    cache_key = build_cache_key("praxe:list:student", request.query_params, user=user)
    cached = cache.get(cache_key)
    if cached is not None:
        return Response(cached)

    if result.get("empty"):
        cache.set(cache_key, result["data"], getattr(settings, "CACHE_TTL_LIST", 120))
        return Response(result["data"], status=result["status"])

    praxe = result["queryset"]
    paginator = PageNumberPagination()
    paginator.page_size = 10
    result_page = paginator.paginate_queryset(praxe, request)

    student_data = {
        "id": user.id,
        "meno": user.meno,
        "priezvisko": user.priezvisko,
        "email": user.email,
        "studijny_program": getattr(user.studentprofil, "studijny_program", None),
    }

    payload = []
    for p in result_page:
        historia = HistoriaStavovPraxe.objects.filter(prax=p).order_by("zmena_at").values(
            "stary_stav", "novy_stav", "poznamka", "zmena_at"
        )

        firma_data = None
        if p.firma:
            firma_data = {
                "id": p.firma.id,
                "nazov": p.firma.nazov,
                "adresa": p.firma.adresa,
                "kontakt_meno": p.firma.kontakt_meno,
                "kontakt_email": p.firma.kontakt_email,
                "kontakt_telefon": p.firma.kontakt_telefon,
            }

        garant_data = None
        if p.garant:
            garant_data = {
                "id": p.garant.id,
                "meno": p.garant.meno,
                "priezvisko": p.garant.priezvisko,
                "email": p.garant.email,
            }

        payload.append(
            {
                "id": p.id,
                "rok": p.rok,
                "semester": p.semester,
                "datum_zaciatku": p.datum_zaciatku,
                "datum_konca": p.datum_konca,
                "forma": getattr(p, "forma", None),
                "stav": p.stav,
                "firma": firma_data,
                "garant": garant_data,
                "historia": list(historia),
                "documents": DocumentSerializer(Dokument.objects.filter(prax=p), many=True).data,
            }
        )

    response_data = {
        "student": student_data,
        "internships": payload,
    }

    response = paginator.get_paginated_response(response_data)
    cache.set(cache_key, response.data, getattr(settings, "CACHE_TTL_LIST", 120))
    return response


@swagger_auto_schema(
    method="post",
    operation_summary="🎓 Študent vytvorí novú prax (s históriou)",
    operation_description="""
    Tento endpoint umožňuje študentovi vytvoriť **novú prax** vo vybratej firme.  
    Automaticky nastaví `stav = vytvorena` a zapíše záznam do `historia_stavov_praxe`.
    """,
    request_body=openapi.Schema(
        type=openapi.TYPE_OBJECT,
        properties={
            "firma_id": openapi.Schema(type=openapi.TYPE_INTEGER, description="ID firmy"),
            "rok": openapi.Schema(type=openapi.TYPE_INTEGER, description="Rok praxe"),
            "semester": openapi.Schema(type=openapi.TYPE_STRING, description="Zimný alebo letný"),
            "datum_zaciatku": openapi.Schema(type=openapi.TYPE_STRING, format="date"),
            "datum_konca": openapi.Schema(type=openapi.TYPE_STRING, format="date"),
            "forma": openapi.Schema(
                type=openapi.TYPE_STRING,
                description="Forma praxe (dohoda alebo zamestnanie)",
                enum=[Prax.FORMA_DOHODA, Prax.FORMA_ZAMESTNANIE],
            ),
        },
        required=["firma_id", "rok", "semester", "datum_zaciatku", "datum_konca"],
    ),
    responses={201: "Prax vytvorená", 403: "Len študent môže vytvárať prax"},
)
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def create_internship(request):
    """Create a new internship for the authenticated student."""
    serializer = StudentCreateInternshipSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    result = create_internship_service(request.user, serializer.validated_data)
    if not result["ok"]:
        return Response(result["data"], status=result["status"])

    return Response(InternshipSerializer(result["prax"]).data, status=result["status"])


__all__ = ["me_internships", "create_internship"]
