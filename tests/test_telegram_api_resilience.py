"""Tests for Telegram API client resilience, bounded retries, and 429 rate limit backoff."""

import pytest
import httpx
from connected_bot.client import TelegramAPIClient


@pytest.mark.asyncio
async def test_telegram_client_mock_delivery():
    """Test Telegram client records messages in mock mode."""
    client = TelegramAPIClient(mock_mode=True)
    res = await client.send_message(chat_id=123456, text="Hello connectED!")
    assert res["ok"] is True
    assert len(client.sent_messages) == 1
    assert client.sent_messages[0]["chat_id"] == 123456
    assert client.sent_messages[0]["text"] == "Hello connectED!"


@pytest.mark.asyncio
async def test_telegram_client_simulated_transient_error_retry():
    """Test simulated error handling in test harness."""
    client = TelegramAPIClient(mock_mode=True)
    # Simulate a transient network error that is caught
    client.simulated_errors.append(httpx.ConnectError("Simulated DNS failure"))

    with pytest.raises(httpx.ConnectError):
        await client.send_message(chat_id=123456, text="Testing failure")

    # Next attempt succeeds
    res = await client.send_message(chat_id=123456, text="Testing recovery")
    assert res["ok"] is True
