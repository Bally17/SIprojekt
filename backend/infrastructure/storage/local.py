"""Local filesystem storage adapter."""
import os
import uuid

from django.conf import settings


def save_file(file_obj, filename: str = None, prefix: str = "uploads/") -> str:
    """Save file to local MEDIA_ROOT/uploads; returns relative path."""
    if not filename:
        original_name = getattr(file_obj, "name", "file")
        filename = f"{uuid.uuid4().hex}_{original_name}"

    object_name = f"{prefix}{filename}"
    target_path = os.path.join(settings.MEDIA_ROOT, object_name)
    os.makedirs(os.path.dirname(target_path), exist_ok=True)

    file_obj.seek(0)
    with open(target_path, "wb") as out:
        for chunk in getattr(file_obj, "chunks", lambda: iter([file_obj.read()]))():
            if not chunk:
                continue
            out.write(chunk)

    return object_name
