"""Viewsets for internship records, history, and garant workflows."""
from django.conf import settings
from django.core.cache import cache
from django.db.models import Q
from drf_yasg import openapi
from drf_yasg.utils import swagger_auto_schema
from rest_framework import mixins, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

import csv

from ..models import HistoriaStavovPraxe, Prax
from ..permissions import IsGarantOrRelatedInternship, IsGarantUser
from ..serializers import (
    GarantInternshipUpdateSerializer,
    InternshipHistorySerializer,
    InternshipSerializer,
)
from .garant import GARANT_LIST_FILTERS, init_csv_response
from apps.cache_utils import build_cache_key


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
        role = getattr(user, "rola", "") or ""

        if role == "garant":
            return qs
        if role == "student":
            return qs.filter(student_id=user.id)
        if role == "firma":
            firma_id = getattr(user, "firma_id", None)
            return qs.filter(firma_id=firma_id) if firma_id else qs.none()
        return qs.none()


class InternshipHistoryViewSet(viewsets.ModelViewSet):
    """Read-only access to internship status history by role."""
    queryset = HistoriaStavovPraxe.objects.all()
    serializer_class = InternshipHistorySerializer
    permission_classes = [IsAuthenticated, IsGarantOrRelatedInternship]

    def get_queryset(self):
        """História len pre praxe, kde je používateľ účastníkom, alebo garant."""
        user = getattr(self.request, "user", None)
        qs = super().get_queryset().select_related("prax").order_by("-zmena_at")
        role = getattr(user, "rola", "") or ""

        if role == "garant":
            return qs
        if role == "student":
            return qs.filter(prax__student_id=user.id)
        if role == "firma":
            firma_id = getattr(user, "firma_id", None)
            return qs.filter(prax__firma_id=firma_id) if firma_id else qs.none()
        return qs.none()


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
        params = self.request.query_params

        rok = params.get("rok")
        semester = params.get("semester")
        stav = params.get("stav")
        student_id = params.get("student_id")
        firma_id = params.get("firma_id")
        search = params.get("search")
        student_text = params.get("student")
        firma_text = params.get("firma")
        study_program = params.get("odbor") or params.get("study_program")

        if rok:
            queryset = queryset.filter(rok=rok)
        if semester:
            queryset = queryset.filter(semester__iexact=semester)
        if stav:
            queryset = queryset.filter(stav__iexact=stav)
        if student_id:
            queryset = queryset.filter(student_id=student_id)
        if firma_id:
            queryset = queryset.filter(firma_id=firma_id)
        if student_text:
            queryset = queryset.filter(
                Q(student__email__icontains=student_text)
                | Q(student__meno__icontains=student_text)
                | Q(student__priezvisko__icontains=student_text)
            )
        if firma_text:
            queryset = queryset.filter(firma__nazov__icontains=firma_text)
        if study_program:
            queryset = queryset.filter(student__studentprofil__studijny_program__icontains=study_program)
        if search:
            queryset = queryset.filter(
                Q(student__email__icontains=search)
                | Q(student__meno__icontains=search)
                | Q(student__priezvisko__icontains=search)
                | Q(firma__nazov__icontains=search)
            )

        return queryset

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

        response = init_csv_response("internships_export")
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

        for prax in queryset:
            student = getattr(prax, "student", None)
            firma = getattr(prax, "firma", None)
            garant = getattr(prax, "garant", None)
            study_program = ""
            if student and hasattr(student, "studentprofil"):
                study_program = student.studentprofil.studijny_program or ""

            full_name = ""
            if student:
                full_name = f"{student.meno or ''} {student.priezvisko or ''}".strip()
                if not full_name:
                    full_name = student.email or ""

            writer.writerow(
                [
                    prax.id,
                    prax.rok,
                    prax.semester,
                    prax.stav,
                    full_name,
                    getattr(student, "email", "") or "",
                    study_program,
                    getattr(firma, "nazov", "") or "",
                    getattr(garant, "email", "") or "",
                    getattr(prax, "datum_zaciatku", "") or "",
                    getattr(prax, "datum_konca", "") or "",
                    getattr(prax, "vytvorene_at", "") or "",
                    getattr(prax, "zmenene_at", "") or "",
                ]
            )

        return response
