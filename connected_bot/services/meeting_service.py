"""Meeting coordination service for handling proposals, responses, and mutual confirmations."""

import logging
from typing import Dict, Any, Optional
from connected_bot.models import (
    MeetingProposedEvent,
    MeetingDecisionSubmission,
    MeetingConfirmedEvent,
)
from connected_bot.backend_client import backend_client
from connected_bot.client import telegram_client

logger = logging.getLogger(__name__)


class MeetingCoordinationService:
    """Manages meeting proposals, participant scheduling responses, and mutual confirmations."""

    def __init__(self, backend=None, telegram=None):
        self.backend = backend or backend_client
        self.telegram = telegram or telegram_client

    async def handle_meeting_proposed(self, event: MeetingProposedEvent) -> Dict[str, Any]:
        """Notifies the recipient when a meeting time is proposed."""
        # Register meeting in backend state
        self.backend.register_meeting({
            "meeting_id": event.meeting_id,
            "request_id": event.request_id,
            "proposer_id": event.proposer_id,
            "proposer_name": event.proposer_name,
            "recipient_id": event.recipient_id,
            "proposed_time": event.proposed_time,
            "duration_minutes": event.duration_minutes,
            "topic": event.topic,
            "agenda": event.agenda
        })

        chat_id = await self.backend.get_telegram_chat_by_user_id(event.recipient_id)
        if not chat_id:
            logger.warning(f"[MEETING] Recipient {event.recipient_id} has not linked Telegram.")
            return {"status": "UNLINKED", "delivered": False}

        text = (
            f"📅 <b>New Mentorship Meeting Proposed!</b>\n\n"
            f"<b>From:</b> {event.proposer_name}\n"
            f"<b>Topic:</b> {event.topic}\n"
            f"<b>Proposed Time:</b> <code>{event.proposed_time}</code>\n"
            f"<b>Duration:</b> {event.duration_minutes} minutes\n\n"
            f"Please respond below to coordinate:"
        )

        reply_markup = {
            "inline_keyboard": [
                [
                    {
                        "text": "✅ Accept Proposed Time",
                        "callback_data": f"meet_act:confirm:{event.meeting_id}"
                    },
                    {
                        "text": "🔄 Propose Reschedule",
                        "callback_data": f"meet_act:reschedule:{event.meeting_id}"
                    }
                ]
            ]
        }

        res = await self.telegram.send_message(chat_id=chat_id, text=text, reply_markup=reply_markup)
        return {"status": "DELIVERED", "delivered": res.get("ok", False)}

    async def handle_meeting_callback(
        self,
        callback_query_id: str,
        telegram_user_id: int,
        chat_id: int,
        message_id: int,
        action: str,
        meeting_id: str
    ) -> Dict[str, Any]:
        """Processes user response to a meeting proposal."""
        user = await self.backend.get_user_by_telegram_id(telegram_user_id)
        if not user:
            await self.telegram.answer_callback_query(
                callback_query_id,
                text="⚠️ Telegram account not linked to connectED.",
                show_alert=True
            )
            return {"success": False, "message": "User not linked"}

        submission = MeetingDecisionSubmission(
            meeting_id=meeting_id,
            responder_id=user["id"],
            telegram_user_id=telegram_user_id,
            action=action
        )
        res = await self.backend.submit_meeting_decision(submission)

        if res.get("status") == "CONFIRMED":
            await self.telegram.answer_callback_query(
                callback_query_id,
                text="Meeting mutually confirmed! 🎉",
                show_alert=False
            )
            updated_text = (
                f"📅 <b>Mentorship Meeting (CONFIRMED ✅)</b>\n\n"
                f"Both participants have mutually agreed on the proposed time.\n"
                f"A calendar invite and meeting link have been dispatched."
            )
            await self.telegram.edit_message_text(
                chat_id=chat_id,
                message_id=message_id,
                text=updated_text,
                reply_markup=None
            )
        elif res.get("status") == "AWAITING_COUNTERPART":
            await self.telegram.answer_callback_query(
                callback_query_id,
                text="Your response recorded. Waiting for mutual confirmation.",
                show_alert=False
            )
        else:
            await self.telegram.answer_callback_query(
                callback_query_id,
                text=f"{res.get('message')}",
                show_alert=True
            )

        return res

    async def handle_meeting_confirmed(self, event: MeetingConfirmedEvent):
        """Dispatches mutual confirmation notice to both student and mentor."""
        logger.info(f"[MEETING MUTUAL CONFIRMATION] Meeting {event.meeting_id} mutually agreed.")

        text = (
            f"🎉 <b>Meeting Confirmed!</b>\n\n"
            f"<b>Scheduled Time:</b> <code>{event.confirmed_time}</code>\n"
            f"<b>Duration:</b> {event.duration_minutes} minutes\n"
            f"<b>Meeting Link:</b> <a href=\"{event.meeting_link}\">Join Meeting Room</a>\n\n"
            f"🔔 Please join on time. A reminder will be sent 15 minutes before the session."
        )

        for user_id in [event.student_id, event.mentor_id]:
            chat_id = await self.backend.get_telegram_chat_by_user_id(user_id)
            if chat_id:
                await self.telegram.send_message(chat_id=chat_id, text=text)


# Global meeting coordination service
meeting_service = MeetingCoordinationService()
