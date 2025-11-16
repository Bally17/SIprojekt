import csv
from django.http import HttpResponse
from django.utils import timezone
from rest_framework import viewsets, status, mixins
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi
 # ak existuje

from apps.companies.models import Firma
from apps.documents.models import Dokument
from apps.documents.utils.pdf_generator import generate_dohoda_pdf
from apps.documents.serializers import DocumentSerializer
from django.db import transaction

from django.db.models import Q

from .models import Prax, HistoriaStavovPraxe
from .serializers import (
    InternshipSerializer,
    InternshipHistorySerializer,
    ExternalDefenseSerializer,
    GarantInternshipUpdateSerializer,
    StudentCreateInternshipSerializer,
)
from .permissions import IsGarantUser
from apps.users.serializers import UserSerializer, StudentProfileSerializer

GARANT_LIST_FILTERS = [
    openapi.Parameter('rok', openapi.IN_QUERY, description="Filtruj podľa roku", type=openapi.TYPE_INTEGER),
    openapi.Parameter('semester', openapi.IN_QUERY, description="Filtruj podľa semestra (zimny/letny)", type=openapi.TYPE_STRING),
    openapi.Parameter('stav', openapi.IN_QUERY, description="Filtruj podľa stavu praxe", type=openapi.TYPE_STRING),
    openapi.Parameter('student_id', openapi.IN_QUERY, description="ID študenta", type=openapi.TYPE_INTEGER),
    openapi.Parameter('firma_id', openapi.IN_QUERY, description="ID firmy", type=openapi.TYPE_INTEGER),
    openapi.Parameter('search', openapi.IN_QUERY, description="Fulltext v mene študenta alebo názve firmy", type=openapi.TYPE_STRING),
    openapi.Parameter('student', openapi.IN_QUERY, description="Textový filter mena alebo emailu študenta", type=openapi.TYPE_STRING),
    openapi.Parameter('firma', openapi.IN_QUERY, description="Textový filter názvu firmy", type=openapi.TYPE_STRING),
    openapi.Parameter('odbor', openapi.IN_QUERY, description="Filter podľa študijného programu", type=openapi.TYPE_STRING),
]

# 🔹 CRUD pre praxe
class InternshipViewSet(viewsets.ModelViewSet):
    queryset = (
        Prax.objects.select_related("student", "student__studentprofil", "firma", "garant")
        .all()
    )
    serializer_class = InternshipSerializer


# 🔹 CRUD pre históriu praxí
class InternshipHistoryViewSet(viewsets.ModelViewSet):
    queryset = HistoriaStavovPraxe.objects.all()
    serializer_class = InternshipHistorySerializer


class GarantInternshipViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.UpdateModelMixin,
    viewsets.GenericViewSet,
):
    queryset = (
        Prax.objects.select_related("student", "student__studentprofil", "firma", "garant")
        .all()
        .order_by("-vytvorene_at")
    )
    permission_classes = [IsAuthenticated, IsGarantUser]
    http_method_names = ["get", "patch", "put", "head", "options"]

    def get_serializer_class(self):
        if self.action in ("update", "partial_update"):
            return GarantInternshipUpdateSerializer
        return InternshipSerializer

    @swagger_auto_schema(
        operation_summary="Garant: Zoznam všetkých praxí",
        operation_description="Vráti stránkovaný zoznam praxí vrátane študenta, firmy a dokumentov.",
        manual_parameters=GARANT_LIST_FILTERS,
        responses={
            200: openapi.Response("Paginated internships", InternshipSerializer(many=True)),
            403: "Používateľ nemá rolu garant",
        },
    )
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)

    @swagger_auto_schema(
        operation_summary="Garant: Detail praxe",
        responses={
            200: openapi.Response("Detail praxe", InternshipSerializer),
            404: "Prax neexistuje",
        },
    )
    def retrieve(self, request, *args, **kwargs):
        return super().retrieve(request, *args, **kwargs)

    def get_queryset(self):
        queryset = super().get_queryset()
        params = self.request.query_params

        rok = params.get("rok")
        semester = params.get("semester")
        stav = params.get("stav")
        student_id = params.get("student_id")
        firma_id = params.get("firma_id")
        search = params.get("search")
        student_text = params.get("student")
        firma_text = params.get("firma")
        study_program = params.get("odbor") or params.get("study_program")

        if rok:
            queryset = queryset.filter(rok=rok)
        if semester:
            queryset = queryset.filter(semester__iexact=semester)
        if stav:
            queryset = queryset.filter(stav__iexact=stav)
        if student_id:
            queryset = queryset.filter(student_id=student_id)
        if firma_id:
            queryset = queryset.filter(firma_id=firma_id)
        if student_text:
            queryset = queryset.filter(
                Q(student__email__icontains=student_text)
                | Q(student__meno__icontains=student_text)
                | Q(student__priezvisko__icontains=student_text)
            )
        if firma_text:
            queryset = queryset.filter(firma__nazov__icontains=firma_text)
        if study_program:
            queryset = queryset.filter(
                student__studentprofil__studijny_program__icontains=study_program
            )
        if search:
            queryset = queryset.filter(
                Q(student__email__icontains=search)
                | Q(student__meno__icontains=search)
                | Q(student__priezvisko__icontains=search)
                | Q(firma__nazov__icontains=search)
            )

        return queryset

    @swagger_auto_schema(
        operation_summary="Garant: Aktualizácia praxe",
        request_body=GarantInternshipUpdateSerializer,
        responses={
            200: openapi.Response("Aktualizovaná prax", InternshipSerializer),
            400: "Neplatné údaje",
            404: "Prax neexistuje",
        },
    )
    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        updated_instance = serializer.save()
        read_serializer = InternshipSerializer(
            updated_instance, context=self.get_serializer_context()
        )
        return Response(read_serializer.data)

    @swagger_auto_schema(
        operation_summary="Garant: Čiastočná aktualizácia praxe",
        request_body=GarantInternshipUpdateSerializer,
        responses={
            200: openapi.Response("Aktualizovaná prax", InternshipSerializer),
            400: "Neplatné údaje",
            404: "Prax neexistuje",
        },
    )
    def partial_update(self, request, *args, **kwargs):
        kwargs["partial"] = True
        return self.update(request, *args, **kwargs)

    @swagger_auto_schema(
        method="get",
        operation_summary="Garant: Export praxí do CSV",
        operation_description=(
            "Stiahne CSV so všetkými praxami, ktoré spĺňajú zvolené filtre. "
            "Používa rovnaké parametre ako zoznam praxí."
        ),
        manual_parameters=GARANT_LIST_FILTERS,
        responses={
            200: "CSV súbor s praxami",
            403: "Používateľ nemá rolu garant",
        },
    )
    @action(detail=False, methods=["get"], url_path="export")
    def export(self, request, *args, **kwargs):
        queryset = self.get_queryset()

        timestamp = timezone.now().strftime("%Y%m%d_%H%M%S")
        filename = f"internships_export_{timestamp}.csv"

        response = HttpResponse(content_type="text/csv")
        response["Content-Disposition"] = f'attachment; filename=\"{filename}\"'

        writer = csv.writer(response)
        writer.writerow(
            [
                "ID",
                "Rok",
                "Semester",
                "Stav",
                "Študent",
                "E-mail študenta",
                "Študijný program",
                "Firma",
                "Garant",
                "Dátum začiatku",
                "Dátum konca",
                "Vytvorené",
                "Naposledy zmenené",
            ]
        )

        for prax in queryset:
            student = getattr(prax, "student", None)
            firma = getattr(prax, "firma", None)
            garant = getattr(prax, "garant", None)
            study_program = ""
            if student and hasattr(student, "studentprofil"):
                study_program = student.studentprofil.studijny_program or ""

            full_name = ""
            if student:
                full_name = f"{student.meno or ''} {student.priezvisko or ''}".strip()
                if not full_name:
                    full_name = student.email or ""

            writer.writerow(
                [
                    prax.id,
                    prax.rok,
                    prax.semester,
                    prax.stav,
                    full_name,
                    getattr(student, "email", "") or "",
                    study_program,
                    getattr(firma, "nazov", "") or "",
                    getattr(garant, "email", "") or "",
                    getattr(prax, "datum_zaciatku", "") or "",
                    getattr(prax, "datum_konca", "") or "",
                    getattr(prax, "vytvorene_at", "") or "",
                    getattr(prax, "zmenene_at", "") or "",
                ]
            )

        return response


