from django.conf import settings
from django.core.mail import send_mail
from django.core.signing import BadSignature
from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle

from apps.users.models import User

from ..serializers import CompanyRegistrationSerializer, StudentRegistrationSerializer
from ..utils import generate_random_password, send_activation_email
from .helpers import signer, generate_password


class StudentRegistrationView(generics.CreateAPIView):
    serializer_class = StudentRegistrationSerializer
    permission_classes = [AllowAny]
    throttle_scope = "registration"
    throttle_classes = [ScopedRateThrottle]

    def send_activation_email(self, user, password):
        """Odošle aktivačný email so zahashovaným tokenom"""
        token = signer.sign(user.email)
        activation_link = f"{settings.FRONTEND_URL}/auth/activate/{token}/"

        subject = "Aktivácia účtu – Študentská prax"
        message = f"""
Dobrý deň {user.meno},

váš účet bol úspešne vytvorený.

Pre aktiváciu účtu kliknite na tento odkaz:
{activation_link}

Prihlasovacie údaje:
Email: {user.email}
Heslo: {password}

Po aktivácii sa, prosím, prihláste a zmeňte heslo.

S pozdravom,
Tím Študentskej praxe
"""
        send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [user.email])

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        generated_password = generate_password()
        serializer.validated_data["password"] = generated_password
        serializer.validated_data["password_confirm"] = generated_password

        user = serializer.save()
        user.aktivny = False
        user.email_overeny = False
        user.save()

        self.send_activation_email(user, generated_password)

        return Response(
            {
                "message": "Študent bol úspešne zaregistrovaný. Aktivačný email bol odoslaný.",
                "user_id": user.id,
                "email": user.email,
            },
            status=status.HTTP_201_CREATED,
        )


class CompanyRegistrationView(generics.CreateAPIView):
    serializer_class = CompanyRegistrationSerializer
    permission_classes = [AllowAny]
    throttle_scope = "registration"
    throttle_classes = [ScopedRateThrottle]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        generated_password = generate_random_password()
        user = serializer.save(password=generated_password)
        user.musi_zmenit_heslo = True
        user.save(update_fields=["musi_zmenit_heslo"])

        send_activation_email(user, generated_password)

        return Response(
            {
                "message": "Firma bola úspešne zaregistrovaná. Aktivačný email s údajmi bol odoslaný.",
                "user_id": user.id,
                "email": user.email,
                "status": "neaktívny - vyžaduje aktiváciu",
            },
            status=status.HTTP_201_CREATED,
        )


@api_view(["GET"])
@permission_classes([AllowAny])
def activate_account(request, token):
    """Aktivácia účtu cez token"""
    try:
        email = signer.unsign(token)
        user = User.objects.get(email=email)
        user.aktivny = True
        user.email_overeny = True
        user.save()
        return Response({"message": "Účet bol úspešne aktivovaný."}, status=200)
    except (User.DoesNotExist, BadSignature):
        return Response({"error": "Neplatný alebo expirovaný odkaz."}, status=400)
