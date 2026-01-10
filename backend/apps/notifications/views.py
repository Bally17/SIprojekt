"""Notification endpoints for authenticated users."""
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi

from .models import Notifikacie
from .serializers import NotificationSerializer


class NotificationViewSet(viewsets.ModelViewSet):
    """CRUD and filtering for user notifications."""
    queryset = Notifikacie.objects.all()
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Return notifications for the authenticated user only."""
        # ⚙️ Swagger volá view ako AnonymousUser → vrátime prázdny queryset
        if getattr(self, 'swagger_fake_view', False):
            return Notifikacie.objects.none()

        user = self.request.user
        queryset = Notifikacie.objects.filter(prijemca=user).order_by("-vytvorene_at")

        stav = self.request.query_params.get("stav")
        if stav:
            queryset = queryset.filter(stav__iexact=stav)

        return queryset

    @swagger_auto_schema(
        method="get",
        operation_summary="📩 Zoznam notifikácií prihláseného používateľa",
        operation_description="""
        Tento endpoint vráti **všetky notifikácie** aktuálne prihláseného používateľa
        (či už študent, firma alebo garant).  
        Možno filtrovať podľa `stav` a výsledok je stránkovaný po 10.
        """,
        manual_parameters=[
            openapi.Parameter(
                "stav", openapi.IN_QUERY,
                description="Filter podľa stavu (napr. nove, precitane, odoslane)",
                type=openapi.TYPE_STRING
            )
        ],
        responses={200: "Zoznam notifikácií prihláseného používateľa"}
    )
    @action(detail=False, methods=["get"], url_path="me")
    def my_notifications(self, request):
        """Return a paginated list of user notifications."""
        notifications = self.get_queryset()

        paginator = PageNumberPagination()
        paginator.page_size = 10
        result_page = paginator.paginate_queryset(notifications, request)

        serializer = NotificationSerializer(result_page, many=True)
        return paginator.get_paginated_response(serializer.data)
