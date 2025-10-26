from rest_framework import status, generics
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.contrib.auth import authenticate
from apps.users.models import User
from django.conf import settings
from django.utils import timezone
from datetime import timedelta
import requests
import json

from .serializers import (
    LoginSerializer,
    GoogleAuthSerializer,
    GitHubAuthSerializer,
    StudentRegistrationSerializer,
    CompanyRegistrationSerializer,
    PasswordResetRequestSerializer,
    PasswordResetConfirmSerializer,
)
from .oauth_serializers import OAuthAuthorizeSerializer, OAuthTokenSerializer
from .models import OAuthClient, AuthorizationCode
from .utils import (
    generate_random_password,
    send_password_email,
    send_activation_email,
    send_password_reset_email,
)

# Custom Rate Limiting
from django.core.cache import cache

from django.core.signing import Signer, TimestampSigner, BadSignature, SignatureExpired
from django.core.mail import send_mail
import secrets
import string

signer = Signer()
password_reset_signer = TimestampSigner()
PASSWORD_RESET_TOKEN_MAX_AGE = 3600  # seconds

class StudentRegistrationView(generics.CreateAPIView):
    serializer_class = StudentRegistrationSerializer
    permission_classes = [AllowAny]

    def generate_password(self, length=10):
        """Vygeneruje náhodné heslo"""
        chars = string.ascii_letters + string.digits + "!@#$%^&*()"
        return ''.join(secrets.choice(chars) for _ in range(length))

    def send_activation_email(self, user, password):
        """Odošle aktivačný email so zahashovaným tokenom"""
        token = signer.sign(user.email)
        activation_link = f"{settings.FRONTEND_URL}/activate/{token}/"

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

        # 🔑 Generovanie hesla
        generated_password = self.generate_password()
        serializer.validated_data['password'] = generated_password
        serializer.validated_data['password_confirm'] = generated_password

        user = serializer.save()
        user.aktivny = False
        user.email_overeny = False
        user.save()

        # ✉️ Odoslanie emailu s heslom a aktivačným linkom
        self.send_activation_email(user, generated_password)

        return Response({
            "message": "Študent bol úspešne zaregistrovaný. Aktivačný email bol odoslaný.",
            "user_id": user.id,
            "email": user.email
        }, status=status.HTTP_201_CREATED)


# Company Registration View  
class CompanyRegistrationView(generics.CreateAPIView):
    serializer_class = CompanyRegistrationSerializer
    permission_classes = [AllowAny]
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

    # Po úspešnej registrácii odošli aktivačný e-mail
        send_activation_email(user)

        return Response({
            "message": "Firma bola úspešne zaregistrovaná. Aktivačný odkaz bol odoslaný na email.",
            "user_id": user.id,
            "email": user.email,
            "status": "neaktívny - vyžaduje aktiváciu"
        }, status=status.HTTP_201_CREATED)

# Password reset request, spracuje mail, vygeneruje token, pošle reset link
@api_view(['POST'])
@permission_classes([AllowAny])
def password_reset_request(request):
    """Prijme email a odošle reset link, ak používateľ existuje."""
    serializer = PasswordResetRequestSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    email = serializer.validated_data['email'].lower()
    user = User.objects.filter(email__iexact=email).first()

    if user:
        token = password_reset_signer.sign(user.email)
        reset_link = f"{settings.FRONTEND_URL}/reset-password/{token}/"
        send_password_reset_email(user, reset_link)

    return Response({
        "message": "Ak účet existuje, poslali sme resetovací odkaz na email."
    }, status=status.HTTP_200_OK)

# Posle nový password + token, ovrí ho a zemní heslo v databze
@api_view(['POST'])
@permission_classes([AllowAny])
def password_reset_confirm(request):
    """Overí token a nastaví nové heslo."""
    serializer = PasswordResetConfirmSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    token = serializer.validated_data['token']

    try:
        email = password_reset_signer.unsign(token, max_age=PASSWORD_RESET_TOKEN_MAX_AGE)
    except SignatureExpired:
        return Response({"error": "Resetovací odkaz expiroval."}, status=status.HTTP_400_BAD_REQUEST)
    except BadSignature:
        return Response({"error": "Resetovací odkaz je neplatný."}, status=status.HTTP_400_BAD_REQUEST)

    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        return Response({"error": "Resetovací odkaz je neplatný."}, status=status.HTTP_400_BAD_REQUEST)

    new_password = serializer.validated_data['new_password']
    user.set_password(new_password)
    user.musi_zmenit_heslo = False
    user.save()

    return Response({"message": "Heslo bolo úspešne zresetované."}, status=status.HTTP_200_OK)


