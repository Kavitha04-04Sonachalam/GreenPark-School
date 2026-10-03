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

_env_dir = os.environ.get("UPLOADS_DIR")
if _env_dir and os.path.exists(_env_dir):
    LOCAL_UPLOADS_DIR = os.path.abspath(_env_dir)
elif _env_dir and not _env_dir.startswith("/app"):
    LOCAL_UPLOADS_DIR = os.path.abspath(_env_dir)
else:
    LOCAL_UPLOADS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "uploads"))
os.makedirs(LOCAL_UPLOADS_DIR, exist_ok=True)

def is_r2_configured() -> bool:
    """Check if valid Cloudflare R2 credentials are provided (not dummy placeholders)."""
    return bool(
        settings.R2_ACCESS_KEY_ID
        and settings.R2_ACCESS_KEY_ID not in ("local_key", "your_access_key_id")
        and settings.R2_SECRET_ACCESS_KEY not in ("local_secret", "your_secret_access_key")
        and settings.R2_ENDPOINT_URL
        and not settings.R2_ENDPOINT_URL.startswith(("https://example.com", "https://your-account-id"))
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
    Upload a file:
    1. Saves locally to /app/uploads/{folder}/{filename} for 100% offline LAN access.
    2. If Cloudflare R2 is configured and reachable, replicates to R2.
    Returns:
        R2/local object key (e.g. 'profile/PAR001.jpeg')
    """
    try:
        if custom_filename:
            object_key = f"{folder}/{custom_filename}"
        else:
            ext = os.path.splitext(file.filename or "")[1]
            object_key = f"{folder}/{uuid.uuid4()}{ext}"

        # 1. Save to local storage
        local_path = os.path.join(LOCAL_UPLOADS_DIR, object_key)
        os.makedirs(os.path.dirname(local_path), exist_ok=True)

        file.file.seek(0)
        content = file.file.read()
        with open(local_path, "wb") as f:
            f.write(content)

        print(f"[MEDIA] Saved local upload: {local_path}")

        # 2. Replicate to Cloudflare R2 if configured
        if is_r2_configured():
            try:
                file.file.seek(0)
                s3_client.upload_fileobj(
                    file.file,
                    settings.R2_BUCKET_NAME,
                    object_key,
                    ExtraArgs={
                        "ContentType": file.content_type or "application/octet-stream"
                    }
                )
                print(f"[MEDIA] R2 Upload Success: {object_key}")
            except Exception as e:
                print(f"[MEDIA] R2 Replication skipped (will sync later when online): {e}")

        return object_key

    except Exception as e:
        print(f"[MEDIA] Upload Error: {str(e)}")
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
        # Cloud vs Local URL Resolution
        # ----------------------------------------------------
        # In cloud mode (APP_ENV == "cloud" or "production"), always generate signed R2 URL
        if getattr(settings, "APP_ENV", "").lower() in ("cloud", "production"):
            if is_r2_configured():
                return get_presigned_url(object_key, expiration)
            return f"/uploads/{object_key}"

        # In local mode, serve from local disk cache if present
        local_path = os.path.join(LOCAL_UPLOADS_DIR, object_key)
        if os.path.exists(local_path):
            return f"/uploads/{object_key}"

        # If not found locally but R2 is configured, fetch from R2
        if is_r2_configured():
            return get_presigned_url(object_key, expiration)

        return f"/uploads/{object_key}"

    except Exception as e:

        print(
            f"R2 Signed URL Error: {str(e)}"
        )

        # Don't break API response - fallback to local URL
        if 'object_key' in locals() and object_key:
            return f"/uploads/{object_key}"
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


# ============================================================
# SYNC MEDIA FILES (TWO-WAY OFFLINE CACHE <-> R2)
# ============================================================

def sync_media_files() -> dict:
    """
    Two-way media sync between local uploads folder and Cloudflare R2:
    1. If R2 is not configured or offline, return safely.
    2. Local -> R2: Upload any local files that haven't been pushed to R2 yet.
    3. R2 -> Local: Download any missing files from R2 into LOCAL_UPLOADS_DIR.
    """
    if not is_r2_configured():
        return {"status": "skipped", "reason": "R2 not configured"}

    uploaded = 0
    downloaded = 0
    try:
        # 1. Walk local uploads and push missing to R2
        if os.path.exists(LOCAL_UPLOADS_DIR):
            for root, _, files in os.walk(LOCAL_UPLOADS_DIR):
                for file in files:
                    abs_path = os.path.join(root, file)
                    rel_path = os.path.relpath(abs_path, LOCAL_UPLOADS_DIR).replace("\\", "/")
                    try:
                        s3_client.head_object(Bucket=settings.R2_BUCKET_NAME, Key=rel_path)
                    except Exception:
                        try:
                            with open(abs_path, "rb") as f:
                                s3_client.upload_fileobj(f, settings.R2_BUCKET_NAME, rel_path)
                            uploaded += 1
                            print(f"[MEDIA SYNC] Uploaded {rel_path} to R2")
                        except Exception as e:
                            print(f"[MEDIA SYNC] Error uploading {rel_path} to R2: {e}")

        # 2. List R2 files and download missing locally
        try:
            paginator = s3_client.get_paginator("list_objects_v2")
            for page in paginator.paginate(Bucket=settings.R2_BUCKET_NAME):
                for obj in page.get("Contents", []):
                    key = obj["Key"]
                    local_dest = os.path.join(LOCAL_UPLOADS_DIR, key)
                    if not os.path.exists(local_dest):
                        os.makedirs(os.path.dirname(local_dest), exist_ok=True)
                        s3_client.download_file(settings.R2_BUCKET_NAME, key, local_dest)
                        downloaded += 1
                        print(f"[MEDIA SYNC] Downloaded {key} from R2 to local storage")
        except Exception as e:
            print(f"[MEDIA SYNC] Error listing/downloading R2 objects: {e}")

        return {"status": "success", "uploaded": uploaded, "downloaded": downloaded}
    except Exception as e:
        print(f"[MEDIA SYNC] Exception during sync: {e}")
        return {"status": "error", "error": str(e)}
