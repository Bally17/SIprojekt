import logging
import os
import uuid

from django.conf import settings

try:
    import boto3
    from botocore.exceptions import ClientError
except ImportError:  # pragma: no cover - optional dependency in some environments
    boto3 = None
    ClientError = Exception

logger = logging.getLogger(__name__)

B2_BUCKET_NAME = os.getenv("B2_BUCKET_NAME")
B2_ENDPOINT_URL = os.getenv("B2_ENDPOINT_URL")
B2_PRESIGNED_EXPIRES = int(os.getenv("B2_PRESIGNED_EXPIRES", 120))


def _get_b2_client(upload: bool = True):
    """
    Returns a boto3 S3 client for Backblaze B2 using either upload or download credentials.
    """
    if not boto3 or not B2_BUCKET_NAME or not B2_ENDPOINT_URL:
        raise RuntimeError("B2 client not configured.")

    if upload:
        access_key = os.getenv("B2_UPLOAD_KEY_ID")
        secret_key = os.getenv("B2_UPLOAD_KEY_SECRET")
    else:
        access_key = os.getenv("B2_DOWNLOAD_KEY_ID")
        secret_key = os.getenv("B2_DOWNLOAD_KEY_SECRET")

    if not all([access_key, secret_key]):
        raise RuntimeError("Missing B2 environment variables.")

    return boto3.client(
        "s3",
        endpoint_url=B2_ENDPOINT_URL,
        aws_access_key_id=access_key,
        aws_secret_access_key=secret_key,
    )


def _save_file_locally(file_obj, filename: str = None, prefix: str = "uploads/") -> str:
    """Save file to local MEDIA_ROOT/uploads; returns relative path."""
    if not filename:
        original_name = getattr(file_obj, "name", "file")
        filename = f"{uuid.uuid4().hex}_{original_name}"

    object_name = f"{prefix}{filename}"
    target_path = os.path.join(settings.MEDIA_ROOT, object_name)
    os.makedirs(os.path.dirname(target_path), exist_ok=True)

    # file_obj môže byť InMemoryUploadedFile / TemporaryUploadedFile
    file_obj.seek(0)
    with open(target_path, "wb") as out:
        for chunk in getattr(file_obj, "chunks", lambda: iter([file_obj.read()]))():
            if not chunk:
                continue
            out.write(chunk)

    return object_name


def upload_file_to_b2(file_obj, filename: str = None, prefix: str = "uploads/") -> str:
    """
    Uploads a file object to Backblaze B2 under given prefix.
    Vždy uloží kópiu do lokálneho MEDIA_ROOT, aby frontend fungoval cez /media/.
    Ak je B2 dostupné, uploadne tam rovnaký súbor (best-effort).
    Returns the object_name (relative path) that should be saved in the DB.
    """
    # 1) Lokálny zápis (pre /media/ odkazy)
    object_name = _save_file_locally(file_obj, filename, prefix)

    # 2) Best-effort upload do B2 (z lokálneho súboru)
    try:
        s3 = _get_b2_client(upload=True)
        local_path = os.path.join(settings.MEDIA_ROOT, object_name)
        with open(local_path, "rb") as f:
            s3.upload_fileobj(
                Fileobj=f,
                Bucket=B2_BUCKET_NAME,
                Key=object_name,
                ExtraArgs={"ACL": "private"},  # bucket should be private
            )
    except Exception as exc:  # pragma: no cover - infra závislosť
        logger.warning("B2 upload skipped/failure, using local file: %s", exc)

    return object_name


def generate_presigned_url(object_name: str, expires_in: int = None) -> str:
    """
    Generates a temporary (presigned) URL for downloading a file.
    Only valid for a short time — default from .env.
    """
    s3 = _get_b2_client(upload=False)

    if expires_in is None:
        expires_in = B2_PRESIGNED_EXPIRES

    try:
        url = s3.generate_presigned_url(
            ClientMethod="get_object",
            Params={"Bucket": B2_BUCKET_NAME, "Key": object_name},
            ExpiresIn=int(expires_in),
        )
        return url
    except ClientError as exc:
        logger.error("B2 Generate presigned URL failed: %s", exc)
        raise
