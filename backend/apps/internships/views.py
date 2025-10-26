from rest_framework import viewsets, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi
 # ak existuje

from apps.internships.models import HistoriaStavovPraxe  # pridaj model histórie
from apps.companies.models import Firma
from apps.documents.models import Dokument
from apps.documents.utils.pdf_generator import generate_dohoda_pdf
from apps.documents.serializers import DocumentSerializer
from django.db import transaction

from .models import Prax, HistoriaStavovPraxe
from .serializers import InternshipSerializer, InternshipHistorySerializer
from apps.users.serializers import UserSerializer, StudentProfileSerializer


# 🔹 CRUD pre praxe
class InternshipViewSet(viewsets.ModelViewSet):
    queryset = Prax.objects.all()
    serializer_class = InternshipSerializer


# 🔹 CRUD pre históriu praxí
class InternshipHistoryViewSet(viewsets.ModelViewSet):
    queryset = HistoriaStavovPraxe.objects.all()
    serializer_class = InternshipHistorySerializer


# 🔹 Študent získa prehľad o svojich praxiach
@swagger_auto_schema(
    method='get',
    operation_summary="Zoznam praxí prihláseného študenta",
    operation_description="""
    Tento endpoint vráti všetky praxe, ktoré patria **aktuálne prihlásenému študentovi**.
    \n    Podporuje:
    - 🔍 Filtrovanie podľa `rok`, `semester`, `stav`
    - 📄 Stránkovanie (10 záznamov na stránku)
    - ↕️ Triedenie pomocou parametra `ordering`
    """,
    manual_parameters=[
        openapi.Parameter('rok', openapi.IN_QUERY, description="Filter podľa roku (napr. 2025)", type=openapi.TYPE_INTEGER),
        openapi.Parameter('semester', openapi.IN_QUERY, description="Filter podľa semestra (zimny/letny)", type=openapi.TYPE_STRING),
        openapi.Parameter('stav', openapi.IN_QUERY, description="Filter podľa stavu praxe (napr. schvalena, vytvorena)", type=openapi.TYPE_STRING),
        openapi.Parameter('ordering', openapi.IN_QUERY, description="Triedenie podľa poľa (napr. -rok, stav, datum_zaciatku)", type=openapi.TYPE_STRING),
    ],
    responses={200: "Zoznam praxí prihláseného študenta"}
)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def me_internships(request):
    """
    🧑‍🎓 Vráti všetky praxe prihláseného študenta s detailnými informáciami a stránkovaním.
    """
    user = request.user

    if user.rola != "student":
        return Response({"error": "Len študent môže pristupovať k tomuto endpointu."},
                        status=status.HTTP_403_FORBIDDEN)

    # Základný queryset
    praxe = Prax.objects.filter(student=user).select_related("firma", "garant").order_by("-vytvorene_at")

    if not praxe.exists():
        return Response({"message": "Študent zatiaľ nemá žiadne praxe."}, status=200)

    # 🧩 Stránkovanie
    paginator = PageNumberPagination()
    paginator.page_size = 10
    result_page = paginator.paginate_queryset(praxe, request)

    # Informácie o študentovi
    student_data = {
        "id": user.id,
        "meno": user.meno,
        "priezvisko": user.priezvisko,
        "email": user.email,
        "studijny_program": getattr(user.studentprofil, "studijny_program", None),
    }

    # Zoznam praxí (detailne)
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

        result.append({
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
        })

    # 🧾 Výsledok s meta údajmi o stránkovaní
    response_data = {
        "student": student_data,
        "internships": result,
    }

    return paginator.get_paginated_response(response_data)


# 🔹 Firma získa prehľad o svojich praxiach
@swagger_auto_schema(
    method='get',
    operation_summary="Zoznam praxí prihlásenej firmy",
    operation_description="Vracia všetky praxe patriace firme podľa `request.user.firma_id`.",
    manual_parameters=[
        openapi.Parameter('rok', openapi.IN_QUERY, description="Filter podľa roku", type=openapi.TYPE_INTEGER),
        openapi.Parameter('stav', openapi.IN_QUERY, description="Filter podľa stavu", type=openapi.TYPE_STRING),
        openapi.Parameter('semester', openapi.IN_QUERY, description="Filter podľa semestra", type=openapi.TYPE_STRING),
    ],
    responses={200: "Zoznam praxí firmy"}
)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def company_my_internships(request):
    """🔹 Firma získa prehľad o všetkých svojich praxiach."""
    user = request.user

    if user.rola != "firma":
        return Response({"error": "Prístup povolený len pre firemných používateľov."}, status=status.HTTP_403_FORBIDDEN)

    if not user.firma_id:
        return Response({"error": "Firma nemá priradené ID (firma_id)."}, status=status.HTTP_400_BAD_REQUEST)

    internships = Prax.objects.filter(firma_id=user.firma_id).select_related('student', 'garant')

    # Voliteľné filtre
    rok = request.query_params.get('rok')
    stav = request.query_params.get('stav')
    semester = request.query_params.get('semester')

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

    return paginator.get_paginated_response(data)


