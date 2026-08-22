from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    UploadFile,
    File,
    Form,
    status
)
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from ...core.database import get_db
from ...services import gallery_service
from ...schemas import gallery_schema
from ..deps import get_current_admin_user

from ...utils.s3 import (
    upload_file,
    get_presigned_url,
    get_object_key,
    delete_file
)


router = APIRouter()


# ============================================================
# CONSTANTS
# ============================================================

ALLOWED_MIME_TYPES = {
    "image/jpeg",
    "image/png",
    "image/webp",
    "video/mp4"
}


# ============================================================
# FILE VALIDATION
# ============================================================

def validate_file(file: UploadFile):
    if file.content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"File type {file.content_type} not allowed. "
                f"Allowed types: {', '.join(ALLOWED_MIME_TYPES)}"
            )
        )


# ============================================================
# URL HELPERS
# ============================================================

def get_signed_url(url: Optional[str]) -> Optional[str]:
    """
    Convert an R2 object key / R2 URL into a temporary
    presigned URL.

    External URLs such as Unsplash and YouTube are returned
    unchanged.
    """

    if not url:
        return None

    try:
        # ----------------------------------------------------
        # External URLs
        # ----------------------------------------------------

        if (
            "youtube.com" in url
            or "youtu.be" in url
            or "images.unsplash.com" in url
        ):
            return url

        # ----------------------------------------------------
        # Convert R2 URL -> object key
        # ----------------------------------------------------

        object_key = get_object_key(url)

        # ----------------------------------------------------
        # Generate signed URL
        # ----------------------------------------------------

        return get_presigned_url(object_key)

    except Exception as e:

        print(
            f"Error generating presigned URL: {str(e)}"
        )

        # Don't break complete API response
        return url


# ============================================================
# SERIALIZERS
# ============================================================

def serialize_media(media):
    """
    Convert Media SQLAlchemy object into API response.
    """

    return {
        "id": media.id,
        "event_id": media.event_id,
        "media_url": get_signed_url(
            media.media_url
        ),
        "media_type": media.media_type,
        "created_at": media.created_at
    }


def serialize_event(event):
    """
    Convert Event SQLAlchemy object into API response.
    """

    return {
        "id": event.id,
        "name": event.name,
        "description": event.description,
        "date": event.date,
        "thumbnail_url": get_signed_url(
            event.thumbnail_url
        ),
        "created_at": event.created_at,
        "media": [
            serialize_media(media)
            for media in event.media
        ]
    }


# ============================================================
# PUBLIC ROUTES
# ============================================================

@router.get(
    "/events",
    response_model=List[gallery_schema.EventSchema]
)
def list_events(
    db: Session = Depends(get_db)
):

    events = gallery_service.get_events(db)

    return [
        serialize_event(event)
        for event in events
    ]


@router.get(
    "/events/{event_id}",
    response_model=gallery_schema.EventSchema
)
def get_event(
    event_id: int,
    db: Session = Depends(get_db)
):

    event = gallery_service.get_event(
        db,
        event_id
    )

    if not event:
        raise HTTPException(
            status_code=404,
            detail="Event not found"
        )

    return serialize_event(event)


@router.get(
    "/events/{event_id}/media",
    response_model=List[gallery_schema.MediaSchema]
)
def get_event_media(
    event_id: int,
    db: Session = Depends(get_db)
):

    event = gallery_service.get_event(
        db,
        event_id
    )

    if not event:
        raise HTTPException(
            status_code=404,
            detail="Event not found"
        )

    return [
        serialize_media(media)
        for media in event.media
    ]


# ============================================================
# ADMIN - CREATE EVENT
# ============================================================

@router.post(
    "/admin/events",
    response_model=gallery_schema.EventSchema
)
async def create_event(

    name: str = Form(...),

    description: Optional[str] = Form(None),

    date: str = Form(...),

    thumbnail: Optional[UploadFile] = File(None),

    db: Session = Depends(get_db),

    admin=Depends(get_current_admin_user)
):

    thumbnail_url = None

    # --------------------------------------------------------
    # Upload thumbnail
    # --------------------------------------------------------

    if thumbnail:

        validate_file(thumbnail)

        # Thumbnail must be image
        if not thumbnail.content_type.startswith(
            "image/"
        ):
            raise HTTPException(
                status_code=400,
                detail="Thumbnail must be an image"
            )

        try:

            thumbnail_url = upload_file(
                thumbnail,
                folder="thumbnails"
            )

        except Exception as e:

            print(
                f"Thumbnail upload error: {str(e)}"
            )

            raise HTTPException(
                status_code=500,
                detail="Failed to upload thumbnail to R2"
            )

    # --------------------------------------------------------
    # Parse date
    # --------------------------------------------------------

    try:

        parsed_date = datetime.fromisoformat(date)

    except ValueError:

        try:

            parsed_date = datetime.strptime(
                date,
                "%d/%m/%Y"
            )

        except ValueError:

            raise HTTPException(
                status_code=400,
                detail=(
                    f"Invalid date format: {date}. "
                    "Use YYYY-MM-DD or DD/MM/YYYY"
                )
            )

    # --------------------------------------------------------
    # Create event
    # --------------------------------------------------------

    event_data = {
        "name": name,
        "description": description,
        "date": parsed_date,
        "thumbnail_url": thumbnail_url
    }

    event = gallery_service.create_event(
        db,
        event_data
    )

    return serialize_event(event)


# ============================================================
# ADMIN - UPLOAD MEDIA
# ============================================================

