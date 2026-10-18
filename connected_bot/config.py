"""Configuration management for the connectED Telegram Bot Service."""

import os
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional


class Settings(BaseSettings):
    """Application settings loaded from environment or .env file."""
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

    # Environment
    ENVIRONMENT: str = Field(default="development", description="Runtime environment: development, test, production")
    LOG_LEVEL: str = Field(default="INFO", description="Logging level")
    HOST: str = Field(default="0.0.0.0", description="Host to bind the FastAPI app")
    PORT: int = Field(default=8080, description="Port to bind the FastAPI app")

    # Telegram Bot API Configuration
    TELEGRAM_BOT_TOKEN: str = Field(
        default="mock_bot_token_123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11",
        description="Official Telegram Bot API token issued by @BotFather"
    )
    TELEGRAM_BOT_USERNAME: str = Field(
        default="ConnectEdMentorBot",
        description="Public username of the Telegram Bot"
    )
    TELEGRAM_API_BASE_URL: str = Field(
        default="https://api.telegram.org",
        description="Base URL for Telegram Bot API"
    )
    TELEGRAM_WEBHOOK_URL: Optional[str] = Field(
        default=None,
        description="Public HTTPS endpoint where Telegram posts updates"
    )
    TELEGRAM_WEBHOOK_SECRET_TOKEN: str = Field(
        default="connected-secure-webhook-secret-token-xyz-123",
        description="Secret token sent by Telegram in X-Telegram-Bot-Api-Secret-Token"
    )

    # connectED Authoritative Backend (Person 2)
    BACKEND_API_BASE_URL: str = Field(
        default_factory=lambda: os.getenv("BACKEND_API_BASE_URL", "http://localhost:5000/api/v1"),
        description="Base URL for the authoritative connectED FastAPI/Express backend"
    )
    BACKEND_SERVICE_TOKEN: str = Field(
        default="backend-service-auth-secret-key-456",
        description="Shared secret for bot-to-backend authenticated communication"
    )

    # Workflow & Security Settings
    LINKING_TOKEN_TTL_SECONDS: int = Field(
        default=900,
        description="Validity window for single-use account linking tokens (default 15 mins)"
    )
    MENTORSHIP_TIMEOUT_HOURS: int = Field(
        default=48,
        description="Backend SLA deadline window for mentorship request responses"
    )
    IDEMPOTENCY_TTL_SECONDS: int = Field(
        default=86400,
        description="TTL for deduplicating incoming Telegram update_ids and callbacks (24h)"
    )
    MAX_RETRIES: int = Field(
        default=3,
        description="Bounded retry count for outbound Telegram API requests"
    )
    RETRY_BACKOFF_FACTOR: float = Field(
        default=1.5,
        description="Exponential backoff factor for rate-limiting and transient retries"
    )


# Instantiate global settings singleton
settings = Settings()
