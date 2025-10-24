from rest_framework import viewsets, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from .models import Prax, HistoriaStavovPraxe
from .serializers import InternshipSerializer, InternshipHistorySerializer
from apps.users.serializers import UserSerializer
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi


# 🔹 CRUD pre praxe
class InternshipViewSet(viewsets.ModelViewSet):
    queryset = Prax.objects.all()
    serializer_class = InternshipSerializer


# 🔹 CRUD pre históriu praxí
class InternshipHistoryViewSet(viewsets.ModelViewSet):
    queryset = HistoriaStavovPraxe.objects.all()
    serializer_class = InternshipHistorySerializer


# 🔹 Firma získa prehľad o svojich praxiach
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def company_my_internships(request):
    """
    🔹 Firma získa prehľad o praxiach, ktoré patria jej (podľa request.user.firma_id).
    Možno filtrovať podľa stavu, roka, semestra.
    """
    user = request.user

    if user.rola != "firma":
        return Response({"error": "Prístup povolený len pre firemných používateľov."},
                        status=status.HTTP_403_FORBIDDEN)

    if not user.firma_id:
        return Response({"error": "Firma nemá priradené ID (firma_id)."},
                        status=status.HTTP_400_BAD_REQUEST)

    # 🔍 Vyhľadáme všetky praxe tejto firmy
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

    # Stránkovanie
    paginator = PageNumberPagination()
    paginator.page_size = 10
    result_page = paginator.paginate_queryset(internships, request)

    data = {
        "firma": UserSerializer(user).data,
        "internships": InternshipSerializer(result_page, many=True).data,
    }

    return paginator.get_paginated_response(data)


# 🔹 Firma získa praxe, ktoré čakajú na potvrdenie
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def company_pending_internships(request):
    """
    🔹 Firma získa praxe, ktoré čakajú na potvrdenie (stav = 'caka_na_potvrdenie').
    Automaticky sa filtruje podľa firmy prihláseného používateľa.
    """
    user = request.user

    if user.rola != "firma":
        return Response({"error": "Prístup povolený len pre firemných používateľov."},
                        status=status.HTTP_403_FORBIDDEN)

    if not user.firma_id:
        return Response({"error": "Firma nemá priradené ID (firma_id)."},
                        status=status.HTTP_400_BAD_REQUEST)

    # Filtrovanie len čakajúcich praxí
    internships = Prax.objects.filter(firma_id=user.firma_id, stav__iexact="vytvorena").select_related('student', 'garant')

    paginator = PageNumberPagination()
    paginator.page_size = 10
    result_page = paginator.paginate_queryset(internships, request)

    data = {
        "firma": UserSerializer(user).data,
        "internships": InternshipSerializer(result_page, many=True).data,
    }

    return paginator.get_paginated_response(data)
