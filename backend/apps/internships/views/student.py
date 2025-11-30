from django.db import transaction
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from drf_yasg import openapi
from drf_yasg.utils import swagger_auto_schema

from apps.documents.models import Dokument
from apps.documents.serializers import DocumentSerializer
from ..models import HistoriaStavovPraxe, Prax
from ..serializers import InternshipSerializer, StudentCreateInternshipSerializer
from apps.companies.models import Firma
from .garant import _pick_garant


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
    """🧑‍🎓 Vráti všetky praxe prihláseného študenta s detailnými informáciami a stránkovaním."""
    user = request.user

    if user.rola != "student":
        return Response(
            {"error": "Len študent môže pristupovať k tomuto endpointu."},
            status=status.HTTP_403_FORBIDDEN,
        )

    praxe = Prax.objects.filter(student=user).select_related("firma", "garant").order_by("-vytvorene_at")

    if not praxe.exists():
        return Response({"message": "Študent zatiaľ nemá žiadne praxe."}, status=200)

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

    result = []
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

        result.append(
            {
                "id": p.id,
                "rok": p.rok,
                "semester": p.semester,
                "datum_zaciatku": p.datum_zaciatku,
                "datum_konca": p.datum_konca,
                "stav": p.stav,
                "firma": firma_data,
                "garant": garant_data,
                "historia": list(historia),
                "documents": DocumentSerializer(Dokument.objects.filter(prax=p), many=True).data,
            }
        )

    response_data = {
        "student": student_data,
        "internships": result,
    }

    return paginator.get_paginated_response(response_data)


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
        },
        required=["firma_id", "rok", "semester", "datum_zaciatku", "datum_konca"],
    ),
    responses={201: "Prax vytvorená", 403: "Len študent môže vytvárať prax"},
)
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def create_internship(request):
    user = request.user

    if user.rola != "student":
        return Response({"error": "Len študent môže vytvoriť prax."}, status=status.HTTP_403_FORBIDDEN)

    serializer = StudentCreateInternshipSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    firma_id = serializer.validated_data["firma_id"]
    rok = serializer.validated_data["rok"]
    semester = serializer.validated_data["semester"]
    datum_zaciatku = serializer.validated_data["datum_zaciatku"]
    datum_konca = serializer.validated_data["datum_konca"]

    firma = Firma.objects.get(id=firma_id)

    with transaction.atomic():
        garant = _pick_garant()

        prax = Prax.objects.create(
            student_id=user.id,
            firma_id=firma.id,
            garant=garant,
            rok=rok,
            semester=semester,
            datum_zaciatku=datum_zaciatku,
            datum_konca=datum_konca,
            stav="vytvorena",
        )

        HistoriaStavovPraxe.objects.create(
            prax_id=prax.id,
            stary_stav=None,
            novy_stav="vytvorena",
            zmenil_id=user.id,
            poznamka="Prax bola vytvorená študentom.",
        )

        document, _ = Dokument.objects.get_or_create(
            prax=prax,
            typ_dokumentu="dohoda",
            defaults={
                "nahrane_pouzivatel": user,
                "subor_url": "",
            },
        )

        # Použijeme generate_dohoda_pdf z balíka views, aby ho vedeli patchnúť testy
        from apps.internships import views as internships_views

        pdf_buffer, relative_path = internships_views.generate_dohoda_pdf(prax)
        document.subor_url = relative_path
        document.stav_dokumentu = "potvrdeny"
        document.save(update_fields=["subor_url", "stav_dokumentu"])

        Dokument.objects.get_or_create(
            prax=prax,
            typ_dokumentu="zmluva",
            defaults={
                "nahrane_pouzivatel": user,
                "subor_url": "",
                "stav_dokumentu": "nahrany",
            },
        )
        Dokument.objects.get_or_create(
            prax=prax,
            typ_dokumentu="vykaz",
            defaults={
                "nahrane_pouzivatel": user,
                "subor_url": "",
                "stav_dokumentu": "nahrany",
            },
        )

    return Response(InternshipSerializer(prax).data, status=status.HTTP_201_CREATED)
