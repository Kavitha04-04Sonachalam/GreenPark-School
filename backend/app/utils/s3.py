import boto3
import uuid
import os
from urllib.parse import urlparse

from fastapi import UploadFile

from ..core.config import settings


# ============================================================
# R2 / S3 CLIENT
# ============================================================

s3_client = boto3.client(
    "s3",
    aws_access_key_id=settings.R2_ACCESS_KEY_ID,
    aws_secret_access_key=settings.R2_SECRET_ACCESS_KEY,
    endpoint_url=settings.R2_ENDPOINT_URL,
    region_name="auto"
)


# ============================================================
# UPLOAD FILE
# ============================================================

def upload_file(
    file: UploadFile,
    folder: str = "events",
    custom_filename: str = None
) -> str:
    """
    Upload a file to Cloudflare R2.

    Returns:
        R2 object key

    Example:
        thumbnails/abc123.png
        events/4/abc123.jpg
    """

    try:

        # ----------------------------------------------------
        # Create object key
        # ----------------------------------------------------

        if custom_filename:

            object_key = (
                f"{folder}/{custom_filename}"
            )

        else:

            ext = os.path.splitext(
                file.filename or ""
            )[1]

            object_key = (
                f"{folder}/{uuid.uuid4()}{ext}"
            )

        # ----------------------------------------------------
        # Upload to R2
        # ----------------------------------------------------

        s3_client.upload_fileobj(
            file.file,
            settings.R2_BUCKET_NAME,
            object_key,
            ExtraArgs={
                "ContentType": (
                    file.content_type
                    or "application/octet-stream"
                )
            }
        )

        print(
            f"R2 Upload Success: {object_key}"
        )

        # ----------------------------------------------------
        # IMPORTANT:
        # Store ONLY the object key in database.
        # ----------------------------------------------------

        return object_key

    except Exception as e:

        print(
            f"R2 Upload Error: {str(e)}"
        )

        raise


# ============================================================
# GET PRESIGNED URL
# ============================================================

def get_presigned_url(
    object_key: str,
    expiration: int = 3600
) -> str:
    """
    Generate a temporary signed URL for an R2 object.

    Args:
        object_key:
            Example:
                thumbnails/abc.png

        expiration:
            URL lifetime in seconds.
            Default = 1 hour.
    """

    try:

        return s3_client.generate_presigned_url(
            "get_object",
            Params={
                "Bucket": settings.R2_BUCKET_NAME,
                "Key": object_key
            },
            ExpiresIn=expiration
        )

    except Exception as e:

        print(
            f"R2 Presigned URL Error: {str(e)}"
        )

        raise


# ============================================================
# GET OBJECT KEY
# ============================================================

def get_object_key(value: str) -> str:
    """
    Convert an R2 URL or object key into an R2 object key.

    Examples:

    Input:
        thumbnails/test.png

    Output:
        thumbnails/test.png


    Input:
        https://account.r2.cloudflarestorage.com/
        bucket/thumbnails/test.png

    Output:
        thumbnails/test.png


    External URLs such as:

        https://images.unsplash.com/...

    are returned unchanged.
    """

    if not value:
        return value

    value = value.strip()

    # --------------------------------------------------------
    # Already an object key
    # --------------------------------------------------------

    if not value.startswith(
        ("http://", "https://")
    ):

        return value

    # --------------------------------------------------------
    # Parse URL
    # --------------------------------------------------------

    try:

        parsed = urlparse(value)

        hostname = parsed.hostname or ""

        path = parsed.path.lstrip("/")

        # ----------------------------------------------------
        # Check whether URL belongs to our R2 endpoint
        # ----------------------------------------------------

        endpoint = settings.R2_ENDPOINT_URL.rstrip("/")

        endpoint_host = urlparse(
            endpoint
        ).hostname or ""

        if hostname != endpoint_host:

            # External URL
            return value

        # ----------------------------------------------------
        # Remove bucket name
        # ----------------------------------------------------

        bucket = settings.R2_BUCKET_NAME

        bucket_prefix = f"{bucket}/"

        if path.startswith(bucket_prefix):

            object_key = path[
                len(bucket_prefix):
            ]

            return object_key

        # ----------------------------------------------------
        # If URL is not in expected R2 format,
        # return original value.
        # ----------------------------------------------------

        return value

    except Exception as e:

        print(
            f"R2 Object Key Parsing Error: {str(e)}"
        )

        return value


# ============================================================
# GET SIGNED URL
# ============================================================

def get_signed_url(
    value: str,
    expiration: int = 3600
) -> str:
    """
    Generate a signed R2 URL from either:

    1. R2 object key
    2. R2 URL

    External URLs are returned unchanged.

    Examples:

        thumbnails/test.png
        ->
        signed R2 URL


        https://...r2.../bucket/thumbnails/test.png
        ->
        signed R2 URL


        https://images.unsplash.com/...
        ->
        unchanged
    """

    if not value:
        return value

    try:

        # ----------------------------------------------------
        # Convert URL -> object key
        # ----------------------------------------------------

        object_key = get_object_key(value)

        # ----------------------------------------------------
        # External URL
        # ----------------------------------------------------

        if object_key.startswith(
            ("http://", "https://")
        ):

            return value

        # ----------------------------------------------------
        # Generate signed R2 URL
        # ----------------------------------------------------

        return get_presigned_url(
            object_key,
            expiration
        )

    except Exception as e:

        print(
            f"R2 Signed URL Error: {str(e)}"
        )

        # Don't break API response
        return value


# ============================================================
# DELETE FILE
# ============================================================

def delete_file(
    object_key: str
) -> bool:
    """
    Delete an object from Cloudflare R2.

    Example:

        delete_file(
            "thumbnails/abc123.png"
        )
    """

    if not object_key:

        return False

    try:

        # ----------------------------------------------------
        # Convert possible R2 URL -> object key
        # ----------------------------------------------------

        object_key = get_object_key(
            object_key
        )

        # ----------------------------------------------------
        # Don't try to delete external URLs
        # ----------------------------------------------------

        if object_key.startswith(
            ("http://", "https://")
        ):

            print(
                f"Skipping external URL: {object_key}"
            )

            return False

        # ----------------------------------------------------
        # Delete from R2
        # ----------------------------------------------------

        s3_client.delete_object(
            Bucket=settings.R2_BUCKET_NAME,
            Key=object_key
        )

        print(
            f"R2 Delete Success: {object_key}"
        )

        return True

    except Exception as e:

        print(
            f"R2 Delete Error: {str(e)}"
        )

        raise


# ============================================================
# CHECK FILE EXISTS
# ============================================================

def file_exists(
    object_key: str
) -> bool:
    """
    Check whether an object exists in R2.
    """

    if not object_key:
        return False

    try:

        object_key = get_object_key(
            object_key
        )

        # External URL
        if object_key.startswith(
            ("http://", "https://")
        ):

            return False

        s3_client.head_object(
            Bucket=settings.R2_BUCKET_NAME,
            Key=object_key
        )

        return True

    except Exception:

        return False