def custom_rate_limit(key, limit=10, window=60):
    """Simple custom rate limiting using Django cache"""
    count = cache.get(key, 0)
    if count >= limit:
        return True
    cache.set(key, count + 1, window)
    return False

def oauth_rate_limit_check(request, endpoint_type):
    """Rate limiting check for OAuth endpoints"""
    client_id = request.data.get('client_id') if request.method == 'POST' else request.GET.get('client_id')
    ip = request.META.get('REMOTE_ADDR', 'unknown')
    
    if endpoint_type == 'authorize':
        # Limit: 20 requests per minute per client, 100 per IP
        if client_id and custom_rate_limit(f"oauth_auth_client_{client_id}", 20, 60):
            return True
        if custom_rate_limit(f"oauth_auth_ip_{ip}", 100, 60):
            return True
            
    elif endpoint_type == 'token':
        # Limit: 10 requests per minute per client, 50 per IP  
        if client_id and custom_rate_limit(f"oauth_token_client_{client_id}", 10, 60):
            return True
        if custom_rate_limit(f"oauth_token_ip_{ip}", 50, 60):
            return True
            
    return False

def get_tokens_for_user(user):
    """Generate JWT tokens for user"""
    from rest_framework_simplejwt.tokens import RefreshToken
    
    refresh = RefreshToken.for_user(user)
    return {
        'refresh': str(refresh),
        'access': str(refresh.access_token),
    }

def create_or_update_oauth_user(email, first_name, last_name, avatar, provider):
    """Create or update user from OAuth provider"""
    try:
        user = User.objects.get(email=email)
        # Aktualizujeme základné údaje
        if first_name and not user.meno:
            user.meno = first_name
        if last_name and not user.priezvisko:
            user.priezvisko = last_name
        user.save()
        created = False
    except User.DoesNotExist:
        # Create new user - pre OAuth vytvoríme štandardného používateľa
        user = User.objects.create_user(
            email=email,
            password=None,  # OAuth users don't need password
            rola='student',  # Default role pre OAuth
            meno=first_name,
            priezvisko=last_name,
            musi_zmenit_heslo=False  # OAuth users don't need to change password
        )
        created = True
    
    return user, created

def get_user_data(user):
    """Get user data for response"""
    return {
        'id': user.id,
        'email': user.email,
        'meno': user.meno,
        'priezvisko': user.priezvisko,
        'rola': user.rola,
        'telefon': user.telefon,
        'adresa': user.adresa,
        'aktivny': user.aktivny,
        'vytvorene_at': user.vytvorene_at.isoformat() if user.vytvorene_at else None,
        'firma_id': user.firma_id,
    }

# ... zvyšok tvojho pôvodného kódu (login_view, google_auth, github_auth, atď.) ...

