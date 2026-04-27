from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session
from typing import List, Optional
from ...core.database import get_db
from ...services import gallery_service
from ...schemas import gallery_schema
from ..deps import get_current_admin_user
from ...utils.s3 import upload_file
from datetime import datetime

router = APIRouter()

# Constants
ALLOWED_MIME_TYPES = {
    "image/jpeg",
    "image/png",
    "image/webp",
    "video/mp4"
}

def validate_file(file: UploadFile):
    if file.content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File type {file.content_type} not allowed. Allowed types: {', '.join(ALLOWED_MIME_TYPES)}"
        )

# PUBLIC ROUTES
@router.get("/events", response_model=List[gallery_schema.EventSchema])
def list_events(db: Session = Depends(get_db)):
    return gallery_service.get_events(db)

@router.get("/events/{event_id}", response_model=gallery_schema.EventSchema)
def get_event(event_id: int, db: Session = Depends(get_db)):
    event = gallery_service.get_event(db, event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    return event

# ADMIN ROUTES
@router.post("/admin/events", response_model=gallery_schema.EventSchema)
async def create_event(
    name: str = Form(...),
    description: Optional[str] = Form(None),
    date: str = Form(...),
    thumbnail: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    admin = Depends(get_current_admin_user)
):
    thumbnail_url = None
    if thumbnail:
        validate_file(thumbnail)
        try:
            thumbnail_url = upload_file(thumbnail, "thumbnails")
        except Exception:
            raise HTTPException(status_code=500, detail="Failed to upload thumbnail to S3")
    
    # Robust date parsing
    try:
        parsed_date = datetime.fromisoformat(date)
    except ValueError:
        try:
            # Handle DD/MM/YYYY
            parsed_date = datetime.strptime(date, "%d/%m/%Y")
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid date format: {date}. Use YYYY-MM-DD or DD/MM/YYYY")

    event_data = {
        "name": name,
        "description": description,
        "date": parsed_date,
        "thumbnail_url": thumbnail_url
    }
    return gallery_service.create_event(db, event_data)

@router.post("/admin/events/{event_id}/media")
async def upload_media(
    event_id: int,
    files: List[UploadFile] = File(...),
    db: Session = Depends(get_db),
    admin = Depends(get_current_admin_user)
):
    event = gallery_service.get_event(db, event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    media_items = []
    for file in files:
        validate_file(file)
        try:
            media_url = upload_file(file, f"events/{event_id}")
            media_type = "video" if file.content_type.startswith("video/") else "image"
            item = gallery_service.create_media(db, event_id, media_url, media_type)
            media_items.append(item)
        except Exception:
            # Continue with other files or raise? For consistency, let's raise if one fails
            raise HTTPException(status_code=500, detail=f"Failed to upload {file.filename} to S3")
    
    return {
        "message": "Uploaded successfully",
        "items": media_items
    }

@router.delete("/admin/events/{event_id}")
def delete_event(event_id: int, db: Session = Depends(get_db), admin = Depends(get_current_admin_user)):
    success = gallery_service.delete_event(db, event_id)
    if not success:
        raise HTTPException(status_code=404, detail="Event not found")
    return {"message": "Event deleted successfully"}

@router.delete("/admin/media/{media_id}")
def delete_media(media_id: int, db: Session = Depends(get_db), admin = Depends(get_current_admin_user)):
    success = gallery_service.delete_media(db, media_id)
    if not success:
        raise HTTPException(status_code=404, detail="Media not found")
    return {"message": "Media deleted successfully"}
