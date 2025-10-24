# apps/internships/views.py
from rest_framework import viewsets, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination

from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi

from .models import Prax, HistoriaStavovPraxe
from .serializers import InternshipSerializer, InternshipHistorySerializer
from apps.users.serializers import StudentProfileSerializer


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
    responses={
        200: openapi.Response(
            description="Zoznam praxí aktuálne prihláseného študenta",
            examples={
                "application/json": {
                    "count": 1,
                    "next": None,
                    "previous": None,
                    "results": {
                        "student": {
                            "id": 1,
                            "meno": "Peter",
                            "priezvisko": "Novák",
                            "email": "student1@student.ukf.sk",
                            "studijny_program": "Aplikovaná informatika"
                        },
                        "internships": [
                            {
                                "id": 1,
                                "rok": 2025,
                                "semester": "zimny",
                                "datum_zaciatku": "2025-01-10",
                                "datum_konca": "2025-03-31",
                                "stav": "schvalena",
                                "firma": 1,
                                "garant": 5
                            }
                        ]
                    }
                }
            }
        ),
        403: "Používateľ nemá študentský profil",
        401: "Neautorizovaný prístup"
    }
)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def student_my_internships(request):
    """
    🔹 Študent získa prehľad o svojich praxiach (len svoje vlastné).
    Podporuje stránkovanie a filtrovanie (rok, stav, semester).
    """
    user = request.user

    # Overíme, či používateľ má študentský profil
    if not hasattr(user, 'studentprofil'):
        return Response({"error": "Používateľ nemá študentský profil."}, status=status.HTTP_403_FORBIDDEN)

    student = user.studentprofil
    internships = Prax.objects.filter(student=student.pouzivatel).select_related('firma', 'garant')

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

    # Triedenie
    ordering = request.query_params.get('ordering')
    if ordering:
        internships = internships.order_by(ordering)

    # Stránkovanie
    paginator = PageNumberPagination()
    paginator.page_size = 10
    result_page = paginator.paginate_queryset(internships, request)

    data = {
        "student": StudentProfileSerializer(student).data,
        "internships": InternshipSerializer(result_page, many=True).data,
    }

    return paginator.get_paginated_response(data)
