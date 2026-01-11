"""Student-facing internship endpoints."""
from django.conf import settings
from django.core.cache import cache
from django.db import IntegrityError, transaction
from drf_yasg import openapi
from drf_yasg.utils import swagger_auto_schema
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.cache_utils import build_cache_key
from apps.companies.models import Firma
from apps.documents.models import Dokument
from apps.documents.serializers import DocumentSerializer
from apps.users.models import User
from .garant import _pick_garant
from ..models import HistoriaStavovPraxe, Prax
from ..serializers import InternshipSerializer, StudentCreateInternshipSerializer


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

    if user.rola != User.ROLE_STUDENT:
        return Response(
            {"error": "Len študent môže pristupovať k tomuto endpointu."},
            status=status.HTTP_403_FORBIDDEN,
        )

    cache_key = build_cache_key("praxe:list:student", request.query_params, user=user)
    cached = cache.get(cache_key)
    if cached is not None:
        return Response(cached)

    praxe = Prax.objects.filter(student=user).select_related("firma", "garant").order_by("-vytvorene_at")

    if not praxe.exists():
        payload = {"message": "Študent zatiaľ nemá žiadne praxe."}
        cache.set(cache_key, payload, getattr(settings, "CACHE_TTL_LIST", 120))
        return Response(payload, status=200)

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
        "internships": result,
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
    user = request.user

    if user.rola != User.ROLE_STUDENT:
        return Response({"error": "Len študent môže vytvoriť prax."}, status=status.HTTP_403_FORBIDDEN)

    serializer = StudentCreateInternshipSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    firma_id = serializer.validated_data["firma_id"]
    rok = serializer.validated_data["rok"]
    semester = serializer.validated_data["semester"]
    datum_zaciatku = serializer.validated_data["datum_zaciatku"]
    datum_konca = serializer.validated_data["datum_konca"]
    forma = serializer.validated_data.get("forma", Prax.FORMA_DOHODA)

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
            forma=forma,
            stav=Prax.STAV_VYTVORENA,
        )

        HistoriaStavovPraxe.objects.create(
            prax_id=prax.id,
            stary_stav=None,
            novy_stav=Prax.STAV_VYTVORENA,
            zmenil_id=user.id,
            poznamka="Prax bola vytvorená študentom.",
        )

        if forma == Prax.FORMA_ZAMESTNANIE:
            Dokument.objects.get_or_create(
                prax=prax,
                typ_dokumentu=Dokument.TYP_ZAMESTNANIE,
                defaults={
                    "nahrane_pouzivatel": user,
                    "subor_url": "",
                    "stav_dokumentu": Dokument.STAV_NAHRANY,
                },
            )
            try:
                for _ in range(3):
                    Dokument.objects.create(
                        prax=prax,
                        typ_dokumentu=Dokument.TYP_FAKTURA,
                        nahrane_pouzivatel=user,
                        subor_url="",
                        stav_dokumentu=Dokument.STAV_NAHRANY,
                    )
            except IntegrityError:
                Dokument.objects.get_or_create(
                    prax=prax,
                    typ_dokumentu=Dokument.TYP_FAKTURA,
                    defaults={
                        "nahrane_pouzivatel": user,
                        "subor_url": "",
                        "stav_dokumentu": Dokument.STAV_NAHRANY,
                    },
                )
        else:
            document, _ = Dokument.objects.get_or_create(
                prax=prax,
                typ_dokumentu=Dokument.TYP_DOHODA,
                defaults={
                    "nahrane_pouzivatel": user,
                    "subor_url": "",
                },
            )

            # Použijeme generate_dohoda_pdf z balíka views, aby ho vedeli patchnúť testy
            from apps.internships import views as internships_views

            pdf_buffer, relative_path = internships_views.generate_dohoda_pdf(prax)
            document.subor_url = relative_path
            document.stav_dokumentu = Dokument.STAV_POTVRDENY
            document.save(update_fields=["subor_url", "stav_dokumentu"])

            Dokument.objects.get_or_create(
                prax=prax,
                typ_dokumentu=Dokument.TYP_ZMLUVA,
                defaults={
                    "nahrane_pouzivatel": user,
                    "subor_url": "",
                    "stav_dokumentu": Dokument.STAV_NAHRANY,
                },
            )
        Dokument.objects.get_or_create(
            prax=prax,
            typ_dokumentu=Dokument.TYP_VYKAZ,
            defaults={
                "nahrane_pouzivatel": user,
                "subor_url": "",
                "stav_dokumentu": Dokument.STAV_NAHRANY,
            },
        )

    return Response(InternshipSerializer(prax).data, status=status.HTTP_201_CREATED)
