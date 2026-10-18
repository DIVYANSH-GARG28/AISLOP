"""Tests for Telegram bot commands: /start, /status, /help, /unlink, /optout, and AI chat."""

import pytest
from connected_bot.client import telegram_client


def test_start_unlinked_user(client, webhook_headers):
    """Test /start command for an unlinked user shows onboarding & linking instructions."""
    payload = {
        "update_id": 1001,
        "message": {
            "message_id": 1,
            "date": 1600000000,
            "chat": {"id": 999111, "type": "private"},
            "from": {"id": 999111, "is_bot": False, "first_name": "Rohan"},
            "text": "/start"
        }
    }
    response = client.post("/api/v1/webhooks/telegram", json=payload, headers=webhook_headers)
    assert response.status_code == 200
    assert len(telegram_client.sent_messages) == 1
    sent = telegram_client.sent_messages[0]
    assert sent["chat_id"] == 999111
    assert "Welcome to <b>connectED Bot</b>" in sent["text"]
    assert "How to Link Your Account" in sent["text"]


def test_start_already_linked_user(client, webhook_headers):
    """Test /start command for an already linked user recognizes their profile and role."""
    # Alumni 001 is seeded with telegram_user_id = 987654321
    payload = {
        "update_id": 1002,
        "message": {
            "message_id": 2,
            "date": 1600000000,
            "chat": {"id": 987654321, "type": "private"},
            "from": {"id": 987654321, "is_bot": False, "first_name": "Priya"},
            "text": "/start"
        }
    }
    response = client.post("/api/v1/webhooks/telegram", json=payload, headers=webhook_headers)
    assert response.status_code == 200
    assert len(telegram_client.sent_messages) == 1
    sent = telegram_client.sent_messages[0]
    assert "Priya Sharma" in sent["text"]
    assert "ALUMNI" in sent["text"]


def test_status_command_linked_and_unlinked(client, webhook_headers):
    """Test /status reflects connection state correctly."""
    # 1. Linked user
    payload_linked = {
        "update_id": 1003,
        "message": {
            "message_id": 3,
            "date": 1600000000,
            "chat": {"id": 987654321, "type": "private"},
            "from": {"id": 987654321, "is_bot": False, "first_name": "Priya"},
            "text": "/status"
        }
    }
    res = client.post("/api/v1/webhooks/telegram", json=payload_linked, headers=webhook_headers)
    assert res.status_code == 200
    assert "Connection Status: ACTIVE" in telegram_client.sent_messages[-1]["text"]

    # 2. Unlinked user
    payload_unlinked = {
        "update_id": 1004,
        "message": {
            "message_id": 4,
            "date": 1600000000,
            "chat": {"id": 555666, "type": "private"},
            "from": {"id": 555666, "is_bot": False, "first_name": "Stranger"},
            "text": "/status"
        }
    }
    res = client.post("/api/v1/webhooks/telegram", json=payload_unlinked, headers=webhook_headers)
    assert res.status_code == 200
    assert "Connection Status: NOT LINKED" in telegram_client.sent_messages[-1]["text"]


def test_help_command(client, webhook_headers):
    """Test /help returns command catalog and mentorship workflow tips."""
    payload = {
        "update_id": 1005,
        "message": {
            "message_id": 5,
            "date": 1600000000,
            "chat": {"id": 987654321, "type": "private"},
            "from": {"id": 987654321, "is_bot": False, "first_name": "Priya"},
            "text": "/help"
        }
    }
    res = client.post("/api/v1/webhooks/telegram", json=payload, headers=webhook_headers)
    assert res.status_code == 200
    assert "connectED Telegram Bot Guide" in telegram_client.sent_messages[-1]["text"]
    assert "/start" in telegram_client.sent_messages[-1]["text"]
    assert "48-hour SLA" in telegram_client.sent_messages[-1]["text"]


def test_ai_conversational_guidance(client, webhook_headers):
    """Test free-form questions are routed to AI Mentorship Assistant."""
    payload = {
        "update_id": 1006,
        "message": {
            "message_id": 6,
            "date": 1600000000,
            "chat": {"id": 987654321, "type": "private"},
            "from": {"id": 987654321, "is_bot": False, "first_name": "Priya"},
            "text": "How do I write a good mentorship inquiry?"
        }
    }
    res = client.post("/api/v1/webhooks/telegram", json=payload, headers=webhook_headers)
    assert res.status_code == 200
    assert "Tips for Writing High-Impact Mentorship Requests" in telegram_client.sent_messages[-1]["text"]
