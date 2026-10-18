"""Tests for secure account linking, token validation, expiration, single-use, and unlinking."""

import pytest
import time
from connected_bot.client import telegram_client
from connected_bot.backend_client import backend_client


def test_successful_account_linking_flow(client, webhook_headers):
    """End-to-end test of account linking: Initiate -> Deep link /start -> Linked."""
    # 1. User initiates linking from connectED web dashboard
    initiate_payload = {
        "user_id": "student_999",
        "email": "ayush.patel@students.iiit.ac.in",
        "role": "STUDENT"
    }
    init_res = client.post("/api/v1/telegram/link/initiate", json=initiate_payload)
    assert init_res.status_code == 200
    token_data = init_res.json()
    assert token_data["success"] is True
    token = token_data["token"]
    assert token.startswith("link_")

    # 2. User clicks deep link in Telegram: /start <token>
    telegram_user_id = 777888999
    update_payload = {
        "update_id": 2001,
        "message": {
            "message_id": 10,
            "date": int(time.time()),
            "chat": {"id": telegram_user_id, "type": "private"},
            "from": {"id": telegram_user_id, "is_bot": False, "first_name": "Ayush", "username": "ayush_p"},
            "text": f"/start {token}"
        }
    }
    hook_res = client.post("/api/v1/webhooks/telegram", json=update_payload, headers=webhook_headers)
    assert hook_res.status_code == 200

    # Verify confirmation message was dispatched
    assert len(telegram_client.sent_messages) == 1
    sent = telegram_client.sent_messages[0]
    assert sent["chat_id"] == telegram_user_id
    assert "Account Linked Successfully!" in sent["text"]

    # Verify user record is now linked in backend
    linked_user = backend_client._db_users.get("student_999")
    assert linked_user is not None
    assert linked_user["telegram_user_id"] == telegram_user_id
    assert linked_user["telegram_chat_id"] == telegram_user_id


def test_single_use_token_cannot_be_reused(client, webhook_headers):
    """Verify that a single-use token cannot be redeemed more than once."""
    init_res = client.post("/api/v1/telegram/link/initiate", json={
        "user_id": "student_888",
        "email": "priya.k@students.iiit.ac.in",
        "role": "STUDENT"
    })
    token = init_res.json()["token"]

    # First use: Succeeds
    client.post("/api/v1/webhooks/telegram", json={
        "update_id": 2002,
        "message": {
            "message_id": 11,
            "date": int(time.time()),
            "chat": {"id": 12345, "type": "private"},
            "from": {"id": 12345, "is_bot": False, "first_name": "Priya"},
            "text": f"/start {token}"
        }
    }, headers=webhook_headers)
    assert "Account Linked Successfully!" in telegram_client.sent_messages[-1]["text"]

    # Second use by malicious or duplicate actor: Rebuffed
    telegram_client.sent_messages.clear()
    client.post("/api/v1/webhooks/telegram", json={
        "update_id": 2003,
        "message": {
            "message_id": 12,
            "date": int(time.time()),
            "chat": {"id": 99999, "type": "private"},
            "from": {"id": 99999, "is_bot": False, "first_name": "Attacker"},
            "text": f"/start {token}"
        }
    }, headers=webhook_headers)
    assert "Account Linking Failed" in telegram_client.sent_messages[-1]["text"]
    assert "already been used" in telegram_client.sent_messages[-1]["text"]


def test_invalid_and_expired_linking_token(client, webhook_headers):
    """Test rejection of non-existent or expired tokens."""
    # 1. Non-existent token
    client.post("/api/v1/webhooks/telegram", json={
        "update_id": 2004,
        "message": {
            "message_id": 13,
            "date": int(time.time()),
            "chat": {"id": 12345, "type": "private"},
            "from": {"id": 12345, "is_bot": False, "first_name": "Bob"},
            "text": "/start link_bogus_token_123"
        }
    }, headers=webhook_headers)
    assert "Invalid linking token" in telegram_client.sent_messages[-1]["text"]

    # 2. Expired token
    telegram_client.sent_messages.clear()
    init_res = client.post("/api/v1/telegram/link/initiate", json={
        "user_id": "student_777",
        "email": "old.token@students.iiit.ac.in",
        "role": "STUDENT"
    })
    token = init_res.json()["token"]
    # Manually expire token in backend state
    backend_client._db_linking_tokens[token]["expires_at"] = time.time() - 100

    client.post("/api/v1/webhooks/telegram", json={
        "update_id": 2005,
        "message": {
            "message_id": 14,
            "date": int(time.time()),
            "chat": {"id": 12345, "type": "private"},
            "from": {"id": 12345, "is_bot": False, "first_name": "Bob"},
            "text": f"/start {token}"
        }
    }, headers=webhook_headers)
    assert "token has expired" in telegram_client.sent_messages[-1]["text"]


def test_unlink_and_optout(client, webhook_headers):
    """Test /unlink successfully disconnects account and disables notifications."""
    # Seeded user alumni_001 has telegram ID 987654321
    alumni_id = 987654321
    res = client.post("/api/v1/webhooks/telegram", json={
        "update_id": 2006,
        "message": {
            "message_id": 15,
            "date": int(time.time()),
            "chat": {"id": alumni_id, "type": "private"},
            "from": {"id": alumni_id, "is_bot": False, "first_name": "Priya"},
            "text": "/unlink"
        }
    }, headers=webhook_headers)
    assert res.status_code == 200
    assert "Account Unlinked" in telegram_client.sent_messages[-1]["text"]

    # Verify user is opted out in backend
    user = backend_client._db_users["alumni_001"]
    assert user["is_opted_out"] is True
    assert user["telegram_chat_id"] is None
