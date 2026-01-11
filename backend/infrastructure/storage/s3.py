"""S3-compatible storage adapter (Backblaze B2)."""
import logging
import os

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
    """Return a boto3 S3 client using upload or download credentials."""
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


def upload_file(local_path: str, object_name: str) -> None:
    """Upload local file path to B2 (best-effort)."""
    s3 = _get_b2_client(upload=True)
    with open(local_path, "rb") as f:
        s3.upload_fileobj(
            Fileobj=f,
            Bucket=B2_BUCKET_NAME,
            Key=object_name,
            ExtraArgs={"ACL": "private"},
        )


def generate_presigned_url(object_name: str, expires_in: int = None) -> str:
    """Generate a presigned download URL."""
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
