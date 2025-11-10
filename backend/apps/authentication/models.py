from django.db import models

# Create your models here
# apps/authentication/models.py
from django.db import models
from django.contrib.auth import get_user_model
import secrets
import json

User = get_user_model()

class OAuthClient(models.Model):
    client_id = models.CharField(max_length=100, unique=True)
    client_secret = models.CharField(max_length=100, blank=True)
    name = models.CharField(max_length=200)
    redirect_uris = models.TextField(help_text="JSON list of allowed URIs")
    scope = models.TextField(default='read profile')
    created_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)
    is_public = models.BooleanField(default=False, help_text="Indicates if the client is public (PKCE required, no secret).")
    allow_password_grant = models.BooleanField(default=False, help_text="Allow this client to use the password grant (first-party only).")
    
    def get_redirect_uris_list(self):
        return json.loads(self.redirect_uris)
    
    def __str__(self):
        return self.name

class AuthorizationCode(models.Model):
    code = models.CharField(max_length=100, unique=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    client = models.ForeignKey(OAuthClient, on_delete=models.CASCADE)
    redirect_uri = models.CharField(max_length=300)
    scope = models.TextField()
    expires_at = models.DateTimeField()
    used = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    code_challenge = models.CharField(max_length=128, blank=True, null=True)
    code_challenge_method = models.CharField(max_length=10, blank=True, null=True)
    
    def is_valid(self):
        from django.utils import timezone
        return not self.used and self.expires_at > timezone.now()
    
    @classmethod
    def generate_code(cls):
        return secrets.token_urlsafe(32)
    
    def __str__(self):
        return f"{self.client.name} - {self.user.email}"
