"""Tests for security controls, secret token validation, and authorization boundaries."""

import pytest
import time
from connected_bot.client import telegram_client
from connected_bot.backend_client import backend_client


def test_webhook_secret_token_validation(client):
    """Test webhook rejects requests without or with wrong secret token."""
    payload = {
        "update_id": 4001,
        "message": {
            "message_id": 1,
            "date": 1600000000,
            "chat": {"id": 12345, "type": "private"},
            "from": {"id": 12345, "is_bot": False, "first_name": "Eve"},
            "text": "/start"
        }
    }
    # 1. Missing header
    res1 = client.post("/api/v1/webhooks/telegram", json=payload)
    assert res1.status_code == 403

    # 2. Tampered / invalid token
    res2 = client.post("/api/v1/webhooks/telegram", json=payload, headers={
        "X-Telegram-Bot-Api-Secret-Token": "invalid_fake_secret_token"
    })
    assert res2.status_code == 403


def test_backend_service_token_validation(client):
    """Test backend event route requires valid Bearer service token."""
    event = {
        "event_id": "evt_sec_1",
        "event_type": "mentorship.request.created",
        "request_id": "req_sec_1"
    }
    # 1. Missing header
    res1 = client.post("/api/v1/events/mentorship", json=event)
    assert res1.status_code == 401

    # 2. Invalid bearer token
    res2 = client.post("/api/v1/events/mentorship", json=event, headers={
        "Authorization": "Bearer bad_token"
    })
    assert res2.status_code == 403


def test_unauthorized_callback_attempt(client, webhook_headers, backend_headers):
    """Test that a malicious user or another mentor cannot accept a request assigned to someone else."""
    # Register request for alumni_001
    client.post("/api/v1/events/mentorship", json={
        "event_id": "evt_sec_2",
        "event_type": "mentorship.request.created",
        "request_id": "req_sec_100",
        "mentor_id": "alumni_001",
        "mentee_id": "student_101",
        "mentee_name": "Divyansh Garg",
        "topic": "Confidential Career Advice",
        "message": "Hello Priya",
        "skills": ["Leadership"],
        "created_at": "2026-10-18T10:00:00Z",
        "expires_at": "2026-10-20T10:00:00Z"
    }, headers=backend_headers)
    telegram_client.answered_callbacks.clear()

    # Alumni 002 (chat 987654322) attempts to click Accept on alumni 001's request
    unauthorized_user_id = 987654322
    callback_payload = {
        "update_id": 4002,
        "callback_query": {
            "id": "cb_unauthorized_1",
            "from": {"id": unauthorized_user_id, "is_bot": False, "first_name": "Aravind"},
            "message": {
                "message_id": 88,
                "date": int(time.time()),
                "chat": {"id": unauthorized_user_id, "type": "private"},
                "text": "Mentorship request"
            },
            "data": "mentor_act:accept:req_sec_100"
        }
    }
    res = client.post("/api/v1/webhooks/telegram", json=callback_payload, headers=webhook_headers)
    assert res.status_code == 200

    # Verify callback returned an alert warning
    assert len(telegram_client.answered_callbacks) == 1
    answer = telegram_client.answered_callbacks[0]
    assert answer["show_alert"] is True
    assert "Unauthorized" in answer["text"]

    # Verify request in backend remains PENDING (did not transition!)
    req_state = backend_client._db_mentorship_requests["req_sec_100"]
    assert req_state["status"] == "PENDING"


def test_expired_request_callback_attempt(client, webhook_headers, backend_headers):
    """Test clicking Accept on an already expired request notifies mentor and does not accept."""
    client.post("/api/v1/events/mentorship", json={
        "event_id": "evt_sec_3",
        "event_type": "mentorship.request.created",
        "request_id": "req_sec_200",
        "mentor_id": "alumni_001",
        "mentee_id": "student_101",
        "mentee_name": "Divyansh Garg",
        "topic": "Timed Out Discussion",
        "message": "Expired",
        "skills": ["Python"],
        "created_at": "2026-10-18T10:00:00Z",
        "expires_at": "2026-10-20T10:00:00Z"
    }, headers=backend_headers)

    # Manually expire the request in backend state (simulate 48h elapsed)
    backend_client._db_mentorship_requests["req_sec_200"]["expires_at_timestamp"] = time.time() - 3600

    mentor_chat_id = 987654321
    callback_payload = {
        "update_id": 4003,
        "callback_query": {
            "id": "cb_expired_click",
            "from": {"id": mentor_chat_id, "is_bot": False, "first_name": "Priya"},
            "message": {
                "message_id": 99,
                "date": int(time.time()),
                "chat": {"id": mentor_chat_id, "type": "private"},
                "text": "Mentorship request"
            },
            "data": "mentor_act:accept:req_sec_200"
        }
    }
    client.post("/api/v1/webhooks/telegram", json=callback_payload, headers=webhook_headers)

    # Verify alert notified mentor that request is expired
    assert len(telegram_client.answered_callbacks) == 1
    assert "expired" in telegram_client.answered_callbacks[0]["text"].lower()

    # Verify UI updated with expired label
    assert len(telegram_client.edited_messages) == 1
    assert "EXPIRED" in telegram_client.edited_messages[0]["text"]
