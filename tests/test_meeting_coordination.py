"""Tests for meeting coordination: proposal delivery, mutual agreement, and confirmation."""

import pytest
import time
from connected_bot.client import telegram_client


def test_meeting_proposal_and_mutual_confirmation(client, webhook_headers, backend_headers):
    """Test meeting proposal notification, response handling, and mutual confirmation rule."""
    # 1. Propose meeting from student_101 to alumni_001
    proposal_event = {
        "event_id": "evt_meet_001",
        "event_type": "meeting.proposed",
        "meeting_id": "meet_9001",
        "request_id": "req_101",
        "proposer_id": "student_101",
        "proposer_name": "Divyansh Garg",
        "recipient_id": "alumni_001",
        "proposed_time": "2026-10-25 18:00 UTC",
        "duration_minutes": 30,
        "topic": "System Design Deep Dive"
    }
    res = client.post("/api/v1/events/mentorship", json=proposal_event, headers=backend_headers)
    assert res.status_code == 200

    # Verify recipient (alumni_001, chat 987654321) received proposal
    assert len(telegram_client.sent_messages) == 1
    sent = telegram_client.sent_messages[0]
    assert sent["chat_id"] == 987654321
    assert "New Mentorship Meeting Proposed!" in sent["text"]
    assert "Divyansh Garg" in sent["text"]
    assert "2026-10-25 18:00 UTC" in sent["text"]

    # 2. Mentor clicks 'Accept Proposed Time' button
    callback_payload = {
        "update_id": 6001,
        "callback_query": {
            "id": "cb_meet_confirm_1",
            "from": {"id": 987654321, "is_bot": False, "first_name": "Priya"},
            "message": {
                "message_id": 120,
                "date": int(time.time()),
                "chat": {"id": 987654321, "type": "private"},
                "text": "Proposed meeting message"
            },
            "data": "meet_act:confirm:meet_9001"
        }
    }
    client.post("/api/v1/webhooks/telegram", json=callback_payload, headers=webhook_headers)

    # Since proposer (student_101) originally proposed and now recipient (alumni_001) confirmed,
    # mutual agreement is achieved!
    assert len(telegram_client.answered_callbacks) == 1
    assert "confirmed" in telegram_client.answered_callbacks[0]["text"].lower()

    # 3. Backend emits meeting.confirmed event: delivers meeting room link to both participants
    telegram_client.sent_messages.clear()
    confirm_event = {
        "event_id": "evt_meet_confirmed_001",
        "event_type": "meeting.confirmed",
        "meeting_id": "meet_9001",
        "request_id": "req_101",
        "student_id": "student_101",
        "mentor_id": "alumni_001",
        "confirmed_time": "2026-10-25 18:00 UTC",
        "meeting_link": "https://meet.connected.org/room/meet_9001",
        "duration_minutes": 30
    }
    res_confirm = client.post("/api/v1/events/mentorship", json=confirm_event, headers=backend_headers)
    assert res_confirm.status_code == 200

    # Both student and mentor receive meeting room link
    assert len(telegram_client.sent_messages) == 2
    for msg in telegram_client.sent_messages:
        assert "Meeting Confirmed!" in msg["text"]
        assert "https://meet.connected.org/room/meet_9001" in msg["text"]
