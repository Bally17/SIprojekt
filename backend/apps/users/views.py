# apps/users/views.py
from django.db.models import Q
from rest_framework import viewsets
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import User, StudentProfil, GarantProfil
from .serializers import UserSerializer, StudentProfileSerializer, GarantProfileSerializer


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer


class StudentProfileViewSet(viewsets.ModelViewSet):
    queryset = StudentProfil.objects.all()
    serializer_class = StudentProfileSerializer


class GarantProfileViewSet(viewsets.ModelViewSet):
    queryset = GarantProfil.objects.all()
    serializer_class = GarantProfileSerializer


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def search_students(request):
    """
    Vyhľadá študentov podľa mena, priezviska alebo emailu.
    """
    query = (request.query_params.get('q') or "").strip()
    if len(query) < 2:
        return Response({"results": []})

    students = (
        StudentProfil.objects.select_related("pouzivatel")
        .filter(
            Q(pouzivatel__meno__icontains=query)
            | Q(pouzivatel__priezvisko__icontains=query)
            | Q(pouzivatel__email__icontains=query)
        )[:10]
    )

    return Response({"results": StudentProfileSerializer(students, many=True).data})