@router.post(
    "/admin/events/{event_id}/media"
)
async def upload_media(

    event_id: int,

    files: Optional[List[UploadFile]] = File(None),

    media_url: Optional[str] = Form(None),

    media_type: Optional[str] = Form(None),

    db: Session = Depends(get_db),

    admin=Depends(get_current_admin_user)
):

    # --------------------------------------------------------
    # Check event
    # --------------------------------------------------------

    event = gallery_service.get_event(
        db,
        event_id
    )

    if not event:

        raise HTTPException(
            status_code=404,
            detail="Event not found"
        )

    media_items = []

    # ========================================================
    # YOUTUBE URL
    # ========================================================

    if media_url and (
        "youtube.com" in media_url
        or "youtu.be" in media_url
    ):

        m_type = (
            media_type
            if media_type
            else "youtube"
        )

        item = gallery_service.create_media(
            db,
            event_id,
            media_url,
            m_type
        )

        media_items.append(
            serialize_media(item)
        )

    # ========================================================
    # FILE UPLOAD
    # ========================================================

    elif files:

        for file in files:

            if not getattr(
                file,
                "filename",
                None
            ):
                continue

            validate_file(file)

            try:

                # --------------------------------------------
                # Upload to R2
                # --------------------------------------------

                uploaded_key = upload_file(
                    file,
                    f"events/{event_id}"
                )

                # --------------------------------------------
                # Determine media type
                # --------------------------------------------

                if file.content_type.startswith(
                    "video/"
                ):

                    f_type = "video"

                else:

                    f_type = "image"

                # --------------------------------------------
                # Save object KEY in DB
                # --------------------------------------------

                item = gallery_service.create_media(
                    db,
                    event_id,
                    uploaded_key,
                    f_type
                )

                # --------------------------------------------
                # Serialize with signed URL
                # --------------------------------------------

                media_items.append(
                    serialize_media(item)
                )

            except Exception as e:

                print(
                    f"Error uploading "
                    f"{file.filename}: {str(e)}"
                )

                raise HTTPException(
                    status_code=500,
                    detail=(
                        f"Failed to upload "
                        f"{file.filename} to R2"
                    )
                )

    # ========================================================
    # NOTHING UPLOADED
    # ========================================================

    if not media_items:

        raise HTTPException(
            status_code=400,
            detail=(
                "No files or valid "
                "YouTube URL provided"
            )
        )

    return {
        "message": "Uploaded successfully",
        "items": media_items
    }


# ============================================================
# ADMIN - DELETE EVENT
# ============================================================

@router.delete(
    "/admin/events/{event_id}"
)
def delete_event(

    event_id: int,

    db: Session = Depends(get_db),

    admin=Depends(get_current_admin_user)
):

    # --------------------------------------------------------
    # Get event BEFORE deleting
    # --------------------------------------------------------

    event = gallery_service.get_event(
        db,
        event_id
    )

    if not event:

        raise HTTPException(
            status_code=404,
            detail="Event not found"
        )

    # --------------------------------------------------------
    # Delete thumbnail from R2
    # --------------------------------------------------------

    if event.thumbnail_url:

        try:

            thumbnail_key = get_object_key(
                event.thumbnail_url
            )

            # Only delete R2 files
            if thumbnail_key and not (
                thumbnail_key.startswith("http")
            ):

                delete_file(
                    thumbnail_key
                )

        except Exception as e:

            print(
                f"Warning: Failed to delete "
                f"thumbnail from R2: {str(e)}"
            )

    # --------------------------------------------------------
    # Delete event media from R2
    # --------------------------------------------------------

    for media in event.media:

        # YouTube/external URLs must NOT be deleted
        if not media.media_url:
            continue

        if (
            "youtube.com" in media.media_url
            or "youtu.be" in media.media_url
            or "images.unsplash.com" in media.media_url
        ):
            continue

        try:

            media_key = get_object_key(
                media.media_url
            )

            if media_key and not (
                media_key.startswith("http")
            ):

                delete_file(
                    media_key
                )

        except Exception as e:

            print(
                f"Warning: Failed to delete "
                f"media from R2: {str(e)}"
            )

    # --------------------------------------------------------
    # Delete DB event
    # --------------------------------------------------------

    gallery_service.delete_event(
        db,
        event_id
    )

    return {
        "message": "Event and associated media deleted successfully"
    }


# ============================================================
# ADMIN - DELETE MEDIA
# ============================================================

@router.delete(
    "/admin/media/{media_id}"
)
def delete_media(

    media_id: int,

    db: Session = Depends(get_db),

    admin=Depends(get_current_admin_user)
):

    # --------------------------------------------------------
    # Get media before deleting
    # --------------------------------------------------------

    media = gallery_service.get_media(
        db,
        media_id
    )

    if not media:

        raise HTTPException(
            status_code=404,
            detail="Media not found"
        )

    # --------------------------------------------------------
    # Delete R2 object
    # --------------------------------------------------------

    if media.media_url:

        # Don't delete external URLs
        if not (
            "youtube.com" in media.media_url
            or "youtu.be" in media.media_url
            or "images.unsplash.com" in media.media_url
        ):

            try:

                media_key = get_object_key(
                    media.media_url
                )

                if media_key and not (
                    media_key.startswith("http")
                ):

                    delete_file(
                        media_key
                    )

            except Exception as e:

                print(
                    f"Warning: Failed to delete "
                    f"media from R2: {str(e)}"
                )

    # --------------------------------------------------------
    # Delete DB record
    # --------------------------------------------------------

    gallery_service.delete_media(
        db,
        media_id
    )

    return {
        "message": "Media deleted successfully"
    }