import os
import uuid
from dotenv import load_dotenv
try:
    import boto3
    from botocore.exceptions import ClientError
except ImportError:  # pragma: no cover - optional dependency in some environments
    boto3 = None
    ClientError = Exception

# Load environment variables from .env in backend root
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
load_dotenv(os.path.join(BASE_DIR, ".env"))

# Read env variables
B2_BUCKET_NAME = os.getenv("B2_BUCKET_NAME")
B2_ENDPOINT_URL = os.getenv("B2_ENDPOINT_URL")
B2_PRESIGNED_EXPIRES = int(os.getenv("B2_PRESIGNED_EXPIRES", 120))


def _get_b2_client(upload: bool = True):
    """
    Returns a boto3 S3 client for Backblaze B2 using either upload or download credentials.
    """
    if upload:
        access_key = os.getenv("B2_UPLOAD_KEY_ID")
        secret_key = os.getenv("B2_UPLOAD_KEY_SECRET")
    else:
        access_key = os.getenv("B2_DOWNLOAD_KEY_ID")
        secret_key = os.getenv("B2_DOWNLOAD_KEY_SECRET")

    if not all([access_key, secret_key, B2_ENDPOINT_URL]):
        raise RuntimeError("Missing B2 environment variables or endpoint URL.")

    if boto3 is None:
        raise RuntimeError("boto3 is required for B2 storage operations. Install it via 'pip install boto3'.")

    return boto3.client(
        "s3",
        endpoint_url=B2_ENDPOINT_URL,
        aws_access_key_id=access_key,
        aws_secret_access_key=secret_key,
    )


def upload_file_to_b2(file_obj, filename: str = None, prefix: str = "uploads/") -> str:
    """
    Uploads a file object to Backblaze B2 under given prefix.
    Returns the object_name (path) that should be saved in the DB.
    """
    s3 = _get_b2_client(upload=True)

    if not filename:
        original_name = getattr(file_obj, "name", "file")
        filename = f"{uuid.uuid4().hex}_{original_name}"

    object_name = f"{prefix}{filename}"

    try:
        s3.upload_fileobj(
            Fileobj=file_obj,
            Bucket=B2_BUCKET_NAME,
            Key=object_name,
            ExtraArgs={"ACL": "private"}  # bucket should be private
        )
    except ClientError as e:
        print(f"❌ B2 Upload failed: {e}")
        raise e

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
    except ClientError as e:
        print(f"❌ B2 Generate presigned URL failed: {e}")
        raise e
