"""Configuration and settings for connectED backend service."""

import os
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    PROJECT_NAME: str = "connectED Authoritative Backend"
    VERSION: str = "2.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Server configuration
    HOST: str = "0.0.0.0"
    PORT: int = Field(default_factory=lambda: int(os.getenv("PORT", "5000")))
    DEBUG: bool = True

    # MongoDB Configuration
    MONGODB_URI: str = Field(
        default_factory=lambda: os.getenv("MONGODB_URI", "mongodb://localhost:27017")
    )
    MONGODB_DB_NAME: str = Field(
        default_factory=lambda: os.getenv("MONGODB_DB_NAME", "connected_db")
    )

    # JWT Authentication
    JWT_SECRET: str = Field(
        default_factory=lambda: os.getenv("JWT_SECRET", "connected_super_jwt_secret_key_2026_iiit_alumni")
    )
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours

    # Internal Service Token (for Telegram bot and automated workers)
    BACKEND_SERVICE_TOKEN: str = Field(
        default_factory=lambda: os.getenv("BACKEND_SERVICE_TOKEN", "connected_bot_secret_token_123")
    )

    # Telegram & n8n Automation
    TELEGRAM_BOT_TOKEN: str = Field(
        default_factory=lambda: os.getenv("TELEGRAM_BOT_TOKEN", "8918112944:AAE6ofGvw5Ofgi17w4S_pZTkCY_yGiZCgF4")
    )
    N8N_WEBHOOK_URL: str = Field(
        default_factory=lambda: os.getenv(
            "N8N_WEBHOOK_URL",
            "https://connected69.app.n8n.cloud/webhook/events/mentorship/request.created"
        )
    )
    N8N_INSTITUTE_OTP_WEBHOOK_URL: str = Field(
        default_factory=lambda: os.getenv(
            "N8N_INSTITUTE_OTP_WEBHOOK_URL",
            "https://connected69.app.n8n.cloud/webhook/events/institute/otp.requested"
        )
    )

    # 48-hour response SLA (in hours)
    MENTORSHIP_DEADLINE_HOURS: int = 48

    # Linking Token TTL (15 minutes)
    LINKING_TOKEN_TTL_SECONDS: int = 900

    # Institutional Verification OTP TTL (10 minutes)
    INSTITUTE_OTP_TTL_MINUTES: int = 10
    INSTITUTE_OTP_COOLDOWN_SECONDS: int = 60
    INSTITUTE_OTP_MAX_ATTEMPTS: int = 3


settings = Settings()
