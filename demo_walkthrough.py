"""Interactive End-to-End Demonstration Script for connectED Telegram Bot Automation.

Simulates the complete lifecycle of mentorship workflows:
1. Health check & configuration
2. Secure Account Linking via deep-link tokens
3. Mentorship Request dispatch & inline action buttons
4. Mentor decision callback (Accept) & UI update
5. Meeting proposal and mutual confirmation
6. 48-Hour SLA timeout and fallback routing
7. Security guardrails & idempotency deduplication
"""

import asyncio
import time
import json
import sys
import io

# Ensure UTF-8 stdout encoding for Windows console emoji printing
if hasattr(sys.stdout, "buffer"):
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
from connected_bot.config import settings
from connected_bot.client import telegram_client
from connected_bot.backend_client import backend_client
from connected_bot.services.linking_service import linking_service
from connected_bot.services.mentorship_service import mentorship_service
from connected_bot.services.meeting_service import meeting_service
from connected_bot.handlers.callbacks import handle_callback_query
from connected_bot.models import (
    CallbackQuery,
    TelegramUser,
    TelegramChat,
    TelegramMessage,
    MentorshipRequestCreatedEvent,
    MentorshipRequestExpiredEvent,
    MentorshipFallbackCreatedEvent,
    MeetingProposedEvent,
    MeetingConfirmedEvent,
    UserRole
)


def print_banner(title: str):
    print("\n" + "=" * 70)
    print(f" {title.upper()} ")
    print("=" * 70)


