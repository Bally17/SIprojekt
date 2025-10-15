# apps/users/views.py
from rest_framework import viewsets
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
