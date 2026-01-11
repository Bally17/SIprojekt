from django.contrib.auth import authenticate
from rest_framework import serializers

from apps.users.models import User


class LoginSerializer(serializers.Serializer):
    """Validate username/password input and resolve a user."""
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        email = data.get("email")
        password = data.get("password")

        if email and password:
            try:
                user = User.objects.get(email=email)
                if not user.check_password(password):
                    user = None
            except User.DoesNotExist:
                user = None

            if not user:
                raise serializers.ValidationError("Invalid email or password")

            data["user"] = user
        else:
            raise serializers.ValidationError('Must include "email" and "password"')

        return data


class GoogleAuthSerializer(serializers.Serializer):
    code = serializers.CharField(required=True)
    code_verifier = serializers.CharField(required=True)
    redirect_uri = serializers.CharField(required=True)


class GitHubAuthSerializer(serializers.Serializer):
    """Validate GitHub OAuth code exchange payloads."""
    code = serializers.CharField(required=True)
"""Serializers for login and OAuth token exchange payloads."""
