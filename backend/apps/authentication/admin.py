from django.contrib import admin

# Register your models here.
# apps/authentication/admin.py
from django.contrib import admin
from .models import OAuthClient, AuthorizationCode

@admin.register(OAuthClient)
class OAuthClientAdmin(admin.ModelAdmin):
    list_display = ['name', 'client_id', 'is_active', 'created_at']
    list_filter = ['is_active', 'created_at']
    search_fields = ['name', 'client_id']

@admin.register(AuthorizationCode)
class AuthorizationCodeAdmin(admin.ModelAdmin):
    list_display = ['code', 'user', 'client', 'expires_at', 'used']
    list_filter = ['used', 'expires_at', 'created_at']
    search_fields = ['user__email', 'client__name']
