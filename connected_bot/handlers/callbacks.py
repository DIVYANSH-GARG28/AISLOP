"""Telegram Bot callback query handlers for inline button interactions."""

import logging
from connected_bot.models import CallbackQuery
from connected_bot.services.mentorship_service import mentorship_service
from connected_bot.services.meeting_service import meeting_service
from connected_bot.idempotency import idempotency_store
from connected_bot.client import telegram_client

logger = logging.getLogger(__name__)


async def handle_callback_query(callback: CallbackQuery):
    """Dispatches inline button clicks with idempotency and duplicate click prevention."""
    data = callback.data or ""
    query_id = callback.id
    user = callback.from_user
    msg = callback.message

    if not msg:
        logger.warning(f"[CALLBACK] Callback {query_id} has no message context")
        await telegram_client.answer_callback_query(query_id, text="Error: No message context.")
        return

    chat_id = msg.chat.id
    message_id = msg.message_id

    # Deduplicate repeated callback queries
    if not idempotency_store.check_and_set(f"cb_id:{query_id}", ttl_seconds=300):
        logger.info(f"[IDEMPOTENCY] Ignoring duplicate callback query {query_id}")
        await telegram_client.answer_callback_query(query_id, text="Request already being processed...")
        return

    # Route 1: Mentorship Accept / Decline Callback
    if data.startswith("mentor_act:"):
        parts = data.split(":")
        if len(parts) != 3:
            await telegram_client.answer_callback_query(query_id, text="Invalid callback payload.")
            return

        _, action, request_id = parts

        # Prevent concurrent rapid-fire repeated clicks by the same user on the same request
        click_lock_key = f"mentor_lock:{user.id}:{request_id}"
        if not idempotency_store.check_and_set(click_lock_key, ttl_seconds=10):
            logger.info(f"[IDEMPOTENCY] Concurrent click detected for {click_lock_key}")
            await telegram_client.answer_callback_query(
                query_id,
                text="Please wait, your previous click is still being processed."
            )
            return

        try:
            await mentorship_service.handle_decision_callback(
                callback_query_id=query_id,
                telegram_user_id=user.id,
                chat_id=chat_id,
                message_id=message_id,
                action=action,
                request_id=request_id
            )
        finally:
            idempotency_store.remove(click_lock_key)

    # Route 2: Meeting Confirmation / Reschedule Callback
    elif data.startswith("meet_act:"):
        parts = data.split(":")
        if len(parts) != 3:
            await telegram_client.answer_callback_query(query_id, text="Invalid callback payload.")
            return

        _, action, meeting_id = parts
        await meeting_service.handle_meeting_callback(
            callback_query_id=query_id,
            telegram_user_id=user.id,
            chat_id=chat_id,
            message_id=message_id,
            action=action,
            meeting_id=meeting_id
        )

    else:
        logger.warning(f"[CALLBACK] Unrecognized callback prefix: {data}")
        await telegram_client.answer_callback_query(query_id, text="Unrecognized action.")
