"""Company endpoints for CRUD, search, and internship overview."""
from django.conf import settings
from django.core.cache import cache
from django.db.models import Q
from drf_yasg import openapi
from drf_yasg.utils import swagger_auto_schema
from rest_framework import status, viewsets
from rest_framework.decorators import api_view, permission_classes
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.companies.models import Firma
from apps.companies.serializers import CompanySerializer
from apps.internships.models import Prax
from apps.internships.serializers import InternshipSerializer
from apps.users.serializers import StudentProfileSerializer
from common.cache import build_cache_key
from common.permissions.ownership import IsGarantOrReadOnlyCompany


class CompanyViewSet(viewsets.ModelViewSet):
    """CRUD for company records with role-aware access control."""
    queryset = Firma.objects.all()
    serializer_class = CompanySerializer
    permission_classes = [IsAuthenticated, IsGarantOrReadOnlyCompany]

    def get_queryset(self):
        """Filter companies based on user role."""
        user = getattr(self.request, "user", None)
        if not user or not user.is_authenticated:
            return Firma.objects.none()
        role = getattr(user, "rola", "") or ""
        if role == "garant":
            return Firma.objects.all()
        if role == "firma":
            firma_id = getattr(user, "firma_id", None)
            return Firma.objects.filter(id=firma_id) if firma_id else Firma.objects.none()
        return Firma.objects.none()


@swagger_auto_schema(
    method="get",
    operation_summary="Získaj firmu so študentmi a ich praxami",
    operation_description=(
        "Vráti detail firmy vrátane zoznamu študentov, ktorí u nej vykonávajú prax. "
        "Podporuje filtrovanie, vyhľadávanie, stránkovanie a triedenie.\n\n"
        "**Podporované query parametre:**\n"
        "- `rok` (int): filter podľa roka praxe\n"
        "- `stav` (str): filter podľa stavu ('vytvorena', 'potvrdena', 'schvalena'...)\n"
        "- `search` (str): vyhľadávanie podľa mena alebo priezviska študenta\n"
        "- `ordering` (str): napr. `-datum_zaciatku`, `stav`, `rok`\n"
        "- `page` (int): číslo stránky pre stránkovanie"
    ),
    manual_parameters=[
        openapi.Parameter("rok", openapi.IN_QUERY, description="Filter podľa roka", type=openapi.TYPE_INTEGER),
        openapi.Parameter("stav", openapi.IN_QUERY, description="Filter podľa stavu praxe", type=openapi.TYPE_STRING),
        openapi.Parameter("search", openapi.IN_QUERY, description="Vyhľadávanie podľa mena/priezviska študenta", type=openapi.TYPE_STRING),
        openapi.Parameter("ordering", openapi.IN_QUERY, description="Triedenie (napr. '-datum_zaciatku')", type=openapi.TYPE_STRING),
        openapi.Parameter("page", openapi.IN_QUERY, description="Číslo stránky", type=openapi.TYPE_INTEGER),
    ],
)
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def company_internships_overview(request, company_id):
    """Return company detail with filtered internships and pagination."""
    try:
        company = Firma.objects.get(id=company_id)
    except Firma.DoesNotExist:
        return Response({"error": "Firma neexistuje"}, status=status.HTTP_404_NOT_FOUND)

    user = request.user
    role = getattr(user, "rola", "") or ""
    if role == "garant":
        allowed = True
    elif role == "firma" and getattr(user, "firma_id", None) == company.id:
        allowed = True
    else:
        allowed = False
    if not allowed:
        return Response(
            {"error": "Prístup povolený len garantom alebo firme ku vlastným praxiam."},
            status=status.HTTP_403_FORBIDDEN,
        )

    cache_key = build_cache_key("firma:overview", request.query_params, user=request.user, extra=company_id)
    cached = cache.get(cache_key)
    if cached is not None:
        return Response(cached, status=status.HTTP_200_OK)

    internships = Prax.objects.filter(firma=company).select_related("student").order_by("-vytvorene_at")

    rok = request.query_params.get("rok")
    stav = request.query_params.get("stav")
    search = request.query_params.get("search")
    ordering = request.query_params.get("ordering")

    if rok:
        try:
            rok_value = int(rok)
        except (TypeError, ValueError):
            return Response({"error": "Neplatný rok."}, status=status.HTTP_400_BAD_REQUEST)
        internships = internships.filter(rok=rok_value)
    if stav:
        allowed_stav = {choice[0] for choice in Prax.STAV_CHOICES}
        if stav not in allowed_stav:
            return Response({"error": "Neplatný stav."}, status=status.HTTP_400_BAD_REQUEST)
        internships = internships.filter(stav=stav)
    if search:
        internships = internships.filter(
            Q(student__meno__icontains=search) | Q(student__priezvisko__icontains=search)
        )
    if ordering:
        allowed_ordering = {
            "vytvorene_at",
            "rok",
            "semester",
            "datum_zaciatku",
            "datum_konca",
            "stav",
            "student__meno",
            "student__priezvisko",
        }
        normalized = ordering.lstrip("-")
        if normalized not in allowed_ordering:
            return Response({"error": "Neplatné triedenie."}, status=status.HTTP_400_BAD_REQUEST)
        internships = internships.order_by(ordering)

    paginator = PageNumberPagination()
    paginator.page_size = 5
    result_page = paginator.paginate_queryset(internships, request)

    data = {
        "company": CompanySerializer(company).data,
        "count": paginator.page.paginator.count,
        "num_pages": paginator.page.paginator.num_pages,
        "current_page": paginator.page.number,
        "next": paginator.get_next_link(),
        "previous": paginator.get_previous_link(),
        "results": [
            {
                "student": (
                    StudentProfileSerializer(getattr(i.student, "studentprofil", None)).data
                    if hasattr(i.student, "studentprofil")
                    else {
                        "id": i.student.id,
                        "meno": i.student.meno,
                        "priezvisko": i.student.priezvisko,
                        "email": i.student.email,
                    }
                ),
                "internship": InternshipSerializer(i).data,
            }
            for i in result_page
        ],
    }

    cache.set(cache_key, data, getattr(settings, "CACHE_TTL_LIST", 120))
    return Response(data, status=status.HTTP_200_OK)


