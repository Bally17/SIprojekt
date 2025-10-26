from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.http import FileResponse
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

    @action(detail=True, methods=['get'], url_path='generate_dohoda')
    def generate_dohoda(self, request, pk=None):
        try:
            # 1️⃣ Získaj dokument a súvisiacu prax
            document = self.get_object()
            prax = Prax.objects.get(id=document.prax_id)

            # 2️⃣ Over, že používateľ je študent a vlastní danú prax
            user = request.user
            if getattr(user, "rola", None) != "student":
                return Response(
                    {"detail": "Iba študent môže generovať dokument."},
                    status=status.HTTP_403_FORBIDDEN
                )

            if prax.student_id != user.id:
                return Response(
                    {"detail": "Nemáš oprávnenie pre túto prax."},
                    status=status.HTTP_403_FORBIDDEN
                )

            # 3️⃣ Povolené len ak je prax v stave 'vytvorena'
            if prax.stav != "vytvorena":
                return Response(
                    {"detail": "PDF možno generovať len pre prax v stave 'vytvorena'."},
                    status=status.HTTP_403_FORBIDDEN
                )

            # 4️⃣ Vygeneruj PDF
            pdf_buffer, relative_path = generate_dohoda_pdf(prax)

            # 5️⃣ Ulož informácie o dokumente
            document.subor_url = relative_path
            document.stav_dokumentu = "potvrdeny"
            document.save()

            # 6️⃣ Vráť PDF ako prílohu na stiahnutie
            return FileResponse(
                pdf_buffer,
                as_attachment=True,
                filename=f"Dohoda_praxe_{prax.id}.pdf",
                content_type="application/pdf"
            )

        except Prax.DoesNotExist:
            return Response(
                {"detail": "Prax neexistuje."},
                status=status.HTTP_404_NOT_FOUND
            )

        except Exception as e:
            return Response(
                {"detail": f"Chyba pri generovaní PDF: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
