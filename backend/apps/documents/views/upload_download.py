from rest_framework import status
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.internships.models import Prax
from services.storage import generate_presigned_url, upload_file_to_b2

from apps.notifications.service import notify_document_uploaded

from ..models import Dokument
from ..serializers import DocumentSerializer
from .helpers import _assert, _user_is_firma, _user_is_garant, _user_is_student


class DocumentUploadDownloadMixin:
    # ----------------------  UPLOAD (študent)  ----------------------
    @action(detail=True, methods=["post"], url_path="upload")
    def upload(self, request, pk=None):
        """
        Študent alebo firma (len výkaz) nahrá PDF, uloží sa do B2 a aktualizuje dokument.
        Stav novej verzie: 'nahrany'. Posiela sa notifikácia.
        """
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
        """Vráti presigned URL pre oprávnených (študent, firma, garant)."""
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

        url = generate_presigned_url(document.subor_url)
        return Response({"url": url}, status=status.HTTP_200_OK)
