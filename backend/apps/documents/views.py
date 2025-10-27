from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.http import FileResponse
from django.conf import settings
import os

from apps.internships.models import Prax
from .models import Dokument
from .serializers import DocumentSerializer
from .utils.pdf_generator import generate_dohoda_pdf


class DocumentViewSet(viewsets.ModelViewSet):
    """
    ViewSet pre správu dokumentov.
    Obsahuje akciu na generovanie PDF 'Dohoda o odbornej praxi'.
    """
    queryset = Dokument.objects.all()
    serializer_class = DocumentSerializer
    permission_classes = [IsAuthenticated]

    @action(detail=True, methods=["get"], url_path="generate_dohoda")
    def generate_dohoda(self, request, pk=None):
        try:
            # 1️⃣ Načítaj dokument a jeho prax
            document = self.get_object()
            if not document.prax_id:
                return Response(
                    {"detail": "Dokument nemá priradenú prax."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            prax = Prax.objects.select_related("firma", "student", "garant").get(id=document.prax_id)

            # 2️⃣ Over oprávnenia
            user = request.user
            if getattr(user, "rola", None) != "student":
                return Response(
                    {"detail": "Iba študent môže generovať PDF dokument."},
                    status=status.HTTP_403_FORBIDDEN,
                )

            if prax.student_id != user.id:
                return Response(
                    {"detail": "Nemáš oprávnenie generovať dokument pre túto prax."},
                    status=status.HTTP_403_FORBIDDEN,
                )

            # 3️⃣ Povolené pre tieto stavy (možno rozšíriť)
            if prax.stav.lower() not in ["vytvorena", "potvrdena"]:
                return Response(
                    {"detail": f"PDF možno generovať len pre prax v stave 'vytvorena' alebo 'potvrdena'. Aktuálny stav: {prax.stav}"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # 4️⃣ Generovanie PDF
            pdf_buffer, relative_path = generate_dohoda_pdf(prax)

            # 5️⃣ Uloženie informácií o dokumente
            document.subor_url = relative_path
            document.stav_dokumentu = "potvrdeny"
            document.save(update_fields=["subor_url", "stav_dokumentu"])

            # 6️⃣ Návrat PDF
            pdf_buffer.seek(0)

            return FileResponse(
                pdf_buffer,
                as_attachment=True,
                filename=f"Dohoda_praxe_{prax.id}.pdf",
                content_type="application/pdf",
            )

        except Prax.DoesNotExist:
            return Response(
                {"detail": "Súvisiaca prax neexistuje."},
                status=status.HTTP_404_NOT_FOUND,
            )

        except Dokument.DoesNotExist:
            return Response(
                {"detail": "Dokument neexistuje."},
                status=status.HTTP_404_NOT_FOUND,
            )

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
