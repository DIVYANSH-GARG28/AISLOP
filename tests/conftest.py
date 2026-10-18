"""Pytest configuration and test fixtures for connectED Telegram Bot."""

import pytest
import time
from fastapi.testclient import TestClient
from connected_bot.app import app
from connected_bot.config import settings
from connected_bot.client import telegram_client
from connected_bot.backend_client import backend_client
from connected_bot.idempotency import idempotency_store


@pytest.fixture(autouse=True)
def reset_state():
    """Resets client logs, test caches, and idempotency store before each test."""
    telegram_client.mock_mode = True
    telegram_client.sent_messages.clear()
    telegram_client.edited_messages.clear()
    telegram_client.answered_callbacks.clear()
    telegram_client.simulated_errors.clear()

    backend_client.mock_mode = True
    backend_client._seed_default_mock_data()
    backend_client._db_linking_tokens.clear()
    backend_client._db_mentorship_requests.clear()
    backend_client._db_meetings.clear()

    idempotency_store.clear()
    yield


@pytest.fixture
def client():
    """FastAPI TestClient fixture."""
    return TestClient(app)


@pytest.fixture
def webhook_headers():
    """Valid Telegram webhook headers."""
    return {
        "X-Telegram-Bot-Api-Secret-Token": settings.TELEGRAM_WEBHOOK_SECRET_TOKEN,
        "Content-Type": "application/json"
    }


@pytest.fixture
def backend_headers():
    """Valid internal backend service authorization headers."""
    return {
        "Authorization": f"Bearer {settings.BACKEND_SERVICE_TOKEN}",
        "Content-Type": "application/json"
    }