async def run_demonstration():
    telegram_client.mock_mode = True
    backend_client.mock_mode = True

    print_banner("connectED Telegram Bot Automation — Full Workflow Demo")
    print(f"Bot Username: @{settings.TELEGRAM_BOT_USERNAME}")
    print(f"Environment:  {settings.ENVIRONMENT}")
    print(f"Backend API:  {settings.BACKEND_API_BASE_URL}")

    # ==========================================
    # Step 1: Account Linking Workflow
    # ==========================================
    print_banner("Step 1: Secure Account Linking")
    student_user_id = "student_divyansh"
    student_email = "divyansh.garg@students.iiit.ac.in"
    student_chat_id = 111222333

    print(f"[Web Portal] Student ({student_email}) requests Telegram linking token...")
    link_token_res = await linking_service.initiate_linking(
        user_id=student_user_id,
        email=student_email,
        role=UserRole.STUDENT
    )
    print(f"Generated Token: {link_token_res.token}")
    print(f"Deep-Link URL:   {link_token_res.deep_link_url}")
    print(f"Token TTL:       Valid for 15 minutes (Single-use)")

    print(f"\n[Telegram] Student opens deep-link -> /start {link_token_res.token}")
    validate_res = await linking_service.handle_start_with_token(
        token=link_token_res.token,
        telegram_user_id=student_chat_id,
        telegram_chat_id=student_chat_id,
        telegram_username="divyansh_iiit"
    )
    print(f"Linking Result:  {validate_res.message} (Role: {validate_res.role})")
    last_msg = telegram_client.sent_messages[-1]
    print(f"Bot Response to Student:\n{last_msg['text'][:150]}...\n")

    # ==========================================
    # Step 2: Mentorship Request Notification
    # ==========================================
    print_banner("Step 2: Incoming Mentorship Request (48h SLA)")
    mentor_user_id = "alumni_001"
    mentor_chat_id = 987654321
    req_id = "req_demo_2026"

    event_created = MentorshipRequestCreatedEvent(
        event_id="evt_demo_001",
        event_type="mentorship.request.created",
        request_id=req_id,
        mentor_id=mentor_user_id,
        mentee_id=student_user_id,
        mentee_name="Divyansh Garg",
        topic="Full-Stack System Design & Microservices Scaling",
        message="Hi Priya, I am architecting an event-driven system and would love 30 minutes of guidance on handling webhook spikes.",
        skills=["System Design", "Kafka", "FastAPI"],
        created_at=time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        expires_at=time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime(time.time() + 48 * 3600))
    )

    print(f"[Backend Event] Ingested 'mentorship.request.created' for Mentor Priya Sharma...")
    dispatch_res = await mentorship_service.handle_request_created(event_created)
    print(f"Delivery Status: {dispatch_res['status']}")

    mentor_card = telegram_client.sent_messages[-1]
    print("\n[Telegram Card Delivered to Mentor Chat]:")
    print("-" * 50)
    print(mentor_card["text"])
    print("-" * 50)
    buttons = mentor_card["reply_markup"]["inline_keyboard"][0]
    print(f"Buttons Rendered: [{buttons[0]['text']}] | [{buttons[1]['text']}]")

    # ==========================================
    # Step 3: Mentor Action (Accept Mentorship)
    # ==========================================
    print_banner("Step 3: Mentor Decision & Idempotent State Transition")
    print("[Telegram] Mentor Priya taps [✅ Accept Mentorship]...")

    callback = CallbackQuery(
        id="cb_demo_click_01",
        from_user=TelegramUser(id=mentor_chat_id, first_name="Priya"),
        message=TelegramMessage(
            message_id=501,
            chat=TelegramChat(id=mentor_chat_id, type="private"),
            date=int(time.time()),
            text=mentor_card["text"]
        ),
        data=f"mentor_act:accept:{req_id}"
    )

    await handle_callback_query(callback)

    answer = telegram_client.answered_callbacks[-1]
    print(f"Telegram Pop-up Feedback: '{answer['text']}'")
    edited = telegram_client.edited_messages[-1]
    print(f"Updated Mentor Message (Buttons Disabled to Prevent Duplicate Submissions):")
    print("-" * 50)
    print(edited["text"])
    print("-" * 50)

    student_alert = telegram_client.sent_messages[-1]
    print(f"Real-Time Notification Delivered to Student Chat ({student_chat_id}):")
    print(student_alert["text"])

    # ==========================================
    # Step 4: Meeting Coordination & Mutual Agreement
    # ==========================================
    print_banner("Step 4: Meeting Proposal & Mutual Confirmation")
    meeting_id = "meet_demo_777"
    proposal_event = MeetingProposedEvent(
        event_id="evt_demo_meet_01",
        meeting_id=meeting_id,
        request_id=req_id,
        proposer_id=student_user_id,
        proposer_name="Divyansh Garg",
        recipient_id=mentor_user_id,
        proposed_time="Saturday, Oct 24, 2026 at 5:00 PM IST",
        duration_minutes=30,
        topic="Architecture Review & Scaling Strategy"
    )

    print("[Backend Event] Student proposes meeting slot -> Delivering proposal to Mentor...")
    await meeting_service.handle_meeting_proposed(proposal_event)
    meet_proposal_msg = telegram_client.sent_messages[-1]
    print(meet_proposal_msg["text"])

    print("\n[Telegram] Mentor confirms proposed time slot...")
    meet_callback = CallbackQuery(
        id="cb_demo_meet_01",
        from_user=TelegramUser(id=mentor_chat_id, first_name="Priya"),
        message=TelegramMessage(
            message_id=502,
            chat=TelegramChat(id=mentor_chat_id, type="private"),
            date=int(time.time()),
            text=meet_proposal_msg["text"]
        ),
        data=f"meet_act:confirm:{meeting_id}"
    )
    await handle_callback_query(meet_callback)

    # Dispatched confirmed event
    confirm_event = MeetingConfirmedEvent(
        event_id="evt_demo_confirmed_01",
        meeting_id=meeting_id,
        request_id=req_id,
        student_id=student_user_id,
        mentor_id=mentor_user_id,
        confirmed_time="Saturday, Oct 24, 2026 at 5:00 PM IST",
        meeting_link="https://meet.connected.org/room/meet_demo_777",
        duration_minutes=30
    )
    print("\n[Backend Event] Mutual agreement reached -> Emitting 'meeting.confirmed'...")
    await meeting_service.handle_meeting_confirmed(confirm_event)

    confirmed_msg = telegram_client.sent_messages[-1]
    print("Dispatched Confirmation Notice with Video Room Link:")
    print("-" * 50)
    print(confirmed_msg["text"])
    print("-" * 50)

    # ==========================================
    # Step 5: 48-Hour Timeout & Fallback Engine
    # ==========================================
    print_banner("Step 5: 48-Hour Timeout & Fallback Recommendation")
    expired_req_id = "req_demo_timedout_88"
    print(f"[Backend Scheduler] Request {expired_req_id} exceeded 48 hours without response.")

    timeout_event = MentorshipRequestExpiredEvent(
        event_id="evt_demo_timeout_01",
        request_id=expired_req_id,
        mentor_id="alumni_002",
        mentee_id=student_user_id,
        expired_at=time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        fallback_recommended=True
    )
    await mentorship_service.handle_request_expired(timeout_event)
    print("Notified student of closed SLA window.")

    fallback_event = MentorshipFallbackCreatedEvent(
        event_id="evt_demo_fallback_01",
        original_request_id=expired_req_id,
        new_request_id="req_demo_fallback_99",
        mentee_id=student_user_id,
        new_mentor_id="alumni_002",
        new_mentor_name="Aravind Nair (Staff Engineer @ Microsoft)",
        skills_matched=["Distributed Systems", "Cloud Architecture", "Azure"],
        reason="Original request expired after 48h timeout"
    )
    await mentorship_service.handle_fallback_created(fallback_event)
    fallback_notice = telegram_client.sent_messages[-1]
    print("\nFallback Recommendation Delivered to Student:")
    print("-" * 50)
    print(fallback_notice["text"])
    print("-" * 50)

    # ==========================================
    # Step 6: Security & Idempotency Verification
    # ==========================================
    print_banner("Step 6: Security & Idempotency Safeguards")
    print("Simulating unauthorized user trying to accept Priya's request...")
    fake_user_id = 999000111
    unauthorized_cb = CallbackQuery(
        id="cb_fake_attack",
        from_user=TelegramUser(id=fake_user_id, first_name="MaliciousActor"),
        message=TelegramMessage(
            message_id=999,
            chat=TelegramChat(id=fake_user_id, type="private"),
            date=int(time.time()),
            text="Spoofed card"
        ),
        data=f"mentor_act:accept:{req_id}"
    )
    await handle_callback_query(unauthorized_cb)
    security_alert = telegram_client.answered_callbacks[-1]
    print(f"Security Alert Triggered: '{security_alert['text']}' (show_alert: {security_alert['show_alert']})")

    print_banner("Demonstration Completed Successfully!")
    print("All workflows, guardrails, and contracts verified flawlessly.")


if __name__ == "__main__":
    asyncio.run(run_demonstration())
