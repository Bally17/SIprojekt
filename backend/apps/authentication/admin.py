from django.contrib import admin

# Register your models here.
# apps/authentication/admin.py
from django.contrib import admin
from .models import OAuthClient, AuthorizationCode

@admin.register(OAuthClient)
class OAuthClientAdmin(admin.ModelAdmin):
    list_display = ['name', 'client_id', 'is_public', 'allow_password_grant', 'is_active', 'created_at']
    list_filter = ['is_active', 'is_public', 'allow_password_grant', 'created_at']
    search_fields = ['name', 'client_id']
    fieldsets = (
        (None, {'fields': ('name', 'client_id', 'client_secret', 'scope', 'is_active')}),
        ('Client type', {'fields': ('is_public', 'allow_password_grant')}),
        ('Redirects', {'fields': ('redirect_uris',)}),
    )

@admin.register(AuthorizationCode)
class AuthorizationCodeAdmin(admin.ModelAdmin):
    list_display = ['code', 'user', 'client', 'expires_at', 'used', 'code_challenge_method']
    list_filter = ['used', 'expires_at', 'created_at', 'code_challenge_method']
    search_fields = ['user__email', 'client__name']
