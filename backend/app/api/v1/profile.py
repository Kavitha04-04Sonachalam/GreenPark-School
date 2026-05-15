from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session
from typing import Optional
import os
from ...core.database import get_db
from ...services import parent_service
from ...utils.s3 import upload_file

router = APIRouter()

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp"}

def validate_image(file: UploadFile):
    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File type {file.content_type} not allowed. Allowed types: {', '.join(ALLOWED_IMAGE_TYPES)}"
        )

@router.post("/upload-photo")
async def upload_parent_photo(
    parent_id: str = Form(...),
    image: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    # Validate parent existence
    parent = parent_service.get_parent(db, parent_id)
    if not parent:
        raise HTTPException(status_code=404, detail="Parent not found")

    # Validate image type
    validate_image(image)

    try:
        # Generate filename: profile/PAR001.jpg (using original extension)
        ext = os.path.splitext(image.filename)[1]
        if not ext:
            # Fallback for extension if missing in filename
            ext = ".jpg" if image.content_type == "image/jpeg" else ".png"
            
        custom_filename = f"{parent_id}{ext}"
        
        # Upload to S3 in 'profile' folder
        profile_image_url = upload_file(image, folder="profile", custom_filename=custom_filename)
        
        # Update database
        parent_service.update_profile_image(db, parent_id, profile_image_url)
        
        return {
            "success": True,
            "profile_image_url": profile_image_url
        }
    except Exception as e:
        print(f"Error in upload_parent_photo: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to upload photo")

@router.get("/{parent_id}")
def get_parent_profile(parent_id: str, db: Session = Depends(get_db)):
    parent = parent_service.get_parent(db, parent_id)
    if not parent:
        raise HTTPException(status_code=404, detail="Parent not found")
    
    return {
        "parent_id": parent.parent_id,
        "parent_name": parent.father_name, # Mapping father_name to parent_name as per example
        "phone_number": parent.phone_primary,
        "profile_image_url": parent.profile_image_url
    }
