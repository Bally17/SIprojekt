# backend/apps/authentication/oauth_serializers.py
from rest_framework import serializers
from django.core.validators import URLValidator
from django.core.exceptions import ValidationError

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
