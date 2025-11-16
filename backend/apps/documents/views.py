from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.http import FileResponse
from django.utils import timezone

from apps.internships.models import Prax
from services.storage import upload_file_to_b2, generate_presigned_url

# 🔔 notification services (firm + garant)
from apps.notifications.service import (
    notify_document_uploaded,                         # → firma (+ garant pri tvojej špecifikácii)
    notify_document_reviewed,                         # company: approved / hard-rejected
    # doplň do service ak ešte nemáš:
    notify_document_soft_rejected_by_company,         # company: soft reject (reason povinný, stav sa NEMENÍ)
    notify_document_reviewed_by_garant,               # garant: approve (Študent + Firma)
    notify_document_soft_rejected_by_garant,          # garant: soft reject (reason povinný, stav sa NEMENÍ)
    notify_document_hard_rejected_by_garant,          # garant: hard reject (reason povinný, stav -> zamietnuty)
)

from .models import Dokument
from .serializers import DocumentSerializer
from .utils.pdf_generator import generate_dohoda_pdf


# --- Pomocné funkcie ---------------------------------------------------------

def _user_is_student(user): return getattr(user, "rola", "").lower() == "student"
def _user_is_firma(user):   return getattr(user, "rola", "").lower() == "firma"
def _user_is_garant(user):  return getattr(user, "rola", "").lower() == "garant"

def _assert(cond, msg, code=status.HTTP_400_BAD_REQUEST):
    if not cond:
        return Response({"detail": msg}, status=code)


