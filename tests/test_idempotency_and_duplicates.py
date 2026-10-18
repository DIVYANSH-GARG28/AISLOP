"""Tests for idempotency, update deduplication, and repeated button clicks."""

import pytest
import time
from connected_bot.client import telegram_client


def test_duplicate_update_id_deduplication(client, webhook_headers):
    """Test that Telegram updates with the same update_id are deduplicated."""
    payload = {
        "update_id": 5001,
        "message": {
            "message_id": 1,
            "date": 1600000000,
            "chat": {"id": 987654321, "type": "private"},
            "from": {"id": 987654321, "is_bot": False, "first_name": "Priya"},
            "text": "/help"
        }
    }
    # First delivery: processed
    res1 = client.post("/api/v1/webhooks/telegram", json=payload, headers=webhook_headers)
    assert res1.status_code == 200
    assert res1.json() == {"ok": True}
    assert len(telegram_client.sent_messages) == 1

    # Second delivery with identical update_id: deduplicated
    res2 = client.post("/api/v1/webhooks/telegram", json=payload, headers=webhook_headers)
    assert res2.status_code == 200
    assert res2.json() == {"ok": True, "duplicate": True}
    # Sent messages count should NOT have increased!
    assert len(telegram_client.sent_messages) == 1


def test_repeated_button_clicks_on_same_request(client, webhook_headers, backend_headers):
    """Test that double-clicking or repeated button clicks do not duplicate state transitions."""
    # 1. Dispatch request
    client.post("/api/v1/events/mentorship", json={
        "event_id": "evt_dup_1",
        "event_type": "mentorship.request.created",
        "request_id": "req_dup_100",
        "mentor_id": "alumni_001",
        "mentee_id": "student_101",
        "mentee_name": "Divyansh Garg",
        "topic": "Idempotency Review",
        "message": "Testing duplicate click safety",
        "skills": ["Reliability"],
        "created_at": "2026-10-18T10:00:00Z",
        "expires_at": "2026-10-20T10:00:00Z"
    }, headers=backend_headers)
    telegram_client.sent_messages.clear()
    telegram_client.edited_messages.clear()

    mentor_chat_id = 987654321
    callback_payload_1 = {
        "update_id": 5002,
        "callback_query": {
            "id": "cb_click_1",
            "from": {"id": mentor_chat_id, "is_bot": False, "first_name": "Priya"},
            "message": {
                "message_id": 100,
                "date": int(time.time()),
                "chat": {"id": mentor_chat_id, "type": "private"},
                "text": "Mentorship request text"
            },
            "data": "mentor_act:accept:req_dup_100"
        }
    }
    # First Click: Successfully transitions to ACCEPTED
    res1 = client.post("/api/v1/webhooks/telegram", json=callback_payload_1, headers=webhook_headers)
    assert res1.status_code == 200
    assert len(telegram_client.edited_messages) == 1

    # Second Click with different callback id (e.g. user taps button again before UI renders):
    callback_payload_2 = {
        "update_id": 5003,
        "callback_query": {
            "id": "cb_click_2",
            "from": {"id": mentor_chat_id, "is_bot": False, "first_name": "Priya"},
            "message": {
                "message_id": 100,
                "date": int(time.time()),
                "chat": {"id": mentor_chat_id, "type": "private"},
                "text": "Mentorship request text"
            },
            "data": "mentor_act:accept:req_dup_100"
        }
    }
    res2 = client.post("/api/v1/webhooks/telegram", json=callback_payload_2, headers=webhook_headers)
    assert res2.status_code == 200
    # The second click is safely rejected by the authoritative backend as already accepted!
    assert "already been accepted" in telegram_client.answered_callbacks[-1]["text"].lower()


def test_duplicate_backend_event_deduplication(client, backend_headers):
    """Test that backend internal events with the same event_id are processed only once."""
    event = {
        "event_id": "evt_duplicate_event_001",
        "event_type": "mentorship.request.expired",
        "request_id": "req_dup_expire",
        "mentor_id": "alumni_001",
        "mentee_id": "student_101",
        "expired_at": "2026-10-20T10:00:00Z"
    }
    # 1. First ingest
    res1 = client.post("/api/v1/events/mentorship", json=event, headers=backend_headers)
    assert res1.status_code == 200
    assert res1.json()["status"] == "PROCESSED"
    initial_sent = len(telegram_client.sent_messages)

    # 2. Duplicate ingest
    res2 = client.post("/api/v1/events/mentorship", json=event, headers=backend_headers)
    assert res2.status_code == 200
    assert res2.json()["status"] == "DUPLICATE"
    # No extra messages sent!
    assert len(telegram_client.sent_messages) == initial_sent
