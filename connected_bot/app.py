"""FastAPI Webhook & Event Router for connectED Telegram Bot Service."""

import logging
from typing import Dict, Any, Optional
from fastapi import FastAPI, Header, HTTPException, Depends, Request, status
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware

from connected_bot.config import settings
from connected_bot.models import (
    TelegramUpdate,
    LinkInitiateRequest,
    LinkInitiateResponse,
    MentorshipRequestCreatedEvent,
    MentorshipRequestExpiredEvent,
    MentorshipFallbackCreatedEvent,
    MeetingProposedEvent,
    MeetingConfirmedEvent,
)
from connected_bot.idempotency import idempotency_store
from connected_bot.handlers.commands import (
    handle_start_command,
    handle_link_command,
    handle_unlink_command,
    handle_status_command,
    handle_help_command,
)
from connected_bot.handlers.callbacks import handle_callback_query
from connected_bot.services.linking_service import linking_service
from connected_bot.services.mentorship_service import mentorship_service
from connected_bot.services.meeting_service import meeting_service
from connected_bot.services.ai_bot_assistant import ai_bot_assistant

logging.basicConfig(level=settings.LOG_LEVEL, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("connected_bot")

app = FastAPI(
    title="connectED Telegram Bot Automation Service",
    description="Official Telegram Bot webhook, account linking, and mentorship event coordinator for connectED.",
    version="1.0.0"
)

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==========================================
# Security Middleware / Verification
# ==========================================

def verify_telegram_secret(
    x_telegram_bot_api_secret_token: Optional[str] = Header(None, alias="X-Telegram-Bot-Api-Secret-Token")
):
    """Verifies that incoming webhook requests originate from the official Telegram Bot API."""
    expected_token = settings.TELEGRAM_WEBHOOK_SECRET_TOKEN
    if not expected_token:
        return True  # If no secret configured in dev mode, allow

    if not x_telegram_bot_api_secret_token or x_telegram_bot_api_secret_token != expected_token:
        logger.warning(
            f"[SECURITY ALERT] Invalid or missing Telegram secret token: received '{x_telegram_bot_api_secret_token}'"
        )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: Invalid or missing Telegram secret token"
        )
    return True


def verify_backend_service_auth(
    authorization: Optional[str] = Header(None)
):
    """Verifies internal service token for backend-to-bot events."""
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing Authorization header"
        )

    expected = f"Bearer {settings.BACKEND_SERVICE_TOKEN}"
    if authorization != expected:
        logger.warning(f"[SECURITY ALERT] Invalid backend service token: {authorization}")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: Invalid service credentials"
        )
    return True


# ==========================================
# 1. Health & Status Endpoints
# ==========================================

@app.get("/health")
@app.get("/api/v1/health")
async def health_check():
    """Health check endpoint for monitoring."""
    return {
        "status": "healthy",
        "service": "connectED Telegram Bot Service",
        "version": "1.0.0",
        "environment": settings.ENVIRONMENT,
        "bot_username": settings.TELEGRAM_BOT_USERNAME
    }


# ==========================================
# 2. Account Linking API
# ==========================================

@app.post("/api/v1/telegram/link/initiate", response_model=LinkInitiateResponse)
async def initiate_link_token(request: LinkInitiateRequest):
    """Initiates an account linking flow by issuing a single-use token and deep-link URL."""
    logger.info(f"[API LINK INITIATE] Initiating linking token for user {request.user_id} ({request.email})")
    return await linking_service.initiate_linking(
        user_id=request.user_id,
        email=request.email,
        role=request.role
    )


# ==========================================
# 3. Telegram Webhook Endpoint
# ==========================================

@app.post("/api/v1/webhooks/telegram")
async def telegram_webhook(
    update: TelegramUpdate,
    _authorized: bool = Depends(verify_telegram_secret)
):
    """Primary webhook endpoint receiving real-time updates from official Telegram Bot API."""
    update_id = update.update_id
    logger.debug(f"[WEBHOOK] Received update_id: {update_id}")

    # Idempotency check: deduplicate Telegram updates
    if not idempotency_store.check_and_set(f"upd:{update_id}", ttl_seconds=settings.IDEMPOTENCY_TTL_SECONDS):
        logger.info(f"[IDEMPOTENCY] Telegram update {update_id} already processed. Acknowledging with 200 OK.")
        return {"ok": True, "duplicate": True}

    # Handle incoming Message
    if update.message and update.message.text:
        msg = update.message
        text = msg.text.strip()
        cmd = text.split()[0].lower()

        if cmd == "/start":
            await handle_start_command(msg)
        elif cmd == "/link":
            await handle_link_command(msg)
        elif cmd in ["/unlink", "/optout"]:
            await handle_unlink_command(msg)
        elif cmd == "/status":
            await handle_status_command(msg)
        elif cmd == "/help":
            await handle_help_command(msg)
        else:
            # Route free-form text to AI Mentorship Assistant
            user_name = msg.from_user.first_name if msg.from_user else "Friend"
            user_id = msg.from_user.id if msg.from_user else 0
            await ai_bot_assistant.handle_conversational_message(
                chat_id=msg.chat.id,
                telegram_user_id=user_id,
                user_text=text,
                user_name=user_name
            )

    # Handle incoming Callback Query (Inline Button Click)
    elif update.callback_query:
        await handle_callback_query(update.callback_query)

    return {"ok": True}


# ==========================================
# 4. Backend Internal Event Ingestion
# ==========================================

@app.post("/api/v1/events/mentorship")
async def ingest_backend_event(
    event_payload: Dict[str, Any],
    _auth: bool = Depends(verify_backend_service_auth)
):
    """Consumes agreed internal application events emitted by connectED backend."""
    event_type = event_payload.get("event_type")
    event_id = event_payload.get("event_id")

    if not event_type or not event_id:
        raise HTTPException(status_code=400, detail="Missing required event_type or event_id")

    # Idempotency check for backend events
    if not idempotency_store.check_and_set(f"event:{event_id}", ttl_seconds=settings.IDEMPOTENCY_TTL_SECONDS):
        logger.info(f"[IDEMPOTENCY] Backend event {event_id} already processed. Skipping duplicate.")
        return {"status": "DUPLICATE", "event_id": event_id}

    logger.info(f"[EVENT INGEST] Processing event '{event_type}' (ID: {event_id})")

    if event_type == "mentorship.request.created":
        event = MentorshipRequestCreatedEvent(**event_payload)
        res = await mentorship_service.handle_request_created(event)
        return {"status": "PROCESSED", "result": res}

    elif event_type == "mentorship.request.expired":
        event = MentorshipRequestExpiredEvent(**event_payload)
        await mentorship_service.handle_request_expired(event)
        return {"status": "PROCESSED", "event": "expired"}

    elif event_type == "mentorship.fallback.created":
        event = MentorshipFallbackCreatedEvent(**event_payload)
        await mentorship_service.handle_fallback_created(event)
        return {"status": "PROCESSED", "event": "fallback"}

    elif event_type == "meeting.proposed":
        event = MeetingProposedEvent(**event_payload)
        res = await meeting_service.handle_meeting_proposed(event)
        return {"status": "PROCESSED", "result": res}

    elif event_type == "meeting.confirmed":
        event = MeetingConfirmedEvent(**event_payload)
        await meeting_service.handle_meeting_confirmed(event)
        return {"status": "PROCESSED", "event": "meeting_confirmed"}

    else:
        logger.warning(f"[EVENT INGEST] Unknown event type: {event_type}")
        return {"status": "IGNORED", "message": f"Unknown event type: {event_type}"}
