"""Event dispatcher for outbound automations (n8n webhooks & Telegram cards)."""

import logging
import httpx
from typing import Dict, Any, Optional
from connected_backend.config import settings

logger = logging.getLogger("connected.event_dispatcher")


async def dispatch_mentorship_created_event(request_data: Dict[str, Any]):
    """Dispatches request.created event to n8n webhook and direct Telegram card if configured."""
    
    # 1. Dispatch to n8n cloud webhook
    payload = dict(request_data)
    if "_id" in payload:
        payload["_id"] = str(payload["_id"])

    webhook_url = settings.N8N_WEBHOOK_URL
    if webhook_url:
        try:
            async with httpx.AsyncClient(timeout=8.0) as client:
                res = await client.post(webhook_url, json=payload)
                logger.info(f"📡 Dispatched mentorship event to n8n ({webhook_url}): Status {res.status_code}")
        except Exception as e:
            logger.warning(f"⚠️ Failed to dispatch event to n8n ({webhook_url}): {e}")

    # 2. Check if mentor has a linked Telegram chat_id and send direct card
    chat_id = request_data.get("mentor_telegram_chat_id")
    if chat_id and settings.TELEGRAM_BOT_TOKEN:
        try:
            await _send_direct_telegram_card(chat_id, request_data)
        except Exception as e:
            logger.warning(f"⚠️ Failed to dispatch direct Telegram card: {e}")


async def dispatch_institute_otp_event(otp_data: Dict[str, Any]):
    """Dispatches institute OTP event to n8n webhook and linked Telegram user if available."""
    # 1. Clean payload
    payload = dict(otp_data)
    if "_id" in payload:
        payload["_id"] = str(payload["_id"])

    # 2. Dispatch to n8n webhook
    webhook_url = settings.N8N_INSTITUTE_OTP_WEBHOOK_URL
    if webhook_url:
        try:
            async with httpx.AsyncClient(timeout=8.0) as client:
                res = await client.post(webhook_url, json=payload)
                logger.info(f"📡 Dispatched Institute OTP to n8n ({webhook_url}): Status {res.status_code}")
        except Exception as e:
            logger.warning(f"⚠️ Failed to dispatch OTP event to n8n: {e}")

    # 3. If Telegram chat_id provided, also send instant Telegram copy
    chat_id = otp_data.get("telegram_chat_id")
    if chat_id and settings.TELEGRAM_BOT_TOKEN:
        try:
            bot_token = settings.TELEGRAM_BOT_TOKEN
            url = f"https://api.telegram.org/bot{bot_token}/sendMessage"
            email = otp_data.get("email", "")
            otp = otp_data.get("otp", "")
            mins = otp_data.get("expires_in_minutes", 10)
            text = (
                f"🎓 <b>connectED — Institutional Verification Code</b>\n\n"
                f"A verification code was requested for: <code>{email}</code>\n\n"
                f"Your 6-digit OTP code is:\n"
                f"🔢 <b><code>{otp}</code></b>\n\n"
                f"⏳ This code is valid for <b>{mins} minutes</b>.\n"
                f"<i>Never share this code with anyone.</i>"
            )
            async with httpx.AsyncClient(timeout=8.0) as client:
                await client.post(url, json={
                    "chat_id": chat_id,
                    "text": text,
                    "parse_mode": "HTML"
                })
                logger.info(f"📱 Sent verification OTP directly to Telegram chat {chat_id}")
        except Exception as e:
            logger.warning(f"⚠️ Failed to send Telegram OTP copy: {e}")


async def _send_direct_telegram_card(chat_id: int, req: Dict[str, Any]):
    """Sends interactive inline keyboard card directly to mentor's Telegram chat."""
    bot_token = settings.TELEGRAM_BOT_TOKEN
    url = f"https://api.telegram.org/bot{bot_token}/sendMessage"

    topic = req.get("topic", "Mentorship Discussion")
    mentee_name = req.get("mentee_name", "Student")
    skills = req.get("skills", [])
    skills_text = " • ".join(skills) if skills else "General Engineering"
    msg = req.get("message", "Looking forward to your guidance!")
    req_id = req.get("request_id", "req_unknown")
    match_score = req.get("match_score", 90)

    text = (
        f"🎓 <b>New Mentorship Request!</b>\n\n"
        f"<b>Student:</b> {mentee_name}\n"
        f"<b>Topic:</b> {topic}\n"
        f"<b>Skills:</b> {skills_text}\n"
        f"<b>Match Score:</b> {match_score}%\n\n"
        f"💬 <b>Message:</b>\n<i>\"{msg}\"</i>\n\n"
        f"⏳ <b>Response Deadline:</b> 48 Hours\n"
        f"<i>Request ID:</i> <code>{req_id}</code>\n\n"
        f"Would you like to mentor this student?"
    )

    reply_markup = {
        "inline_keyboard": [
            [
                {"text": "Accept Mentorship ✅", "callback_data": f"action:accept:{req_id}"},
                {"text": "Decline Request ❌", "callback_data": f"action:decline:{req_id}"}
            ]
        ]
    }

    async with httpx.AsyncClient(timeout=8.0) as client:
        res = await client.post(url, json={
            "chat_id": chat_id,
            "text": text,
            "parse_mode": "HTML",
            "reply_markup": reply_markup
        })
        if res.status_code == 200:
            logger.info(f"📱 Sent Telegram interactive card to chat {chat_id} for request {req_id}")
        else:
            logger.warning(f"Telegram API response: {res.text}")
