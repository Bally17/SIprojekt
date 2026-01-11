import logging
import os

from django.conf import settings

from infrastructure.storage import local as local_storage
from infrastructure.storage import s3 as s3_storage

logger = logging.getLogger(__name__)


def upload_file_to_b2(file_obj, filename: str = None, prefix: str = "uploads/") -> str:
    """
    Uploads a file object to Backblaze B2 under given prefix.
    Vždy uloží kópiu do lokálneho MEDIA_ROOT, aby frontend fungoval cez /media/.
    Ak je B2 dostupné, uploadne tam rovnaký súbor (best-effort).
    Returns the object_name (relative path) that should be saved in the DB.
    """
    # 1) Lokálny zápis (pre /media/ odkazy)
    object_name = local_storage.save_file(file_obj, filename, prefix)

    # 2) Best-effort upload do B2 (z lokálneho súboru)
    try:
        local_path = os.path.join(settings.MEDIA_ROOT, object_name)
        s3_storage.upload_file(local_path, object_name)
    except Exception as exc:  # pragma: no cover - infra závislosť
        logger.warning("B2 upload skipped/failure, using local file: %s", exc)

    return object_name


def generate_presigned_url(object_name: str, expires_in: int = None) -> str:
    """
    Generates a temporary (presigned) URL for downloading a file.
    Only valid for a short time — default from .env.
    """
    return s3_storage.generate_presigned_url(object_name, expires_in=expires_in)
