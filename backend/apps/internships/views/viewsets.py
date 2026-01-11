"""Viewsets for internship records, history, and garant workflows."""
import csv

from django.conf import settings
from django.core.cache import cache
from django.http import HttpResponse
from django.utils import timezone
from drf_yasg import openapi
from drf_yasg.utils import swagger_auto_schema
from rest_framework import mixins, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from common.cache import build_cache_key
from apps.internships.models import HistoriaStavovPraxe, Prax
from apps.internships.serializers import (
    GarantInternshipUpdateSerializer,
    InternshipHistorySerializer,
    InternshipSerializer,
)
from common.permissions.internships import IsGarantOrRelatedInternship
from common.permissions.rbac import IsGarantUser
from services.internships.access import (
    apply_garant_filters,
    build_garant_export_rows,
    filter_history_for_user,
    filter_internships_for_user,
)


GARANT_LIST_FILTERS = [
    openapi.Parameter("rok", openapi.IN_QUERY, description="Filtruj podľa roku", type=openapi.TYPE_INTEGER),
    openapi.Parameter(
        "semester", openapi.IN_QUERY, description="Filtruj podľa semestra (zimny/letny)", type=openapi.TYPE_STRING
    ),
    openapi.Parameter("stav", openapi.IN_QUERY, description="Filtruj podľa stavu praxe", type=openapi.TYPE_STRING),
    openapi.Parameter("student_id", openapi.IN_QUERY, description="ID študenta", type=openapi.TYPE_INTEGER),
    openapi.Parameter("firma_id", openapi.IN_QUERY, description="ID firmy", type=openapi.TYPE_INTEGER),
    openapi.Parameter(
        "search", openapi.IN_QUERY, description="Fulltext v mene študenta alebo názve firmy", type=openapi.TYPE_STRING
    ),
    openapi.Parameter(
        "student", openapi.IN_QUERY, description="Textový filter mena alebo emailu študenta", type=openapi.TYPE_STRING
    ),
    openapi.Parameter(
        "firma", openapi.IN_QUERY, description="Textový filter názvu firmy", type=openapi.TYPE_STRING
    ),
    openapi.Parameter(
        "odbor", openapi.IN_QUERY, description="Filter podľa študijného programu", type=openapi.TYPE_STRING
    ),
]


def _init_csv_response(filename_prefix: str):
    timestamp = timezone.now().strftime("%Y%m%d_%H%M%S")
    filename = f"{filename_prefix}_{timestamp}.csv"
    response = HttpResponse(content_type="text/csv")
    response["Content-Disposition"] = f'attachment; filename="{filename}"'
    return response


class InternshipViewSet(viewsets.ModelViewSet):
    """CRUD access for internships scoped by user role."""
    queryset = Prax.objects.select_related(
        "student", "student__studentprofil", "firma", "garant"
    ).order_by("-vytvorene_at")
    serializer_class = InternshipSerializer
    permission_classes = [IsAuthenticated, IsGarantOrRelatedInternship]

    def get_queryset(self):
        """Limit praxe na tie, kde je používateľ účastníkom, alebo garant vidí všetko."""
        user = getattr(self.request, "user", None)
        qs = super().get_queryset().order_by("-vytvorene_at")
        return filter_internships_for_user(user, qs)


class InternshipHistoryViewSet(viewsets.ModelViewSet):
    """Read-only access to internship status history by role."""
    queryset = HistoriaStavovPraxe.objects.all()
    serializer_class = InternshipHistorySerializer
    permission_classes = [IsAuthenticated, IsGarantOrRelatedInternship]

    def get_queryset(self):
        """História len pre praxe, kde je používateľ účastníkom, alebo garant."""
        user = getattr(self.request, "user", None)
        qs = super().get_queryset().select_related("prax").order_by("-zmena_at")
        return filter_history_for_user(user, qs)


class GarantInternshipViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.UpdateModelMixin,
    viewsets.GenericViewSet,
):
    """Garant-only endpoints for listing, updating, and exporting internships."""
    queryset = (
        Prax.objects.select_related("student", "student__studentprofil", "firma", "garant").all().order_by("-vytvorene_at")
    )
    permission_classes = [IsAuthenticated, IsGarantUser]
    http_method_names = ["get", "patch", "put", "head", "options"]

    def get_serializer_class(self):
        if self.action in ("update", "partial_update"):
            return GarantInternshipUpdateSerializer
        return InternshipSerializer

    @swagger_auto_schema(
        operation_summary="Garant: Zoznam všetkých praxí",
        operation_description="Vráti stránkovaný zoznam praxí vrátane študenta, firmy a dokumentov.",
        manual_parameters=GARANT_LIST_FILTERS,
        responses={
            200: openapi.Response("Paginated internships", InternshipSerializer(many=True)),
            403: "Používateľ nemá rolu garant",
        },
    )
    def list(self, request, *args, **kwargs):
        cache_key = build_cache_key("praxe:list:garant", request.query_params, user=request.user)
        cached = cache.get(cache_key)
        if cached is not None:
            return Response(cached)

        queryset = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            response = self.get_paginated_response(serializer.data)
            cache.set(cache_key, response.data, getattr(settings, "CACHE_TTL_LIST", 120))
            return response

        serializer = self.get_serializer(queryset, many=True)
        cache.set(cache_key, serializer.data, getattr(settings, "CACHE_TTL_LIST", 120))
        return Response(serializer.data)

    @swagger_auto_schema(
        operation_summary="Garant: Detail praxe",
        responses={
            200: openapi.Response("Detail praxe", InternshipSerializer),
            404: "Prax neexistuje",
        },
    )
    def retrieve(self, request, *args, **kwargs):
        cache_key = f"praxe:detail:{kwargs.get('pk')}"
        cached = cache.get(cache_key)
        if cached is not None:
            return Response(cached)

        response = super().retrieve(request, *args, **kwargs)
        if response.status_code == 200:
            cache.set(cache_key, response.data, getattr(settings, "CACHE_TTL_DETAIL", 300))
        return response

    def get_queryset(self):
        queryset = super().get_queryset()
        result = apply_garant_filters(queryset, self.request.query_params)
        if not result["ok"]:
            raise ValidationError(result["errors"])
        return result["queryset"]

    @swagger_auto_schema(
        operation_summary="Garant: Aktualizácia praxe",
        request_body=GarantInternshipUpdateSerializer,
        responses={
            200: openapi.Response("Aktualizovaná prax", InternshipSerializer),
            400: "Neplatné údaje",
            404: "Prax neexistuje",
        },
    )
    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        updated_instance = serializer.save()
        read_serializer = InternshipSerializer(updated_instance, context=self.get_serializer_context())
        return Response(read_serializer.data)

    @swagger_auto_schema(
        operation_summary="Garant: Čiastočná aktualizácia praxe",
        request_body=GarantInternshipUpdateSerializer,
        responses={
            200: openapi.Response("Aktualizovaná prax", InternshipSerializer),
            400: "Neplatné údaje",
            404: "Prax neexistuje",
        },
    )
    def partial_update(self, request, *args, **kwargs):
        kwargs["partial"] = True
        return self.update(request, *args, **kwargs)

    @swagger_auto_schema(
        method="get",
        operation_summary="Garant: Export praxí do CSV",
        operation_description=(
            "Stiahne CSV so všetkými praxami, ktoré spĺňajú zvolené filtre. "
            "Používa rovnaké parametre ako zoznam praxí."
        ),
        manual_parameters=GARANT_LIST_FILTERS,
        responses={
            200: "CSV súbor s praxami",
            403: "Používateľ nemá rolu garant",
        },
    )
    @action(detail=False, methods=["get"], url_path="export")
    def export(self, request, *args, **kwargs):
        queryset = self.get_queryset()

        response = _init_csv_response("internships_export")
        writer = csv.writer(response)
        writer.writerow(
            [
                "ID",
                "Rok",
                "Semester",
                "Stav",
                "Študent",
                "E-mail študenta",
                "Študijný program",
                "Firma",
                "Garant",
                "Dátum začiatku",
                "Dátum konca",
                "Vytvorené",
                "Naposledy zmenené",
            ]
        )

        for row in build_garant_export_rows(queryset):
            writer.writerow(row)

        return response


__all__ = [
    "GARANT_LIST_FILTERS",
    "InternshipViewSet",
    "InternshipHistoryViewSet",
    "GarantInternshipViewSet",
]
