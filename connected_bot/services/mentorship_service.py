"""Mentorship workflow service handling notifications, Accept/Decline callbacks, and timeout fallbacks."""

import logging
import time
from typing import Dict, Any, Optional
from connected_bot.models import (
    MentorshipRequestCreatedEvent,
    MentorshipDecisionSubmission,
    MentorshipDecisionResponse,
    MentorshipActionType,
    MentorshipStatus,
    MentorshipRequestExpiredEvent,
    MentorshipFallbackCreatedEvent,
)
from connected_bot.backend_client import backend_client
from connected_bot.client import telegram_client

logger = logging.getLogger(__name__)


class MentorshipService:
    """Manages mentorship request delivery, callback decisions, and fallback notifications."""

    def __init__(self, backend=None, telegram=None):
        self.backend = backend or backend_client
        self.telegram = telegram or telegram_client
        # Track delivery outcomes for audits
        self.delivery_records: list = []

    # ==========================================
    # 1. Ingest New Request & Notify Mentor
    # ==========================================

    async def handle_request_created(self, event: MentorshipRequestCreatedEvent) -> Dict[str, Any]:
        """Triggered by backend when a student requests mentorship from an alumnus."""
        logger.info(f"[MENTORSHIP] Processing request created: {event.request_id} for mentor {event.mentor_id}")

        # Register in backend state if mock mode is active
        self.backend.register_mentorship_request({
            "request_id": event.request_id,
            "mentor_id": event.mentor_id,
            "mentee_id": event.mentee_id,
            "mentee_name": event.mentee_name,
            "topic": event.topic,
            "message": event.message,
            "skills": event.skills,
            "status": MentorshipStatus.PENDING.value,
            "created_at": event.created_at,
            "expires_at": event.expires_at,
            "expires_at_timestamp": time.time() + (48 * 3600)  # 48 hour window
        })

        # Resolve mentor's Telegram chat
        chat_id = await self.backend.get_telegram_chat_by_user_id(event.mentor_id)
        if not chat_id:
            record = {
                "request_id": event.request_id,
                "mentor_id": event.mentor_id,
                "status": "UNLINKED_OR_OPTED_OUT",
                "delivered": False,
                "timestamp": time.time(),
                "reason": "Alumnus has not linked Telegram or has opted out"
            }
            self.delivery_records.append(record)
            logger.warning(f"[MENTORSHIP NOTIFICATION] Mentor {event.mentor_id} not linked to Telegram. Saved delivery record.")
            return {"status": "UNLINKED", "delivered": False, "message": "Mentor is not linked on Telegram"}

        # Format privacy-preserving notification message
        skills_badge = " • ".join(event.skills) if event.skills else "General Career Guidance"
        notification_text = (
            f"🎓 <b>New Mentorship Request!</b>\n\n"
            f"<b>Student:</b> {event.mentee_name}\n"
            f"<b>Topic:</b> {event.topic}\n"
            f"<b>Skills:</b> {skills_badge}\n\n"
            f"💬 <b>Message:</b>\n"
            f"<i>\"{event.message}\"</i>\n\n"
            f"⏳ <b>Response Deadline:</b> 48 Hours\n"
            f"<i>Request ID:</i> <code>{event.request_id}</code>\n\n"
            f"Would you like to mentor this student?"
        )

        reply_markup = {
            "inline_keyboard": [
                [
                    {
                        "text": "✅ Accept Mentorship",
                        "callback_data": f"mentor_act:accept:{event.request_id}"
                    },
                    {
                        "text": "❌ Decline Request",
                        "callback_data": f"mentor_act:decline:{event.request_id}"
                    }
                ]
            ]
        }

        try:
            res = await self.telegram.send_message(
                chat_id=chat_id,
                text=notification_text,
                reply_markup=reply_markup
            )
            delivered = res.get("ok", False)
            record = {
                "request_id": event.request_id,
                "mentor_id": event.mentor_id,
                "chat_id": chat_id,
                "status": "DELIVERED" if delivered else "FAILED",
                "delivered": delivered,
                "timestamp": time.time(),
                "telegram_response": res
            }
            self.delivery_records.append(record)
            return {"status": "DELIVERED" if delivered else "FAILED", "delivered": delivered}
        except Exception as exc:
            logger.error(f"[MENTORSHIP ERROR] Failed to send message to {chat_id}: {exc}")
            self.delivery_records.append({
                "request_id": event.request_id,
                "mentor_id": event.mentor_id,
                "chat_id": chat_id,
                "status": "ERROR",
                "delivered": False,
                "timestamp": time.time(),
                "error": str(exc)
            })
            return {"status": "ERROR", "delivered": False, "error": str(exc)}

    # ==========================================
    # 2. Process Accept / Decline Callback
    # ==========================================

    async def handle_decision_callback(
        self,
        callback_query_id: str,
        telegram_user_id: int,
        chat_id: int,
        message_id: int,
        action: str,
        request_id: str
    ) -> MentorshipDecisionResponse:
        """Processes when a mentor clicks Accept or Decline in Telegram."""
        logger.info(f"[CALLBACK] User {telegram_user_id} clicked {action} on request {request_id}")

        # 1. Resolve authorized user
        user = await self.backend.get_user_by_telegram_id(telegram_user_id)
        if not user:
            await self.telegram.answer_callback_query(
                callback_query_id,
                text="⚠️ Your Telegram account is not linked to connectED.",
                show_alert=True
            )
            return MentorshipDecisionResponse(
                success=False,
                status=MentorshipStatus.PENDING,
                message="User not linked",
                updated_at=time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
            )

        # 2. Check if the request is still pending
        existing_req = await self.backend.get_mentorship_request(request_id)
        if not existing_req:
            await self.telegram.answer_callback_query(
                callback_query_id,
                text="⚠️ Mentorship request not found or removed.",
                show_alert=True
            )
            return MentorshipDecisionResponse(
                success=False,
                status=MentorshipStatus.EXPIRED,
                message="Request not found",
                updated_at=time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
            )

        # 3. Submit decision to authoritative backend
        submission = MentorshipDecisionSubmission(
            request_id=request_id,
            mentor_user_id=user["id"],
            telegram_user_id=telegram_user_id,
            action=MentorshipActionType(action)
        )
        response = await self.backend.submit_mentorship_decision(submission)

        # 4. Handle UI feedback and idempotency
        if response.success:
            action_display = "accepted" if action == "accept" else "declined"
            action_text = "ACCEPTED ✅" if action == "accept" else "DECLINED ❌"
            await self.telegram.answer_callback_query(
                callback_query_id,
                text=f"Request successfully {action_display}!",
                show_alert=False
            )
            # Update message to disable buttons and show definitive state
            updated_text = (
                f"🎓 <b>Mentorship Request ({action_text})</b>\n\n"
                f"<b>Student:</b> {existing_req.get('mentee_name')}\n"
                f"<b>Topic:</b> {existing_req.get('topic')}\n\n"
                f"<b>Status:</b> You {action}ed this request on {response.updated_at}.\n\n"
                f"{'🤝 A meeting proposal will follow shortly!' if action == 'accept' else '🙏 Thank you for your prompt response.'}"
            )
            await self.telegram.edit_message_text(
                chat_id=chat_id,
                message_id=message_id,
                text=updated_text,
                reply_markup=None  # Remove action buttons to prevent repeated clicks
            )

            # Also notify the mentee/student if student is linked
            mentee_id = existing_req.get("mentee_id")
            if mentee_id:
                student_chat_id = await self.backend.get_telegram_chat_by_user_id(mentee_id)
                if student_chat_id:
                    action_verb_caps = "ACCEPTED" if action == "accept" else "DECLINED"
                    student_msg = (
                        f"📢 <b>Mentorship Update!</b>\n\n"
                        f"Alumnus <b>{user.get('name', 'Your mentor')}</b> has <b>{action_verb_caps}</b> your request for "
                        f"<i>\"{existing_req.get('topic')}\"</i>.\n\n"
                        f"{'Next step: You can now propose a meeting time in connectED!' if action == 'accept' else 'Our AI matching engine will recommend alternative alumni mentors for you shortly.'}"
                    )
                    await self.telegram.send_message(student_chat_id, student_msg)

        else:
            # Inform mentor if expired, already processed, or unauthorized
            await self.telegram.answer_callback_query(
                callback_query_id,
                text=f"⚠️ {response.message}",
                show_alert=True
            )
            # If already processed or expired, update the message UI
            if response.status in [MentorshipStatus.ACCEPTED, MentorshipStatus.DECLINED, MentorshipStatus.EXPIRED]:
                status_label = response.status.value
                updated_text = (
                    f"🎓 <b>Mentorship Request ({status_label})</b>\n\n"
                    f"<b>Student:</b> {existing_req.get('mentee_name')}\n"
                    f"<b>Topic:</b> {existing_req.get('topic')}\n\n"
                    f"<i>Note: {response.message}</i>"
                )
                await self.telegram.edit_message_text(
                    chat_id=chat_id,
                    message_id=message_id,
                    text=updated_text,
                    reply_markup=None
                )

        return response

    # ==========================================
    # 3. Timeout & Fallback Event Handlers
    # ==========================================

    async def handle_request_expired(self, event: MentorshipRequestExpiredEvent):
        """Consumes backend event when a request times out (48 hours)."""
        logger.info(f"[TIMEOUT] Request {event.request_id} expired. Notifying participants.")

        # 1. Notify Student
        student_chat = await self.backend.get_telegram_chat_by_user_id(event.mentee_id)
        if student_chat:
            student_text = (
                f"⏳ <b>Mentorship Request Update</b>\n\n"
                f"Your mentorship request (ID: <code>{event.request_id}</code>) reached its 48-hour response window without a reply.\n\n"
                f"🔄 <b>Automatic Fallback Active:</b> connectED is finding the next best-matched alumni mentor for you.\n"
                f"We will notify you as soon as the fallback match is ready!"
            )
            await self.telegram.send_message(student_chat, student_text)

        # 2. Notify Mentor
        mentor_chat = await self.backend.get_telegram_chat_by_user_id(event.mentor_id)
        if mentor_chat:
            mentor_text = (
                f"⏳ <b>Request Closed</b>\n\n"
                f"Mentorship request <code>{event.request_id}</code> has expired as the 48-hour response window elapsed.\n"
                f"The request has been routed to alternative alumni."
            )
            await self.telegram.send_message(mentor_chat, mentor_text)

    async def handle_fallback_created(self, event: MentorshipFallbackCreatedEvent):
        """Consumes backend event when fallback engine selects a replacement mentor."""
        logger.info(f"[FALLBACK] Re-routed expired request {event.original_request_id} -> new request {event.new_request_id}")

        # Inform Student of fallback recommendation
        student_chat = await self.backend.get_telegram_chat_by_user_id(event.mentee_id)
        if student_chat:
            skills_str = ", ".join(event.skills_matched) if event.skills_matched else "Relevant domain expertise"
            student_text = (
                f"✨ <b>Fallback Mentor Recommended!</b>\n\n"
                f"Good news! We have routed your request to <b>{event.new_mentor_name}</b>.\n"
                f"<b>Matched Skills:</b> {skills_str}\n\n"
                f"A new 48-hour request has been sent. We will keep you updated!"
            )
            await self.telegram.send_message(student_chat, student_text)


# Global mentorship service instance
mentorship_service = MentorshipService()
