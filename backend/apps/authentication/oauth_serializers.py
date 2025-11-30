# backend/apps/authentication/oauth_serializers.py
from rest_framework import serializers
from django.core.validators import URLValidator
from django.core.exceptions import ValidationError
from apps.authentication.models import OAuthClient
from apps.users.models import User

class OAuthAuthorizeSerializer(serializers.Serializer):
    client_id = serializers.CharField(required=True, max_length=100)
    redirect_uri = serializers.CharField(required=True, max_length=300)
    response_type = serializers.CharField(required=True, max_length=20)
    state = serializers.CharField(required=False, max_length=100, allow_blank=True)
    scope = serializers.CharField(required=False, max_length=200, default='read profile')
    code_challenge = serializers.CharField(required=False, max_length=128, allow_blank=True)
    code_challenge_method = serializers.CharField(required=False, max_length=10, allow_blank=True)
    
    def validate_response_type(self, value):
        if value != 'code':
            raise serializers.ValidationError('Unsupported response_type. Only "code" is supported.')
        return value
    
    def validate_redirect_uri(self, value):
        # Basic URL validation
        validator = URLValidator()
        try:
            validator(value)
        except ValidationError:
            raise serializers.ValidationError('Invalid redirect_uri format.')
        return value
    
    def validate_scope(self, value):
        allowed_scopes = ['read', 'profile', 'email']
        scopes = value.split()
        
        for scope in scopes:
            if scope not in allowed_scopes:
                raise serializers.ValidationError(f'Invalid scope: {scope}. Allowed: {allowed_scopes}')
        
        return value

    def validate(self, data):
        method = data.get('code_challenge_method') or 'plain'
        if data.get('code_challenge') and method not in ('plain', 'S256'):
            raise serializers.ValidationError({'code_challenge_method': 'Only plain or S256 are supported'})
        data['code_challenge_method'] = method
        return data


class OAuthTokenSerializer(serializers.Serializer):
    grant_type = serializers.CharField(required=True, max_length=50)
    client_id = serializers.CharField(required=True, max_length=100)
    client_secret = serializers.CharField(required=False, max_length=100, allow_blank=True)
    client_assertion_type = serializers.CharField(required=False, allow_blank=True, max_length=255)
    client_assertion = serializers.CharField(required=False, allow_blank=True)
    code = serializers.CharField(required=False, max_length=100)
    redirect_uri = serializers.CharField(required=False, max_length=300)
    refresh_token = serializers.CharField(required=False, max_length=255)
    username = serializers.CharField(required=False, max_length=255)
    password = serializers.CharField(required=False, max_length=255)
    code_verifier = serializers.CharField(required=False, max_length=128)
    
    def validate_grant_type(self, value):
        allowed_grants = ['authorization_code', 'refresh_token', 'password', 'client_credentials']
        if value not in allowed_grants:
            raise serializers.ValidationError(f'Unsupported grant_type. Allowed: {allowed_grants}')
        return value
    
    def validate(self, data):
        grant_type = data.get('grant_type')
        
        if grant_type == 'authorization_code':
            if not data.get('code'):
                raise serializers.ValidationError({'code': 'This field is required for authorization_code grant'})
            if not data.get('redirect_uri'):
                raise serializers.ValidationError({'redirect_uri': 'This field is required for authorization_code grant'})
        
        elif grant_type == 'refresh_token':
            if not data.get('refresh_token'):
                raise serializers.ValidationError({'refresh_token': 'This field is required for refresh_token grant'})
        
        elif grant_type == 'password':
            if not data.get('username'):
                raise serializers.ValidationError({'username': 'This field is required for password grant'})
            if not data.get('password'):
                raise serializers.ValidationError({'password': 'This field is required for password grant'})
        
        elif grant_type == 'client_credentials':
            # Client credentials grant does not need user credentials or code/redirect_uri.
            # client_id + client_secret are validated in the view.
            pass
        
        return data


class OAuthClientCreateSerializer(serializers.Serializer):
    name = serializers.CharField(required=True, max_length=200)
    redirect_uris = serializers.ListField(child=serializers.URLField(), allow_empty=False)
    scope = serializers.CharField(required=False, max_length=200, default='read write')
    client_id = serializers.CharField(required=False, allow_blank=True, max_length=100)
    client_secret = serializers.CharField(required=False, allow_blank=True, max_length=100)
    is_public = serializers.BooleanField(required=False, default=False)
    allow_password_grant = serializers.BooleanField(required=False, default=False)
    allow_private_jwt = serializers.BooleanField(required=False, default=False)
    public_key = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    service_user_id = serializers.IntegerField(required=False, allow_null=True)

    def validate_client_id(self, value):
        if value and OAuthClient.objects.filter(client_id=value).exists():
            raise serializers.ValidationError("client_id už existuje.")
        return value

    def validate_service_user_id(self, value):
        if value is None:
            return None
        try:
            user = User.objects.get(id=value)
        except User.DoesNotExist as exc:
            raise serializers.ValidationError("Zadaný service user neexistuje.") from exc

        if user.rola not in (User.ROLE_EXTERNY, User.ROLE_GARANT):
            raise serializers.ValidationError("Service user musí mať rolu externy alebo garant.")
        return user

    def validate(self, attrs):
        allow_private_jwt = attrs.get('allow_private_jwt')
        public_key = attrs.get('public_key')
        if allow_private_jwt and not public_key:
            raise serializers.ValidationError({'public_key': 'Pre private_key_jwt musí byť zadaný public key.'})

        # map validated service_user instance
        attrs['service_user'] = attrs.pop('service_user_id', None)
        # Normalize scope default when empty string is passed
        if not attrs.get('scope'):
            attrs['scope'] = 'read write'
        return attrs