# 🔹 Firma získa praxe, ktoré čakajú na potvrdenie
@swagger_auto_schema(
    method='get',
    operation_summary="Zoznam praxí čakajúcich na potvrdenie",
    operation_description="Vracia všetky praxe firmy, ktoré majú stav = 'vytvorena'.",
    responses={200: "Zoznam čakajúcich praxí"}
)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def company_pending_internships(request):
    """🔹 Firma získa praxe, ktoré čakajú na potvrdenie (stav = 'vytvorena')."""
    user = request.user

    if user.rola != "firma":
        return Response({"error": "Prístup povolený len pre firemných používateľov."}, status=status.HTTP_403_FORBIDDEN)

    if not user.firma_id:
        return Response({"error": "Firma nemá priradené ID (firma_id)."}, status=status.HTTP_400_BAD_REQUEST)

    internships = Prax.objects.filter(firma_id=user.firma_id, stav__iexact="vytvorena").select_related('student', 'garant')

    paginator = PageNumberPagination()
    paginator.page_size = 10
    result_page = paginator.paginate_queryset(internships, request)

    data = {
        "firma": UserSerializer(user).data,
        "internships": InternshipSerializer(result_page, many=True).data,
    }

    return paginator.get_paginated_response(data)


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

    # ✅ Povolené len pre študentov
    if user.rola != "student":
        return Response({"error": "Len študent môže vytvoriť prax."}, status=status.HTTP_403_FORBIDDEN)

    firma_id = request.data.get("firma_id")
    rok = request.data.get("rok")
    semester = request.data.get("semester")
    datum_zaciatku = request.data.get("datum_zaciatku")
    datum_konca = request.data.get("datum_konca")

    # ✅ Validácia vstupov
    if not all([firma_id, rok, semester, datum_zaciatku, datum_konca]):
        return Response({"error": "Všetky polia sú povinné."}, status=status.HTTP_400_BAD_REQUEST)

    try:
        firma = Firma.objects.get(id=firma_id)
    except Firma.DoesNotExist:
        return Response({"error": "Firma so zadaným ID neexistuje."}, status=status.HTTP_404_NOT_FOUND)

    # 🔒 Transakcia: prax + história
    with transaction.atomic():
        # 🧱 Vytvor novú prax
        prax = Prax.objects.create(
            student_id=user.id,
            firma_id=firma.id,
            rok=rok,
            semester=semester,
            datum_zaciatku=datum_zaciatku,
            datum_konca=datum_konca,
            stav="vytvorena",
        )

        # Zapíš históriu
        HistoriaStavovPraxe.objects.create(
            prax_id=prax.id,
            stary_stav=None,
            novy_stav="vytvorena",
            zmenil_id=user.id,
            poznamka="Prax bola vytvorená študentom.",
        )

        # Auto-generovanie dohody
        document, _ = Dokument.objects.get_or_create(
            prax=prax,
            typ_dokumentu="dohoda",
            defaults={
                "nahrane_pouzivatel": user,
                "subor_url": "",
            },
        )

        pdf_buffer, relative_path = generate_dohoda_pdf(prax)
        document.subor_url = relative_path
        document.stav_dokumentu = "potvrdeny"
        document.save(update_fields=["subor_url", "stav_dokumentu"])

    return Response(InternshipSerializer(prax).data, status=status.HTTP_201_CREATED)

@api_view(["PATCH"])
@permission_classes([IsAuthenticated])
def company_confirm_internship(request, prax_id):
    """✅ Firma potvrdí prax (stav -> potvrdena)."""
    from apps.notifications.models import Notifikacie 
    user = request.user

    if user.rola != "firma":
        return Response({"error": "Len firma môže potvrdiť prax."}, status=status.HTTP_403_FORBIDDEN)

    try:
        prax = Prax.objects.get(id=prax_id, firma_id=user.id)
    except Prax.DoesNotExist:
        return Response({"error": "Prax neexistuje alebo nepatrí tejto firme."}, status=status.HTTP_404_NOT_FOUND)

    if prax.stav.lower() != "vytvorena":
        return Response({"error": "Prax už nie je v stave 'vytvorena'."}, status=status.HTTP_400_BAD_REQUEST)

    with transaction.atomic():
        prax.stav = "potvrdena"
        prax.save()

        HistoriaStavovPraxe.objects.create(
            prax=prax,
            stary_stav="vytvorena",
            novy_stav="potvrdena",
            zmenil_id=user.id,
            poznamka="Prax bola potvrdená firmou."
        )

        # 🔔 voliteľne: vytvoriť notifikáciu pre študenta
        # Notifikacia.objects.create(
        #     prijemca_id=prax.student_id,
        #     typ="info",
        #     sprava=f"Vaša prax vo firme {user.meno} bola potvrdená."
        # )

    return Response(InternshipSerializer(prax).data, status=status.HTTP_200_OK)



@api_view(["PATCH"])
@permission_classes([IsAuthenticated])
def company_reject_internship(request, prax_id):
    """❌ Firma zamietne prax (stav -> zamietnuta)."""
    from apps.notifications.models import Notifikacie 
    user = request.user

    if user.rola != "firma":
        return Response({"error": "Len firma môže zamietnuť prax."}, status=status.HTTP_403_FORBIDDEN)

    try:
        prax = Prax.objects.get(id=prax_id, firma_id=user.id)
    except Prax.DoesNotExist:
        return Response({"error": "Prax neexistuje alebo nepatrí tejto firme."}, status=status.HTTP_404_NOT_FOUND)

    if prax.stav.lower() != "vytvorena":
        return Response({"error": "Prax už nie je v stave 'vytvorena'."}, status=status.HTTP_400_BAD_REQUEST)

    with transaction.atomic():
        prax.stav = "zamietnuta"
        prax.save()

        HistoriaStavovPraxe.objects.create(
            prax=prax,
            stary_stav="vytvorena",
            novy_stav="zamietnuta",
            zmenil_id=user.id,
            poznamka="Prax bola zamietnutá firmou."
        )

        # 🔔 voliteľne: notifikácia študentovi
        # Notifikacia.objects.create(
        #     prijemca_id=prax.student_id,
        #     typ="warning",
        #     sprava=f"Vaša prax vo firme {user.meno} bola zamietnutá."
        # )

    return Response(InternshipSerializer(prax).data, status=status.HTTP_200_OK)