class DocumentViewSet(viewsets.ModelViewSet):
    """
    Endpoints:
    - POST   /documents/{id}/upload               (študent)  → vytvorí NOVÚ verziu (nový záznam)
    - POST   /documents/{id}/approve-company      (firma)
    - POST   /documents/{id}/reject-company       (firma)    → HARD (stav -> zamietnuty)
    - POST   /documents/{id}/reject-company-soft  (firma)    → SOFT (stav sa nemení, reason povinný)
    - POST   /documents/{id}/approve-garant       (garant)   → stav sa nemení (audit)
    - POST   /documents/{id}/reject-garant-soft   (garant)   → SOFT (stav sa nemení, reason povinný)
    - POST   /documents/{id}/reject-garant-hard   (garant)   → HARD (stav -> zamietnuty, reason povinný)
    - GET    /documents/{id}/download
    - GET    /documents/{id}/generate_dohoda
    """
    queryset = Dokument.objects.all()
    serializer_class = DocumentSerializer
    permission_classes = [IsAuthenticated]

    # ----------------------  UPLOAD (študent)  ----------------------
    @action(detail=True, methods=["post"], url_path="upload")
    def upload(self, request, pk=None):
        """
        Študent nahrá PDF → upload do B2 → vytvorí sa NOVÝ záznam Dokument (full history).
        Stav novej verzie: 'nahrany'. Pošleme notifikáciu firme (+ garantovi podľa tvojej špecifikácie).
        """
        old_doc = self.get_object()
        user = request.user

        prax = old_doc.prax
        is_student = _user_is_student(user) and prax and prax.student_id == user.id
        is_company = (
            _user_is_firma(user)
            and prax
            and getattr(user, "firma_id", None) == getattr(prax, "firma_id", None)
            and old_doc.typ_dokumentu == "vykaz"
        )

        if not is_student and not is_company:
            return Response(
                {"detail": "Iba študent alebo firma môže nahrávať tento dokument."},
                status=status.HTTP_403_FORBIDDEN,
            )

        file = request.FILES.get("file")
        resp = _assert(file is not None, "Chýba súbor 'file' v requeste.")
        if resp: return resp

        # upload -> B2
        object_name = upload_file_to_b2(file)

        # aktualizuj existujúci záznam (držanie histórie riešime neskôr)
        old_doc.subor_url = object_name
        old_doc.nahrane_pouzivatel_id = user.id
        old_doc.stav_dokumentu = "nahrany"
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

    # -------------------  COMPANY APPROVE/REJECT  -------------------
    @action(detail=True, methods=["post"], url_path="approve-company")
    def approve_company(self, request, pk=None):
        """
        Firma schváli dokument → stav 'potvrdeny', audit -> skontroloval(+čas).
        Maily: Študent + Garant (zabezpečí service).
        """
        document = self.get_object()
        user = request.user
        prax = document.prax

        resp = _assert(_user_is_firma(user), "Iba firma môže schváliť dokument.", status.HTTP_403_FORBIDDEN)
        if resp: return resp

        # ak má Používateľ pole firma_id, skontroluj zhodu
        if hasattr(user, "firma_id"):
            resp = _assert(user.firma_id == getattr(prax, "firma_id", None), "Toto nie je vaša prax.", status.HTTP_403_FORBIDDEN)
            if resp: return resp

        resp = _assert(document.stav_dokumentu == "nahrany", "Firma môže schváliť len dokument v stave 'nahrany'.")
        if resp: return resp

        document.stav_dokumentu = "potvrdeny"
        document.skontroloval_id = user.id
        document.skontrolovane_at = timezone.now()
        document.save(update_fields=["stav_dokumentu", "skontroloval_id", "skontrolovane_at", "zmenene_at"])

        # 🔔 Notifikácia: company approved (service pošle: študent + garant)
        notify_document_reviewed(document, approved=True)

        return Response({"detail": "Schválené firmou."}, status=status.HTTP_200_OK)

    @action(detail=True, methods=["post"], url_path="reject-company")
    def reject_company(self, request, pk=None):
        """
        Firma HARD zamietne → stav 'zamietnuty', reason POVINNÝ (len v emaili).
        Maily: iba Študent (service).
        """
        document = self.get_object()
        user = request.user
        prax = document.prax

        resp = _assert(_user_is_firma(user), "Iba firma môže zamietnuť dokument.", status.HTTP_403_FORBIDDEN)
        if resp: return resp

        if hasattr(user, "firma_id"):
            resp = _assert(user.firma_id == getattr(prax, "firma_id", None), "Toto nie je vaša prax.", status.HTTP_403_FORBIDDEN)
            if resp: return resp

        resp = _assert(document.stav_dokumentu in ["nahrany", "potvrdeny"], "Neplatný stav na zamietnutie.")
        if resp: return resp

        reason = (request.data.get("reason") or "").strip()
        resp = _assert(bool(reason), "Pole 'reason' je povinné.")
        if resp: return resp

        document.stav_dokumentu = "zamietnuty"
        document.skontroloval_id = user.id
        document.skontrolovane_at = timezone.now()
        document.save(update_fields=["stav_dokumentu", "skontroloval_id", "skontrolovane_at", "zmenene_at"])

        # 🔔 Notifikácia: company HARD reject (service pošle: študent; reason v emaili)
        notify_document_reviewed(document, approved=False, reason=reason)

        return Response({"detail": "Zamietnuté firmou (hard)."}, status=status.HTTP_200_OK)

    @action(detail=True, methods=["post"], url_path="reject-company-soft")
    def reject_company_soft(self, request, pk=None):
        """
        Firma SOFT zamietne → stav sa NEMENÍ (zostáva 'nahrany'), reason POVINNÝ (len email).
        Maily: Študent (service).
        """
        document = self.get_object()
        user = request.user
        prax = document.prax

        resp = _assert(_user_is_firma(user), "Iba firma môže zamietnuť dokument.", status.HTTP_403_FORBIDDEN)
        if resp: return resp

        if hasattr(user, "firma_id"):
            resp = _assert(user.firma_id == getattr(prax, "firma_id", None), "Toto nie je vaša prax.", status.HTTP_403_FORBIDDEN)
            if resp: return resp

        # v company fáze býva 'nahrany' – soft reject stav NEMENÍME
        resp = _assert(document.stav_dokumentu == "nahrany", "Soft reject je dostupný len pre stav 'nahrany'.")
        if resp: return resp

        reason = (request.data.get("reason") or "").strip()
        resp = _assert(bool(reason), "Pole 'reason' je povinné.")
        if resp: return resp

        # 🔔 Notifikácia: company SOFT reject (service pošle: študent; reason v emaili)
        notify_document_soft_rejected_by_company(document, reason=reason)

        return Response({"detail": "Soft zamietnutie firmou (stav sa nemení)."}, status=status.HTTP_200_OK)

    # --------------------  GARANT APPROVE/REJECT  --------------------
    @action(detail=True, methods=["post"], url_path="approve-garant")
    def approve_garant(self, request, pk=None):
        """
        Garant schváli → stav dokumentu sa NEMENÍ (ostáva 'potvrdeny'), zapisuje sa audit.
        Maily: Študent + Firma (rieši service).
        """
        document = self.get_object()
        user = request.user
        prax = document.prax

        resp = _assert(_user_is_garant(user), "Iba garant môže schváliť dokument.", status.HTTP_403_FORBIDDEN)
        if resp: return resp

        resp = _assert(document.stav_dokumentu == "potvrdeny",
                       "Garant môže schváliť až po schválení firmou (stav 'potvrdeny').")
        if resp: return resp

        document.skontroloval_id = user.id
        document.skontrolovane_at = timezone.now()
        document.save(update_fields=["skontroloval_id", "skontrolovane_at", "zmenene_at"])

        # 🔔 Notifikácia: garant approved (service pošle: študent + firma)
        notify_document_reviewed_by_garant(document)

        return Response({"detail": "Schválené garantom."}, status=status.HTTP_200_OK)

    @action(detail=True, methods=["post"], url_path="reject-garant-soft")
    def reject_garant_soft(self, request, pk=None):
        """
        Garant SOFT zamietne → stav sa NEMENÍ (ostáva 'potvrdeny'), reason POVINNÝ.
        Maily: Študent (service).
        """
        document = self.get_object()
        user = request.user
        prax = document.prax

        resp = _assert(_user_is_garant(user), "Iba garant môže zamietnuť dokument.", status.HTTP_403_FORBIDDEN)
        if resp: return resp

        resp = _assert(document.stav_dokumentu == "potvrdeny",
                       "Soft reject je dostupný až po schválení firmou (stav 'potvrdeny').")
        if resp: return resp

        reason = (request.data.get("reason") or "").strip()
        resp = _assert(bool(reason), "Pole 'reason' je povinné.")
        if resp: return resp

        # stav sa NEMENÍ
        document.skontroloval_id = user.id
        document.skontrolovane_at = timezone.now()
        document.save(update_fields=["skontroloval_id", "skontrolovane_at", "zmenene_at"])

        # 🔔 Notifikácia: garant SOFT reject (service pošle: študent; reason v emaili)
        notify_document_soft_rejected_by_garant(document, reason=reason)

        return Response({"detail": "Soft zamietnutie garantom (stav sa nemení)."}, status=status.HTTP_200_OK)

    @action(detail=True, methods=["post"], url_path="reject-garant-hard")
    def reject_garant_hard(self, request, pk=None):
        """
        Garant HARD zamietne → stav 'zamietnuty', reason POVINNÝ.
        Maily: Študent + Firma (service).
        """
        document = self.get_object()
        user = request.user
        prax = document.prax

        resp = _assert(_user_is_garant(user), "Iba garant môže zamietnuť dokument.", status.HTTP_403_FORBIDDEN)
        if resp: return resp

        resp = _assert(document.stav_dokumentu in ["nahrany", "potvrdeny"], "Neplatný stav na zamietnutie.")
        if resp: return resp

        reason = (request.data.get("reason") or "").strip()
        resp = _assert(bool(reason), "Pole 'reason' je povinné.")
        if resp: return resp

        document.stav_dokumentu = "zamietnuty"
        document.skontroloval_id = user.id
        document.skontrolovane_at = timezone.now()
        document.save(update_fields=["stav_dokumentu", "skontroloval_id", "skontrolovane_at", "zmenene_at"])

        # 🔔 Notifikácia: garant HARD reject (service pošle: študent + firma; reason v emaili)
        notify_document_hard_rejected_by_garant(document, reason=reason)

        return Response({"detail": "Hard zamietnutie garantom."}, status=status.HTTP_200_OK)

    # ---------------------------  DOWNLOAD  --------------------------
    @action(detail=True, methods=["get"], url_path="download")
    def download(self, request, pk=None):
        """
        Vráti presigned URL (GET) pre oprávnených:
        - študent danej praxe
        - firma danej praxe
        - garant praxe
        """
        document = self.get_object()
        prax = document.prax
        user = request.user

        allowed = (
            (_user_is_student(user) and prax and prax.student_id == user.id) or
            (_user_is_firma(user) and hasattr(user, "firma_id") and user.firma_id == getattr(prax, "firma_id", None)) or
            (_user_is_garant(user) and prax and getattr(prax, "garant_id", None) == user.id)
        )

        resp = _assert(allowed, "Nemáš oprávnenie stiahnuť tento dokument.", status.HTTP_403_FORBIDDEN)
        if resp: return resp

        resp = _assert(bool(document.subor_url), "Dokument zatiaľ nemá nahratý súbor.")
        if resp: return resp

        url = generate_presigned_url(document.subor_url)
        return Response({"url": url}, status=status.HTTP_200_OK)

    # -----------------------  EXISTUJÚCE: PDF  -----------------------
    @action(detail=True, methods=["get"], url_path="generate_dohoda")
    def generate_dohoda(self, request, pk=None):
        try:
            document = self.get_object()
            if not document.prax_id:
                return Response({"detail": "Dokument nemá priradenú prax."}, status=status.HTTP_400_BAD_REQUEST)

            prax = Prax.objects.select_related("firma", "student", "garant").get(id=document.prax_id)

            user = request.user
            if getattr(user, "rola", None) != "student":
                return Response({"detail": "Iba študent môže generovať PDF dokument."},
                                status=status.HTTP_403_FORBIDDEN)
            if prax.student_id != user.id:
                return Response({"detail": "Nemáš oprávnenie generovať dokument pre túto prax."},
                                status=status.HTTP_403_FORBIDDEN)

            if prax.stav.lower() not in ["vytvorena", "potvrdena"]:
                return Response({"detail": f"PDF možno generovať len pre prax v stave 'vytvorena' alebo 'potvrdena'. "
                                           f"Aktuálny stav: {prax.stav}"},
                                status=status.HTTP_400_BAD_REQUEST)

            pdf_buffer, relative_path = generate_dohoda_pdf(prax)
            document.subor_url = relative_path
            document.stav_dokumentu = "potvrdeny"
            document.save(update_fields=["subor_url", "stav_dokumentu"])
            pdf_buffer.seek(0)

            return FileResponse(
                pdf_buffer,
                as_attachment=True,
                filename=f"Dohoda_praxe_{prax.id}.pdf",
                content_type="application/pdf",
            )

        except Prax.DoesNotExist:
            return Response({"detail": "Súvisiaca prax neexistuje."}, status=status.HTTP_404_NOT_FOUND)
        except Dokument.DoesNotExist:
            return Response({"detail": "Dokument neexistuje."}, status=status.HTTP_404_NOT_FOUND)
        except FileNotFoundError as e:
            return Response({"detail": f"Šablóna PDF sa nenašla: {str(e)}"},
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        except Exception as e:
            return Response({"detail": f"❌ Chyba pri generovaní PDF: {str(e)}"},
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR)
