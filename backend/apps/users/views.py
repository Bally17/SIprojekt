# apps/users/views.py
from django.db.models import Q
from rest_framework import viewsets
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import User, StudentProfil, GarantProfil
from .serializers import UserSerializer, StudentProfileSerializer, GarantProfileSerializer
from apps.internships.permissions import IsGarantUser


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated, IsGarantUser]

    def get_queryset(self):
        """
        Garant vidí všetkých, bežný používateľ len svoje vlastné konto.
        """
        user = getattr(self.request, "user", None)
        if not user or not user.is_authenticated:
            return User.objects.none()
        if getattr(user, "rola", "") == User.ROLE_GARANT:
            return User.objects.all()
        return User.objects.filter(id=user.id)


class StudentProfileViewSet(viewsets.ModelViewSet):
    queryset = StudentProfil.objects.all()
    serializer_class = StudentProfileSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """
        Garant vidí všetky profily, študent len svoj.
        """
        user = getattr(self.request, "user", None)
        if not user or not user.is_authenticated:
            return StudentProfil.objects.none()
        if getattr(user, "rola", "") == User.ROLE_GARANT:
            return StudentProfil.objects.all()
        if getattr(user, "rola", "") == User.ROLE_STUDENT:
            return StudentProfil.objects.filter(pouzivatel_id=user.id)
        return StudentProfil.objects.none()


class GarantProfileViewSet(viewsets.ModelViewSet):
    queryset = GarantProfil.objects.all()
    serializer_class = GarantProfileSerializer
    permission_classes = [IsAuthenticated, IsGarantUser]

    def get_queryset(self):
        """
        Garant vidí vlastný profil (a ostatných garantov ak sú v DB).
        """
        user = getattr(self.request, "user", None)
        if not user or not user.is_authenticated:
            return GarantProfil.objects.none()
        if getattr(user, "rola", "") == User.ROLE_GARANT:
            # Ak máte viac garantov, umožní im vidieť aj ostatných garantov.
            return GarantProfil.objects.all()
        return GarantProfil.objects.none()


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