def handle_github_access_token(access_token):
    """Process GitHub access token"""
    try:
        # Get user info from GitHub
        user_response = requests.get(
            'https://api.github.com/user',
            headers={'Authorization': f'Bearer {access_token}'},
            timeout=10
        )
        
        print(f"🔧 GITHUB USER RESPONSE STATUS: {user_response.status_code}")
        
        if user_response.status_code != 200:
            return Response(
                {'error': 'Failed to get user info from GitHub'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        user_data = user_response.json()
        print(f"🔧 GITHUB USER DATA: {user_data}")
        
        # Get email from GitHub
        email_response = requests.get(
            'https://api.github.com/user/emails',
            headers={'Authorization': f'Bearer {access_token}'},
            timeout=10
        )
        
        if email_response.status_code == 200:
            emails = email_response.json()
            primary_email = next((email['email'] for email in emails if email['primary']), None)
            email = primary_email or user_data.get('email')
        else:
            email = user_data.get('email')
        
        print(f"🔧 USER EMAIL: {email}")
        
        if not email:
            return Response(
                {'error': 'Email not provided by GitHub'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        first_name = user_data.get('name', '').split(' ')[0] if user_data.get('name') else ''
        last_name = ' '.join(user_data.get('name', '').split(' ')[1:]) if user_data.get('name') else ''
        avatar = user_data.get('avatar_url')
        
        # Create or update user
        user, created = create_or_update_oauth_user(
            email=email,
            first_name=first_name,
            last_name=last_name,
            avatar=avatar,
            provider='github'
        )
        
        print(f"🔧 USER {'CREATED' if created else 'UPDATED'}: {user.email}")
        
        # Generate tokens
        tokens = get_tokens_for_user(user)
        
        # Get user data
        user_serialized = get_user_data(user)
        
        response_data = {
            'status': 'success',
            'created': created,
            'user': user_serialized,
            'tokens': tokens
        }
        
        print(f"🎉 GITHUB OAUTH SUCCESSFUL!")
        return Response(response_data, status=status.HTTP_200_OK)
        
    except requests.RequestException as e:
        print(f"❌ GITHUB REQUEST EXCEPTION: {e}")
        return Response(
            {'error': 'Failed to verify GitHub token'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

def handle_github_code(code, code_verifier=None):
    """Exchange GitHub code for access token (PKCE flow)"""
    try:
        # Exchange code for access token
        token_data = {
            'client_id': settings.SOCIALACCOUNT_PROVIDERS['github']['APP']['client_id'],
            'client_secret': settings.SOCIALACCOUNT_PROVIDERS['github']['APP']['secret'],
            'code': code,
            'redirect_uri': 'http://localhost:8000/api/auth/github/callback/'
        }
        
        # Add code_verifier if provided (PKCE)
        if code_verifier:
            token_data['code_verifier'] = code_verifier
        
        token_response = requests.post(
            'https://github.com/login/oauth/access_token',
            headers={
                'Accept': 'application/json',
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            data=token_data,
            timeout=10
        )
        
        print(f"🔧 GITHUB TOKEN RESPONSE STATUS: {token_response.status_code}")
        print(f"🔧 GITHUB TOKEN RESPONSE TEXT: {token_response.text}")
        
        if token_response.status_code != 200:
            return Response(
                {'error': f'GitHub returned status {token_response.status_code}'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        token_json = token_response.json()
        print(f"🔧 GITHUB TOKEN DATA: {token_json}")
        
        access_token = token_json.get('access_token')
        
        if not access_token:
            error_msg = token_json.get('error_description', 'Failed to get access token from GitHub')
            print(f"❌ GITHUB ERROR: {error_msg}")
            return Response(
                {'error': error_msg}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        print(f"🔧 GITHUB ACCESS TOKEN: {access_token[:30]}...")
        
        # Continue with access token
        return handle_github_access_token(access_token)
        
    except requests.RequestException as e:
        print(f"❌ GITHUB TOKEN REQUEST EXCEPTION: {e}")
        return Response(
            {'error': 'Failed to exchange code for token'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    """Normal email/password login"""
    serializer = LoginSerializer(data=request.data)
    
    if serializer.is_valid():
        user = serializer.validated_data['user']
        
        # Generate tokens
        tokens = get_tokens_for_user(user)
        
        # Get user data
        user_data = get_user_data(user)
        
        response_data = {
            'status': 'success',
            'created': False,  # Always False for normal login
            'user': user_data,
            'tokens': tokens
        }
        
        return Response(response_data, status=status.HTTP_200_OK)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([AllowAny])
def google_auth(request):
    """Google OAuth authentication"""
    serializer = GoogleAuthSerializer(data=request.data)
    
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    access_token = serializer.validated_data['access_token']
    
    try:
        # Verify token with Google
        google_response = requests.get(
            'https://www.googleapis.com/oauth2/v3/userinfo',
            headers={'Authorization': f'Bearer {access_token}'}
        )
        
        if google_response.status_code != 200:
            return Response(
                {'error': 'Invalid Google token'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        google_data = google_response.json()
        
        # Extract user data from Google response
        email = google_data.get('email')
        first_name = google_data.get('given_name', '')
        last_name = google_data.get('family_name', '')
        avatar = google_data.get('picture')
        
        if not email:
            return Response(
                {'error': 'Email not provided by Google'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create or update user
        user, created = create_or_update_oauth_user(
            email=email,
            first_name=first_name,
            last_name=last_name,
            avatar=avatar,
            provider='google'
        )
        
        # Generate tokens
        tokens = get_tokens_for_user(user)
        
        # Get user data
        user_data = get_user_data(user)
        
        response_data = {
            'status': 'success',
            'created': created,
            'user': user_data,
            'tokens': tokens
        }
        
        return Response(response_data, status=status.HTTP_200_OK)
        
    except requests.RequestException as e:
        return Response(
            {'error': 'Failed to verify Google token'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
@permission_classes([AllowAny])
def github_auth(request):
    """GitHub OAuth authentication - podpora pre PKCE a access_token"""
    print(f"🔧 GITHUB AUTH REQUEST DATA: {request.data}")
    
    # Podpora pre access_token (jednoduchšie) aj code (PKCE)
    if 'access_token' in request.data:
        # Priamy access_token flow
        access_token = request.data['access_token']
        print(f"🔧 USING ACCESS_TOKEN: {access_token[:30]}...")
        return handle_github_access_token(access_token)
        
    elif 'code' in request.data:
        # PKCE flow - musíme vymeniť code za access_token
        code = request.data['code']
        code_verifier = request.data.get('code_verifier')
        print(f"🔧 USING CODE: {code}")
        print(f"🔧 CODE VERIFIER: {code_verifier}")
        return handle_github_code(code, code_verifier)
        
    else:
        return Response(
            {'error': 'Must provide either "code" or "access_token"'}, 
            status=status.HTTP_400_BAD_REQUEST
        )

@api_view(['GET'])
@permission_classes([AllowAny])
def github_callback(request):
    """GitHub OAuth callback handler"""
    code = request.GET.get('code')
    state = request.GET.get('state')
    
    print(f"🔧 GITHUB CALLBACK - code: {code}, state: {state}")
    
    if not code:
        return Response({'error': 'No code provided'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        # Exchange code for access token
        token_response = requests.post(
            'https://github.com/login/oauth/access_token',
            headers={'Accept': 'application/json'},
            data={
                'client_id': settings.SOCIALACCOUNT_PROVIDERS['github']['APP']['client_id'],
                'client_secret': settings.SOCIALACCOUNT_PROVIDERS['github']['APP']['secret'],
                'code': code,
                'redirect_uri': 'http://localhost:8000/api/auth/github/callback/'
            }
        )
        
        token_data = token_response.json()
        access_token = token_data.get('access_token')
        
        if not access_token:
            return Response(
                {'error': 'Failed to get access token from GitHub'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get user info from GitHub
        user_response = requests.get(
            'https://api.github.com/user',
            headers={'Authorization': f'Bearer {access_token}'}
        )
        
        user_data = user_response.json()
        
        # Get email from GitHub
        email_response = requests.get(
            'https://api.github.com/user/emails',
            headers={'Authorization': f'Bearer {access_token}'}
        )
        
        emails = email_response.json()
        primary_email = next((email['email'] for email in emails if email['primary']), None)
        
        email = primary_email or user_data.get('email')
        first_name = user_data.get('name', '').split(' ')[0] if user_data.get('name') else ''
        last_name = ' '.join(user_data.get('name', '').split(' ')[1:]) if user_data.get('name') else ''
        avatar = user_data.get('avatar_url')
        
        if not email:
            return Response(
                {'error': 'Email not provided by GitHub'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create or update user
        user, created = create_or_update_oauth_user(
            email=email,
            first_name=first_name,
            last_name=last_name,
            avatar=avatar,
            provider='github'
        )
        
        # Generate tokens
        tokens = get_tokens_for_user(user)
        
        # Get user data
        user_serialized = get_user_data(user)
        
        response_data = {
            'status': 'success',
            'created': created,
            'user': user_serialized,
            'tokens': tokens
        }
        
        return Response(response_data, status=status.HTTP_200_OK)
        
    except requests.RequestException as e:
        return Response(
            {'error': 'Failed to verify GitHub token'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def profile(request):
    """Get user profile"""
    user_data = get_user_data(request.user)
    return Response({'user': user_data})

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_view(request):
    """Logout user"""
    return Response({'status': 'success'})

# OAuth Server Endpoints s CUSTOM RATE LIMITINGOM
@api_view(['GET'])
@permission_classes([AllowAny])
def oauth_authorize(request):
    """
    OAuth 2.0 Authorization Endpoint
    GET /oauth/authorize?client_id=xxx&redirect_uri=xxx&response_type=code&state=xxx
    """
    # Custom rate limiting check
    if oauth_rate_limit_check(request, 'authorize'):
        return Response({
            'error': 'rate_limit_exceeded',
            'error_description': 'Too many authorization requests. Please try again later.'
        }, status=429)
    
    serializer = OAuthAuthorizeSerializer(data=request.GET)
    
    if not serializer.is_valid():
        return Response({'error': 'invalid_request', 'error_description': serializer.errors}, status=400)
    
    validated_data = serializer.validated_data
    client_id = validated_data['client_id']
    redirect_uri = validated_data['redirect_uri']
    response_type = validated_data['response_type']
    state = validated_data.get('state', '')
    scope = validated_data.get('scope', 'read profile')
    
    # Validácia clienta
    try:
        client = OAuthClient.objects.get(client_id=client_id, is_active=True)
        allowed_uris = client.get_redirect_uris_list()
        if redirect_uri not in allowed_uris:
            return Response({'error': 'invalid_request', 'error_description': 'Invalid redirect_uri'}, status=400)
    except OAuthClient.DoesNotExist:
        return Response({'error': 'invalid_client', 'error_description': 'Invalid client'}, status=400)
    
    # Ak užívateľ nie je prihlásený, vráť chybu (frontend ho musí najprv prihlásiť)
    if not request.user.is_authenticated:
        return Response({
            'error': 'authentication_required',
            'message': 'User must be authenticated first'
        }, status=401)
    
    # Vytvor authorization code
    auth_code = AuthorizationCode.objects.create(
        code=AuthorizationCode.generate_code(),
        user=request.user,
        client=client,
        redirect_uri=redirect_uri,
        scope=scope,
        expires_at=timezone.now() + timedelta(minutes=10)
    )
    
    # Presmeruj späť na client s code
    from urllib.parse import urlencode
    params = {
        'code': auth_code.code,
        'state': state
    }
    redirect_url = f"{redirect_uri}?{urlencode(params)}"
    
    return Response({
        'redirect_url': redirect_url,
        'code': auth_code.code,
        'state': state
    })

@api_view(['POST'])
@permission_classes([AllowAny])
def oauth_token(request):
    """
    OAuth 2.0 Token Endpoint
    POST /oauth/token
    """
    # Custom rate limiting check
    if oauth_rate_limit_check(request, 'token'):
        return Response({
            'error': 'rate_limit_exceeded',
            'error_description': 'Too many token requests. Please try again later.'
        }, status=429)
    
    serializer = OAuthTokenSerializer(data=request.data)
    
    if not serializer.is_valid():
        return Response({'error': 'invalid_request', 'error_description': serializer.errors}, status=400)
    
    validated_data = serializer.validated_data
    grant_type = validated_data['grant_type']
    client_id = validated_data['client_id']
    client_secret = validated_data['client_secret']
    code = validated_data.get('code')
    redirect_uri = validated_data.get('redirect_uri')
    
    # Validácia client credentials
    try:
        client = OAuthClient.objects.get(client_id=client_id, is_active=True)
        if client.client_secret != client_secret:
            return Response({'error': 'invalid_client'}, status=401)
    except OAuthClient.DoesNotExist:
        return Response({'error': 'invalid_client'}, status=401)
    
    if grant_type == 'authorization_code':
        # Validácia authorization code
        try:
            auth_code = AuthorizationCode.objects.get(
                code=code, 
                client=client,
                used=False
            )
            
            if not auth_code.is_valid():
                return Response({'error': 'invalid_grant'}, status=400)
                
            if auth_code.redirect_uri != redirect_uri:
                return Response({'error': 'invalid_grant'}, status=400)
                
        except AuthorizationCode.DoesNotExist:
            return Response({'error': 'invalid_grant'}, status=400)
        
        # Označ code ako použitý
        auth_code.used = True
        auth_code.save()
        
        # Generovanie tokenov (použij tvoj existujúci systém)
        tokens = get_tokens_for_user(auth_code.user)
        
        return Response({
            'access_token': tokens['access'],
            'token_type': 'Bearer',
            'expires_in': 3600,  # 1 hour
            'refresh_token': tokens['refresh'],
            'scope': auth_code.scope
        })
    
    elif grant_type == 'refresh_token':
        # TODO: Implement refresh token flow
        return Response({'error': 'refresh_token_not_implemented'}, status=400)
    
    return Response({'error': 'unsupported_grant_type'}, status=400)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def oauth_userinfo(request):
    """
    OAuth 2.0 UserInfo Endpoint
    """
    user_data = get_user_data(request.user)
    return Response(user_data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def oauth_clients(request):
    """
    Get user's OAuth clients (pre admina)
    """
    clients = OAuthClient.objects.filter(is_active=True)
    data = []
    for client in clients:
        data.append({
            'client_id': client.client_id,
            'name': client.name,
            'redirect_uris': client.get_redirect_uris_list(),
            'scope': client.scope
        })
    return Response(data)

@api_view(['GET'])
@permission_classes([AllowAny])
def activate_account(request, token):
    """Aktivácia účtu cez token"""
    from django.core.signing import BadSignature

    try:
        email = signer.unsign(token)
        user = User.objects.get(email=email)
        user.aktivny = True
        user.email_overeny = True
        user.save()
        return Response({"message": "Účet bol úspešne aktivovaný."}, status=200)
    except (User.DoesNotExist, BadSignature):
        return Response({"error": "Neplatný alebo expirovaný odkaz."}, status=400)
