"""Upload/download mixin for document files and access checks."""
import logging
import os

from django.conf import settings
from django.http import FileResponse
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.internships.models import Prax
from services.storage import generate_presigned_url, upload_file_to_b2

from apps.notifications.service import notify_document_uploaded

from ..models import Dokument
from ..serializers import DocumentSerializer
from .helpers import _assert, _user_is_firma, _user_is_garant, _user_is_student


logger = logging.getLogger(__name__)


class DocumentUploadDownloadMixin:
    """Provide upload/download actions for document files."""
    # ----------------------  UPLOAD (študent)  ----------------------
    @action(detail=True, methods=["post"], url_path="upload")
    def upload(self, request, pk=None):
        """Upload a PDF for allowed roles and update document state."""
        old_doc = self.get_object()
        user = request.user

        prax = old_doc.prax
        prax_forma = getattr(prax, "forma", Prax.FORMA_DOHODA)
        is_employment = prax_forma == Prax.FORMA_ZAMESTNANIE
        is_student = _user_is_student(user) and prax and prax.student_id == user.id
        is_company = (
            _user_is_firma(user)
            and prax
            and getattr(user, "firma_id", None) == getattr(prax, "firma_id", None)
            and old_doc.typ_dokumentu == Dokument.TYP_VYKAZ
        )

        if not is_student and not is_company:
            return Response(
                {"detail": "Iba študent alebo firma môže nahrávať tento dokument."},
                status=status.HTTP_403_FORBIDDEN,
            )

        # zmluvu moze student nahrať až ak je stav praxe schvaleny (netýka sa plateného zamestnania)
        if is_student and old_doc.typ_dokumentu == Dokument.TYP_ZMLUVA and not is_employment:
            resp = _assert(
                getattr(prax, "stav", "").lower() == Prax.STAV_SCHVALENA,
                "Zmluvu môžeš nahrať až po schválení praxe.",
                status.HTTP_403_FORBIDDEN,
            )
            if resp:
                return resp

        file = request.FILES.get("file")
        resp = _assert(file is not None, "Chýba súbor 'file' v requeste.")
        if resp:
            return resp

        max_size = getattr(settings, "DOCUMENT_MAX_UPLOAD_SIZE", 10 * 1024 * 1024)
        if file.size and file.size > max_size:
            return Response(
                {"detail": "Súbor je príliš veľký."},
                status=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            )
        content_type = (getattr(file, "content_type", "") or "").lower()
        filename = (getattr(file, "name", "") or "").lower()
        if not (filename.endswith(".pdf") or content_type in ("application/pdf", "application/x-pdf")):
            return Response(
                {"detail": "Povolené sú iba PDF súbory."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        object_name = upload_file_to_b2(file)

        old_doc.subor_url = object_name
        old_doc.nahrane_pouzivatel_id = user.id
        old_doc.stav_dokumentu = Dokument.STAV_NAHRANY
        old_doc.skontroloval = None
        old_doc.skontrolovane_at = None
        old_doc.save(
            update_fields=[
                "subor_url",
                "nahrane_pouzivatel_id",
                "stav_dokumentu",
                "skontroloval",
                "skontrolovane_at",
                "zmenene_at",
            ]
        )

        notify_document_uploaded(old_doc)

        return Response(DocumentSerializer(old_doc).data, status=status.HTTP_200_OK)

    # ---------------------------  DOWNLOAD  --------------------------
    @action(detail=True, methods=["get"], url_path="download")
    def download(self, request, pk=None):
        """Return a presigned URL or streamed file for authorized users."""
        document = self.get_object()
        prax = document.prax
        user = request.user

        allowed = (
            (_user_is_student(user) and prax and prax.student_id == user.id)
            or (
                _user_is_firma(user)
                and hasattr(user, "firma_id")
                and user.firma_id == getattr(prax, "firma_id", None)
            )
            or (_user_is_garant(user) and prax and getattr(prax, "garant_id", None) == user.id)
        )

        resp = _assert(allowed, "Nemáš oprávnenie stiahnuť tento dokument.", status.HTTP_403_FORBIDDEN)
        if resp:
            return resp

        resp = _assert(bool(document.subor_url), "Dokument zatiaľ nemá nahratý súbor.")
        if resp:
            return resp

        object_name = document.subor_url

        # Absolútna URL? Vráť rovno.
        if isinstance(object_name, str) and object_name.startswith(("http://", "https://")):
            return Response({"url": object_name}, status=status.HTTP_200_OK)

        # Lokálny súbor v MEDIA_ROOT – vráť cez autentizovaný stream
        base_dir = os.path.abspath(settings.MEDIA_ROOT)
        local_path = os.path.abspath(os.path.normpath(os.path.join(base_dir, object_name)))
        if not local_path.startswith(base_dir + os.sep):
            return Response(
                {"detail": "Neplatná cesta k súboru."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if os.path.exists(local_path):
            filename = os.path.basename(local_path)
            content_type = "application/pdf" if filename.lower().endswith(".pdf") else None
            return FileResponse(
                open(local_path, "rb"),
                as_attachment=True,
                filename=filename,
                content_type=content_type,
            )

        # Inak skús B2
        try:
            url = generate_presigned_url(object_name)
            return Response({"url": url}, status=status.HTTP_200_OK)
        except Exception as exc:  # pragma: no cover - závislé od infra
            logger.exception("❌ Download link generation failed for document %s: %s", document.id, exc)
            return Response(
                {"detail": "Download link sa nepodarilo vygenerovať. Skús to neskôr."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
