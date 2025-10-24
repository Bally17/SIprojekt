from rest_framework import viewsets, status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi
from django.db.models import Q

from .models import Firma
from .serializers import CompanySerializer
from apps.internships.models import Prax
from apps.users.serializers import StudentProfileSerializer
from apps.internships.serializers import InternshipSerializer


class CompanyViewSet(viewsets.ModelViewSet):
    queryset = Firma.objects.all()
    serializer_class = CompanySerializer


@swagger_auto_schema(
    method='get',
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
        openapi.Parameter('rok', openapi.IN_QUERY, description="Filter podľa roka", type=openapi.TYPE_INTEGER),
        openapi.Parameter('stav', openapi.IN_QUERY, description="Filter podľa stavu praxe", type=openapi.TYPE_STRING),
        openapi.Parameter('search', openapi.IN_QUERY, description="Vyhľadávanie podľa mena/priezviska študenta", type=openapi.TYPE_STRING),
        openapi.Parameter('ordering', openapi.IN_QUERY, description="Triedenie (napr. '-datum_zaciatku')", type=openapi.TYPE_STRING),
        openapi.Parameter('page', openapi.IN_QUERY, description="Číslo stránky", type=openapi.TYPE_INTEGER),
    ],
)
@api_view(['GET'])
def company_internships_overview(request, company_id):
    try:
        company = Firma.objects.get(id=company_id)
    except Firma.DoesNotExist:
        return Response({"error": "Firma neexistuje"}, status=status.HTTP_404_NOT_FOUND)

    internships = Prax.objects.filter(firma=company).select_related('student')

    # --- Filtrovanie ---
    rok = request.query_params.get('rok')
    stav = request.query_params.get('stav')
    search = request.query_params.get('search')
    ordering = request.query_params.get('ordering')

    if rok:
        internships = internships.filter(rok=rok)
    if stav:
        internships = internships.filter(stav=stav)
    if search:
        internships = internships.filter(
            Q(student__meno__icontains=search) | Q(student__priezvisko__icontains=search)
        )
    if ordering:
        internships = internships.order_by(ordering)

    # --- Stránkovanie ---
    paginator = PageNumberPagination()
    paginator.page_size = 5  # môžeš zmeniť podľa potreby
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
        "student": StudentProfileSerializer(getattr(i.student, "studentprofil", None)).data
        if hasattr(i.student, "studentprofil")
        else {
            "id": i.student.id,
            "meno": i.student.meno,
            "priezvisko": i.student.priezvisko,
            "email": i.student.email,
        },
        "internship": InternshipSerializer(i).data,
    }
    for i in result_page
],

    }

    return Response(data, status=status.HTTP_200_OK)
