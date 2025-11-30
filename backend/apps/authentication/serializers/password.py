from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers


class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()


class PasswordResetConfirmSerializer(serializers.Serializer):
    token = serializers.CharField()
    new_password = serializers.CharField(write_only=True)
    new_password_confirm = serializers.CharField(write_only=True)

    def validate(self, data):
        password = data.get("new_password")
        password_confirm = data.get("new_password_confirm")

        if password != password_confirm:
            raise serializers.ValidationError("Heslá sa nezhodujú.")

        validate_password(password)
        return data


class ChangePasswordSerializer(serializers.Serializer):
    current_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True)
    new_password_confirm = serializers.CharField(write_only=True)

    def validate(self, data):
        new_password = data.get("new_password")
        confirm = data.get("new_password_confirm")

        if new_password != confirm:
            raise serializers.ValidationError("Heslá sa nezhodujú.")

        validate_password(new_password)
        return data