# 🔹 Študent získa prehľad o svojich praxiach
@swagger_auto_schema(
    method='get',
    operation_summary="Zoznam praxí prihláseného študenta",
    operation_description="""
    Tento endpoint vráti všetky praxe, ktoré patria **aktuálne prihlásenému študentovi**.
    Podporuje:
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

    serializer = StudentCreateInternshipSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    firma_id = serializer.validated_data["firma_id"]
    rok = serializer.validated_data["rok"]
    semester = serializer.validated_data["semester"]
    datum_zaciatku = serializer.validated_data["datum_zaciatku"]
    datum_konca = serializer.validated_data["datum_konca"]

    firma = Firma.objects.get(id=firma_id)

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

        # ✅ Placeholder pre zmluvu (študent ju neskôr nahrá)
        Dokument.objects.get_or_create(
            prax=prax,
            typ_dokumentu="zmluva",
            defaults={
                "nahrane_pouzivatel": user,
                "subor_url": "",
                "stav_dokumentu": "nahrany",
            },
        )
        # ✅ Placeholder pre výkaz (študent ho nahrá po ukončení praxe)
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
    """✅ Firma potvrdí prax (stav -> potvrdena)."""
    from apps.notifications.models import Notifikacie 
    user = request.user

    if user.rola != "firma":
        return Response({"error": "Len firma môže potvrdiť prax."}, status=status.HTTP_403_FORBIDDEN)

    if not user.firma_id:
        return Response({"error": "Firma nemá priradené ID (firma_id)."}, status=status.HTTP_400_BAD_REQUEST)

    try:
        prax = Prax.objects.get(id=prax_id, firma_id=user.firma_id)
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
    """❌ Firma zamietne prax (stav -> zamietnuta)."""
    from apps.notifications.models import Notifikacie 
    user = request.user

    if user.rola != "firma":
        return Response({"error": "Len firma môže zamietnuť prax."}, status=status.HTTP_403_FORBIDDEN)

    if not user.firma_id:
        return Response({"error": "Firma nemá priradené ID (firma_id)."}, status=status.HTTP_400_BAD_REQUEST)

    try:
        prax = Prax.objects.get(id=prax_id, firma_id=user.firma_id)
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
    """Externý systém prepne prax zo stavu schvalena do stavu obhajena."""
    user = request.user

    if user.rola not in ("externy", "garant"):
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

            if (prax.stav or "").lower() != "schvalena":
                return Response(
                    {"error": "Prax je možné obhájiť len zo stavu 'schvalena'."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            custom_note = note or "Externý systém označil prax ako obhájenú."
            if reference:
                custom_note = f"{custom_note} Referencia: {reference}"

            prax._changed_by = user
            prax._status_change_note = custom_note
            prax.stav = "obhajena"
            prax.save()

    except Prax.DoesNotExist:
        return Response({"error": "Prax so zadaným ID neexistuje."}, status=status.HTTP_404_NOT_FOUND)

    return Response(InternshipSerializer(prax).data, status=status.HTTP_200_OK)
