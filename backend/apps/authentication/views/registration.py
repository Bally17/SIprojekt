from rest_framework import status
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.authentication.serializers.registration import (
    CompanyProfileCompletionSerializer,
    CompanyRegistrationSerializer,
    StudentRegistrationSerializer,
)
from common.auth.jwt_auth import AllowInactiveJWTAuthentication
from apps.companies.serializers import CompanySerializer
from common.auth.context import get_user_data
from services.auth import registration as registration_service


class StudentRegistrationView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = StudentRegistrationSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        result = registration_service.register_student(serializer.validated_data)
        return Response(result["data"], status=status.HTTP_201_CREATED)


class CompanyRegistrationView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = CompanyRegistrationSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        result = registration_service.register_company(serializer.validated_data)
        if not result.get("ok", True):
            return Response(result.get("errors", {}), status=status.HTTP_400_BAD_REQUEST)

        return Response(result["data"], status=status.HTTP_201_CREATED)


@api_view(["GET"])
@permission_classes([AllowAny])
def activate_account(request, token: str):
    result = registration_service.activate_account(token)
    return Response(result["data"], status=result["status"])


@api_view(["POST"])
@authentication_classes([AllowInactiveJWTAuthentication])
@permission_classes([IsAuthenticated])
def company_profile_complete(request):
    serializer = CompanyProfileCompletionSerializer(
        data=request.data,
        context={"user": request.user},
    )
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    result = registration_service.complete_company_profile(
        request.user,
        serializer.validated_data,
    )
    if not result["ok"]:
        return Response(result["data"], status=result["status"])

    return Response(
        {
            "user": get_user_data(result["user"]),
            "firma": CompanySerializer(result["firma"]).data if result.get("firma") else None,
        },
        status=result["status"],
    )


__all__ = [
    "StudentRegistrationView",
    "CompanyRegistrationView",
    "activate_account",
    "company_profile_complete",
]
