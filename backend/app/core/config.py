from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional


class Settings(BaseSettings):
    DATABASE_URL: str
    SECRET_KEY: str = "your_secret_key"

    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days for uninterrupted school dashboard sessions

    R2_ACCESS_KEY_ID: Optional[str] = "local_key"
    R2_SECRET_ACCESS_KEY: Optional[str] = "local_secret"
    R2_ENDPOINT_URL: Optional[str] = "https://example.com"
    R2_BUCKET_NAME: Optional[str] = "greenpark-school-images"

    INSTAGRAM_BUSINESS_ID: Optional[str] = None
    INSTAGRAM_ACCESS_TOKEN: Optional[str] = None

    NEON_DATABASE_URL: Optional[str] = None
    UPLOADS_DIR: Optional[str] = "/app/uploads"

    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore"
    )


settings = Settings()