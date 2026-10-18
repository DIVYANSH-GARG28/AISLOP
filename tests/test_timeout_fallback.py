"""Tests for 48-hour timeout notifications and fallback recommendation routing."""

import pytest
from connected_bot.client import telegram_client
from connected_bot.backend_client import backend_client


def test_48_hour_timeout_notification(client, backend_headers):
    """Test consuming mentorship.request.expired notifies student and mentor."""
    event = {
        "event_id": "evt_timeout_1",
        "event_type": "mentorship.request.expired",
        "request_id": "req_timeout_99",
        "mentor_id": "alumni_001",
        "mentee_id": "student_101",
        "expired_at": "2026-10-20T10:00:00Z",
        "fallback_recommended": True
    }
    res = client.post("/api/v1/events/mentorship", json=event, headers=backend_headers)
    assert res.status_code == 200
    assert res.json()["status"] == "PROCESSED"

    # Both student (111222333) and mentor (987654321) receive notices
    assert len(telegram_client.sent_messages) == 2
    student_msg = next(m for m in telegram_client.sent_messages if m["chat_id"] == 111222333)
    mentor_msg = next(m for m in telegram_client.sent_messages if m["chat_id"] == 987654321)

    assert "48-hour response window without a reply" in student_msg["text"]
    assert "Automatic Fallback Active" in student_msg["text"]
    assert "Request Closed" in mentor_msg["text"]


def test_fallback_mentor_recommended_notification(client, backend_headers):
    """Test consuming mentorship.fallback.created informs student of new matched mentor."""
    event = {
        "event_id": "evt_fallback_1",
        "event_type": "mentorship.fallback.created",
        "original_request_id": "req_timeout_99",
        "new_request_id": "req_fallback_100",
        "mentee_id": "student_101",
        "new_mentor_id": "alumni_002",
        "new_mentor_name": "Aravind Nair",
        "skills_matched": ["Cloud Architecture", "Azure", "Kubernetes"],
        "reason": "Original request expired after 48h timeout"
    }
    res = client.post("/api/v1/events/mentorship", json=event, headers=backend_headers)
    assert res.status_code == 200
    assert res.json()["status"] == "PROCESSED"

    # Student receives recommendation announcement
    assert len(telegram_client.sent_messages) == 1
    msg = telegram_client.sent_messages[0]
    assert msg["chat_id"] == 111222333
    assert "Fallback Mentor Recommended!" in msg["text"]
    assert "Aravind Nair" in msg["text"]
    assert "Cloud Architecture, Azure, Kubernetes" in msg["text"]
