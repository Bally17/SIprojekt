from django.http import FileResponse
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.internships.models import Prax
from apps.users.models import User

from ..models import Dokument
from ..utils.pdf_generator import generate_dohoda_pdf


class PdfGenerationMixin:
    # -----------------------  EXISTUJÚCE: PDF  -----------------------
    @action(detail=True, methods=["get"], url_path="generate_dohoda")
    def generate_dohoda(self, request, pk=None):
        """Študent vygeneruje PDF dohodu pre prax v stave vytvorena/potvrdena."""
        try:
            document = self.get_object()
            if not document.prax_id:
                return Response({"detail": "Dokument nemá priradenú prax."}, status=status.HTTP_400_BAD_REQUEST)

            prax = Prax.objects.select_related("firma", "student", "garant").get(id=document.prax_id)

            user = request.user
            if getattr(user, "rola", None) != User.ROLE_STUDENT:
                return Response(
                    {"detail": "Iba študent môže generovať PDF dokument."},
                    status=status.HTTP_403_FORBIDDEN,
                )
            if prax.student_id != user.id:
                return Response(
                    {"detail": "Nemáš oprávnenie generovať dokument pre túto prax."},
                    status=status.HTTP_403_FORBIDDEN,
                )

            if prax.stav.lower() not in [Prax.STAV_VYTVORENA, Prax.STAV_POTVRDENA]:
                return Response(
                    {
                        "detail": "PDF možno generovať len pre prax v stave 'vytvorena' alebo 'potvrdena'. "
                        f"Aktuálny stav: {prax.stav}"
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            pdf_buffer, relative_path = generate_dohoda_pdf(prax)
            document.subor_url = relative_path
            document.stav_dokumentu = Dokument.STAV_POTVRDENY
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
            return Response(
                {"detail": f"Šablóna PDF sa nenašla: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
        except Exception as e:
            return Response(
                {"detail": f"❌ Chyba pri generovaní PDF: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
