from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from ...schemas.instagram_schema import InstagramMediaSchema
from ...services import instagram_service

router = APIRouter()

@router.get("/instagram-feed", response_model=List[InstagramMediaSchema])
async def get_instagram_feed():
    """
    Fetch latest Instagram posts, reels, and videos.
    This endpoint calls the Meta Graph API and returns a clean, structured JSON response.
    It uses in-memory caching to reduce API calls and rate-limiting issues.
    """
    return await instagram_service.fetch_instagram_feed()
