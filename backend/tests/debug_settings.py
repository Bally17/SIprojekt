# backend/debug_settings.py
import os
import django
from django.conf import settings

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings.dev')
django.setup()

print("🔧 DEBUG: Current REST_FRAMEWORK settings:")
print(f"DEFAULT_PERMISSION_CLASSES: {settings.REST_FRAMEWORK['DEFAULT_PERMISSION_CLASSES']}")
print(f"DEFAULT_AUTHENTICATION_CLASSES: {settings.REST_FRAMEWORK['DEFAULT_AUTHENTICATION_CLASSES']}")
