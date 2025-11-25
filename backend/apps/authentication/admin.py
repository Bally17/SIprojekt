from django.contrib import admin

# Register your models here.
# apps/authentication/admin.py
from django.contrib import admin
from .models import OAuthClient, AuthorizationCode

@admin.register(OAuthClient)
class OAuthClientAdmin(admin.ModelAdmin):
    list_display = ['name', 'client_id', 'service_user', 'is_public', 'allow_password_grant', 'allow_private_jwt', 'is_active', 'created_at']
    list_filter = ['is_active', 'is_public', 'allow_password_grant', 'allow_private_jwt', 'created_at']
    search_fields = ['name', 'client_id']
    fieldsets = (
        (None, {'fields': ('name', 'client_id', 'client_secret', 'scope', 'service_user', 'is_active')}),
        ('Client type', {'fields': ('is_public', 'allow_password_grant', 'allow_private_jwt')}),
        ('Keys', {'fields': ('public_key',)}),
        ('Redirects', {'fields': ('redirect_uris',)}),
    )

@admin.register(AuthorizationCode)
class AuthorizationCodeAdmin(admin.ModelAdmin):
    list_display = ['code', 'user', 'client', 'expires_at', 'used', 'code_challenge_method']
    list_filter = ['used', 'expires_at', 'created_at', 'code_challenge_method']
    search_fields = ['user__email', 'client__name']
