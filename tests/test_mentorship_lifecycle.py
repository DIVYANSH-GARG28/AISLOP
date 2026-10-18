"""Tests for mentorship lifecycle: request dispatch, accept/decline callbacks, and mentee alerts."""

import pytest
import time
from connected_bot.client import telegram_client
from connected_bot.backend_client import backend_client
from connected_bot.services.mentorship_service import mentorship_service


def test_mentorship_request_dispatch_to_linked_alumni(client, backend_headers):
    """Test receiving mentorship.request.created delivers inline action card to mentor."""
    event_payload = {
        "event_id": "evt_req_101",
        "event_type": "mentorship.request.created",
        "request_id": "req_101",
        "mentor_id": "alumni_001",
        "mentee_id": "student_101",
        "mentee_name": "Divyansh Garg",
        "topic": "System Design & Distributed Systems Mock Interview",
        "message": "Hi Priya, I am preparing for software engineering interviews and would love feedback on my design.",
        "skills": ["Distributed Systems", "Go", "Kubernetes"],
        "created_at": "2026-10-18T10:00:00Z",
        "expires_at": "2026-10-20T10:00:00Z"
    }
    res = client.post("/api/v1/events/mentorship", json=event_payload, headers=backend_headers)
    assert res.status_code == 200
    assert res.json()["status"] == "PROCESSED"

    # Verify message sent to mentor's chat (alumni_001 has chat 987654321)
    assert len(telegram_client.sent_messages) == 1
    sent = telegram_client.sent_messages[0]
    assert sent["chat_id"] == 987654321
    assert "New Mentorship Request!" in sent["text"]
    assert "Divyansh Garg" in sent["text"]
    assert "System Design & Distributed Systems" in sent["text"]
    assert "Distributed Systems • Go • Kubernetes" in sent["text"]
    assert "48 Hours" in sent["text"]

    # Verify inline keyboard buttons
    buttons = sent["reply_markup"]["inline_keyboard"][0]
    assert len(buttons) == 2
    assert "Accept Mentorship" in buttons[0]["text"]
    assert buttons[0]["callback_data"] == "mentor_act:accept:req_101"
    assert "Decline Request" in buttons[1]["text"]
    assert buttons[1]["callback_data"] == "mentor_act:decline:req_101"

    # Verify delivery record was saved
    assert len(mentorship_service.delivery_records) >= 1
    assert mentorship_service.delivery_records[-1]["request_id"] == "req_101"
    assert mentorship_service.delivery_records[-1]["delivered"] is True


def test_mentorship_request_dispatch_unlinked_alumni(client, backend_headers):
    """Test receiving mentorship.request.created for unlinked mentor handles gracefully."""
    event_payload = {
        "event_id": "evt_req_102",
        "event_type": "mentorship.request.created",
        "request_id": "req_102",
        "mentor_id": "alumni_unlinked_999",  # Not in users db or not linked
        "mentee_id": "student_101",
        "mentee_name": "Divyansh Garg",
        "topic": "Frontend Performance Optimization",
        "message": "Need advice on bundle splitting in Vite.",
        "skills": ["React", "Performance"],
        "created_at": "2026-10-18T10:00:00Z",
        "expires_at": "2026-10-20T10:00:00Z"
    }
    res = client.post("/api/v1/events/mentorship", json=event_payload, headers=backend_headers)
    assert res.status_code == 200
    assert res.json()["result"]["status"] == "UNLINKED"

    # No message sent to telegram since mentor has not linked
    assert len(telegram_client.sent_messages) == 0


def test_accept_callback_handling(client, webhook_headers, backend_headers):
    """Test mentor pressing 'Accept Mentorship' button successfully updates backend and message UI."""
    # 1. Ingest request
    client.post("/api/v1/events/mentorship", json={
        "event_id": "evt_req_103",
        "event_type": "mentorship.request.created",
        "request_id": "req_103",
        "mentor_id": "alumni_001",
        "mentee_id": "student_101",
        "mentee_name": "Divyansh Garg",
        "topic": "Career Roadmap Review",
        "message": "Looking for advice on transitioning to backend architecture.",
        "skills": ["Architecture"],
        "created_at": "2026-10-18T10:00:00Z",
        "expires_at": "2026-10-20T10:00:00Z"
    }, headers=backend_headers)
    telegram_client.sent_messages.clear()

    # 2. Mentor clicks 'Accept' button in Telegram
    mentor_chat_id = 987654321
    callback_payload = {
        "update_id": 3001,
        "callback_query": {
            "id": "cb_query_accept_1",
            "from": {"id": mentor_chat_id, "is_bot": False, "first_name": "Priya"},
            "message": {
                "message_id": 44,
                "date": int(time.time()),
                "chat": {"id": mentor_chat_id, "type": "private"},
                "text": "Initial mentorship request text"
            },
            "data": "mentor_act:accept:req_103"
        }
    }
    res = client.post("/api/v1/webhooks/telegram", json=callback_payload, headers=webhook_headers)
    assert res.status_code == 200

    # 3. Verify Telegram callback answer
    assert len(telegram_client.answered_callbacks) == 1
    assert "successfully accepted" in telegram_client.answered_callbacks[0]["text"]

    # 4. Verify original message was edited to show ACCEPTED and disable buttons
    assert len(telegram_client.edited_messages) == 1
    edited = telegram_client.edited_messages[0]
    assert edited["chat_id"] == mentor_chat_id
    assert edited["message_id"] == 44
    assert "ACCEPTED ✅" in edited["text"]
    assert edited["reply_markup"] is None  # Buttons removed

    # 5. Verify mentee (student_101, chat 111222333) received notification
    assert len(telegram_client.sent_messages) == 1
    student_notification = telegram_client.sent_messages[0]
    assert student_notification["chat_id"] == 111222333
    assert "<b>ACCEPTED</b> your request" in student_notification["text"]


def test_decline_callback_handling(client, webhook_headers, backend_headers):
    """Test mentor pressing 'Decline Request' button updates backend and message UI."""
    client.post("/api/v1/events/mentorship", json={
        "event_id": "evt_req_104",
        "event_type": "mentorship.request.created",
        "request_id": "req_104",
        "mentor_id": "alumni_001",
        "mentee_id": "student_101",
        "mentee_name": "Divyansh Garg",
        "topic": "Frontend CSS",
        "message": "Help with CSS layout.",
        "skills": ["CSS"],
        "created_at": "2026-10-18T10:00:00Z",
        "expires_at": "2026-10-20T10:00:00Z"
    }, headers=backend_headers)
    telegram_client.sent_messages.clear()

    mentor_chat_id = 987654321
    callback_payload = {
        "update_id": 3002,
        "callback_query": {
            "id": "cb_query_decline_1",
            "from": {"id": mentor_chat_id, "is_bot": False, "first_name": "Priya"},
            "message": {
                "message_id": 45,
                "date": int(time.time()),
                "chat": {"id": mentor_chat_id, "type": "private"},
                "text": "Initial mentorship request text"
            },
            "data": "mentor_act:decline:req_104"
        }
    }
    res = client.post("/api/v1/webhooks/telegram", json=callback_payload, headers=webhook_headers)
    assert res.status_code == 200

    # Verify callback answer & message edit
    assert "successfully declined" in telegram_client.answered_callbacks[0]["text"]
    assert "DECLINED ❌" in telegram_client.edited_messages[0]["text"]

    # Verify student is notified that request was declined and fallback matching will assist
    assert "<b>DECLINED</b> your request" in telegram_client.sent_messages[0]["text"]
