# apps/users/serializers.py
from rest_framework import serializers
from .models import User, StudentProfil, GarantProfil

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = '__all__'

class StudentProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = StudentProfil
        fields = '__all__'

class GarantProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = GarantProfil
        fields = '__all__'
