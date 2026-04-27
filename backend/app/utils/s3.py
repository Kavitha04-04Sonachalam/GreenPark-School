import boto3
import uuid
import os
from fastapi import UploadFile
from ..core.config import settings

s3_client = boto3.client(
    "s3",
    aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
    aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
    region_name=settings.AWS_REGION
)

def upload_file(file: UploadFile, folder: str = "events") -> str:
    """
    Uploads a file to S3 and returns the public URL.
    """
    try:
        # Generate unique filename
        ext = os.path.splitext(file.filename)[1]
        unique_filename = f"{folder}/{uuid.uuid4()}{ext}"
        
        # Upload using upload_fileobj
        s3_client.upload_fileobj(
            file.file,
            settings.S3_BUCKET,
            unique_filename,
            ExtraArgs={
                "ContentType": file.content_type
            }
        )
        
        # Return public URL
        return f"https://{settings.S3_BUCKET}.s3.{settings.AWS_REGION}.amazonaws.com/{unique_filename}"
    except Exception as e:
        print(f"S3 Upload Error: {str(e)}")
        raise e
