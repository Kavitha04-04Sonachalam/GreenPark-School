import logging
import httpx
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from fastapi import HTTPException, status
from ..core.config import settings

logger = logging.getLogger("instagram_service")

# In-memory cache variables
_cache_data: Optional[List[Dict[str, Any]]] = None
_cache_expiry: Optional[datetime] = None
CACHE_DURATION_MINUTES = 10

async def fetch_instagram_feed() -> List[Dict[str, Any]]:
    global _cache_data, _cache_expiry

    # Check if cache is still valid
    if _cache_data is not None and _cache_expiry is not None:
        if datetime.utcnow() < _cache_expiry:
            logger.info("Returning cached Instagram feed")
            return _cache_data

    # Check if configurations are set
    if not settings.INSTAGRAM_BUSINESS_ID or not settings.INSTAGRAM_ACCESS_TOKEN:
        logger.error("Instagram credentials are not configured in settings.")
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail="Instagram credentials (INSTAGRAM_BUSINESS_ID and INSTAGRAM_ACCESS_TOKEN) are not configured."
        )
        
    if "your_instagram" in settings.INSTAGRAM_BUSINESS_ID or "your_instagram" in settings.INSTAGRAM_ACCESS_TOKEN:
        logger.error("Instagram credentials in .env are still placeholder values.")
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail="Instagram credentials are still placeholder values. Please update .env with valid credentials."
        )

    # Call Meta Graph API
    url = f"https://graph.facebook.com/v23.0/{settings.INSTAGRAM_BUSINESS_ID}/media"
    params = {
        "fields": "id,caption,media_type,media_url,thumbnail_url,permalink,timestamp",
        "access_token": settings.INSTAGRAM_ACCESS_TOKEN
    }

    logger.info(f"Fetching fresh Instagram feed from Meta Graph API for business ID: {settings.INSTAGRAM_BUSINESS_ID}")
    
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(url, params=params)
            
            if response.status_code != 200:
                error_data = {}
                try:
                    error_data = response.json().get("error", {})
                except Exception:
                    pass
                
                error_message = error_data.get("message", "Unknown error from Meta API")
                error_code = error_data.get("code")
                error_subcode = error_data.get("error_subcode")
                error_type = error_data.get("type", "")
                
                logger.error(
                    f"Meta Graph API error (Status {response.status_code}): Code {error_code}, "
                    f"Subcode {error_subcode}, Message: {error_message}"
                )
                
                # Check for rate limiting (codes: 4, 17, 32, 613)
                if error_code in [4, 17, 32, 613] or "rate" in error_message.lower():
                    if _cache_data is not None:
                        logger.warning("Rate limit hit. Returning expired cache fallback.")
                        return _cache_data
                    raise HTTPException(
                        status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                        detail="Meta API rate limit reached. Please try again later."
                    )
                
                # Check for invalid or expired token (code: 190)
                if error_code == 190 or error_type == "OAuthException" or "token" in error_message.lower():
                    raise HTTPException(
                        status_code=status.HTTP_401_UNAUTHORIZED,
                        detail="Instagram access token is invalid or expired."
                    )
                
                # Fallback to cache if available
                if _cache_data is not None:
                    logger.warning("Meta API failed. Returning expired cache fallback.")
                    return _cache_data
                
                raise HTTPException(
                    status_code=status.HTTP_502_BAD_GATEWAY,
                    detail=f"Failed to fetch Instagram feed: {error_message}"
                )
            
            data = response.json()
            feed_items = data.get("data", [])
            
            if not feed_items:
                logger.warning("No Instagram posts available for the configured account.")
            
            # Format and normalize data
            cleaned_items = []
            for item in feed_items:
                media_type = item.get("media_type", "IMAGE")
                media_url = item.get("media_url")
                thumbnail_url = item.get("thumbnail_url")
                
                cleaned_item = {
                    "id": item.get("id"),
                    "caption": item.get("caption"),
                    "media_type": media_type,
                    "media_url": media_url,
                    "thumbnail_url": thumbnail_url or media_url,  # Fallback to media_url
                    "permalink": item.get("permalink"),
                    "timestamp": item.get("timestamp")
                }
                cleaned_items.append(cleaned_item)
            
            # Cache the response
            _cache_data = cleaned_items
            _cache_expiry = datetime.utcnow() + timedelta(minutes=CACHE_DURATION_MINUTES)
            
            logger.info(f"Successfully cached {len(cleaned_items)} Instagram feed items until {_cache_expiry}")
            return cleaned_items
            
    except httpx.RequestError as exc:
        logger.error(f"HTTP request failed while calling Meta Graph API: {exc}")
        if _cache_data is not None:
            logger.warning("Meta API request error. Returning expired cache fallback.")
            return _cache_data
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Instagram service is temporarily unavailable due to network issues."
        )