@swagger_auto_schema(
    method="get",
    operation_summary="Fulltextové vyhľadávanie firiem",
    operation_description="""
    Vyhľadáva firmy podľa názvu, adresy alebo kontaktných údajov pomocou PostgreSQL fulltext search.

    ✅ Príklad použitia:
    ```
    /api/companies/search/?q=tech
    ```
    """,
    manual_parameters=[
        openapi.Parameter("q", openapi.IN_QUERY, description="Hľadaný text (napr. 'TechCorp')", type=openapi.TYPE_STRING),
    ],
    responses={
        200: openapi.Response(
            description="Zoznam firiem zodpovedajúcich fulltext hľadaniu",
            examples={
                "application/json": {
                    "results": [
                        {"id": 1, "nazov": "TechCorp", "adresa": "Bratislava", "kontakt_meno": "Peter Novak"},
                        {"id": 2, "nazov": "TechWorld", "adresa": "Nitra", "kontakt_meno": "Eva Hricová"},
                    ]
                }
            },
        ),
        400: "Chýba parameter ?q",
        401: "Neautorizovaný prístup",
    },
)
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def search_companies(request):
    """Search companies by name or contact fields for autocomplete."""
    user = request.user
    role = getattr(user, "rola", "") or ""
    if role not in ("garant", "firma", "student"):
        return Response(
            {"error": "Prístup povolený len prihláseným používateľom (študent/firma/garant)."},
            status=status.HTTP_403_FORBIDDEN,
        )

    cache_key = build_cache_key("firma:search", request.query_params, user=request.user)
    cached = cache.get(cache_key)
    if cached is not None:
        return Response(cached)

    query = request.query_params.get("q", "").strip()
    if not query:
        payload = {"results": []}
        cache.set(cache_key, payload, getattr(settings, "CACHE_TTL_SEARCH", 180))
        return Response(payload, status=status.HTTP_200_OK)

    firms = Firma.objects.filter(
        Q(nazov__icontains=query)
        | Q(adresa__icontains=query)
        | Q(kontakt_meno__icontains=query)
        | Q(kontakt_email__icontains=query)
    ).order_by("nazov")[:20]

    payload = {"results": CompanySerializer(firms, many=True).data}
    cache.set(cache_key, payload, getattr(settings, "CACHE_TTL_SEARCH", 180))
    return Response(payload, status=status.HTTP_200_OK)


__all__ = [
    "CompanyViewSet",
    "company_internships_overview",
    "search_companies",
]
