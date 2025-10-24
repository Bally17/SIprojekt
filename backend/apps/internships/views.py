from rest_framework import viewsets, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi

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
def student_my_internships(request):
    """🔹 Študent získa prehľad o svojich praxiach (len svoje vlastné)."""
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
