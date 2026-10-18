"""Telegram integration router for account linking, chat resolution, and bot coordination."""

import time
import uuid
import logging
from typing import Dict, Any, Optional
from fastapi import APIRouter, HTTPException, status
from connected_backend.database import db_manager, clean_doc
from connected_backend.config import settings
from connected_backend.models import (
    TelegramLinkInitiateRequest,
    TelegramLinkInitiateResponse,
    TelegramLinkValidateRequest,
    TelegramLinkValidateResponse,
    UserRole
)

logger = logging.getLogger("connected.telegram")

router = APIRouter(tags=["Telegram Integration"])


# ==========================================
# 1. Initiate Linking Token
# ==========================================

async def handle_link_initiate(req: TelegramLinkInitiateRequest) -> TelegramLinkInitiateResponse:
    """Generates a short-lived, single-use linking token with 15-minute TTL."""
    token = f"link_{uuid.uuid4().hex[:16]}"
    now = time.time()
    expires_at = now + settings.LINKING_TOKEN_TTL_SECONDS
    expires_at_iso = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime(expires_at))

    token_doc = {
        "token": token,
        "user_id": req.user_id,
        "email": req.email.lower(),
        "role": req.role.value,
        "created_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime(now)),
        "expires_at": expires_at_iso,
        "expires_at_timestamp": expires_at,
        "is_used": False
    }

    await db_manager.linking_tokens.insert_one(token_doc)

    bot_username = "ZeplyAIBot"
    deep_link = f"https://t.me/{bot_username}?start={token}"

    return TelegramLinkInitiateResponse(
        success=True,
        token=token,
        expires_at=expires_at_iso,
        deep_link_url=deep_link,
        message="Linking token generated successfully. Valid for 15 minutes."
    )


# ==========================================
# 2. Validate and Link Account
# ==========================================

async def handle_link_validate(req: TelegramLinkValidateRequest) -> TelegramLinkValidateResponse:
    """Validates linking token and permanently binds Telegram account to connectED profile."""
    token_doc = await db_manager.linking_tokens.find_one({"token": req.token})
    if not token_doc:
        return TelegramLinkValidateResponse(
            success=False,
            message="Invalid linking token. Please generate a new one from your connectED dashboard."
        )

    if token_doc.get("is_used"):
        return TelegramLinkValidateResponse(
            success=False,
            message="This linking token has already been used. Tokens are strictly single-use."
        )

    now = time.time()
    if now > token_doc.get("expires_at_timestamp", 0):
        return TelegramLinkValidateResponse(
            success=False,
            message="This linking token has expired. Linking tokens are valid for 15 minutes only."
        )

    user_id = token_doc["user_id"]
    user = await db_manager.users.find_one({"id": user_id})

    # If user doesn't exist, create baseline record
    if not user:
        name_guess = token_doc["email"].split("@")[0].replace(".", " ").title()
        user_doc = {
            "id": user_id,
            "email": token_doc["email"],
            "name": name_guess,
            "role": token_doc["role"],
            "telegram_user_id": req.telegram_user_id,
            "telegram_chat_id": req.telegram_chat_id,
            "telegram_username": req.telegram_username,
            "is_opted_out": False,
            "created_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
        }
        await db_manager.users.insert_one(user_doc)
        user = user_doc
    else:
        # Update user binding
        await db_manager.users.update_one(
            {"id": user_id},
            {
                "$set": {
                    "telegram_user_id": req.telegram_user_id,
                    "telegram_chat_id": req.telegram_chat_id,
                    "telegram_username": req.telegram_username,
                    "is_opted_out": False
                }
            }
        )

    # Also update role profile (alumni or student)
    await db_manager.alumni.update_one(
        {"$or": [{"id": user_id}, {"user_id": user_id}]},
        {"$set": {"telegram_user_id": req.telegram_user_id, "telegram_chat_id": req.telegram_chat_id}}
    )
    await db_manager.students.update_one(
        {"$or": [{"id": user_id}, {"user_id": user_id}]},
        {"$set": {"telegram_user_id": req.telegram_user_id, "telegram_chat_id": req.telegram_chat_id}}
    )

    # Consume token
    await db_manager.linking_tokens.update_one(
        {"token": req.token},
        {"$set": {"is_used": True}}
    )

    logger.info(f"✅ Linked user {user_id} to Telegram User ID {req.telegram_user_id}")
    return TelegramLinkValidateResponse(
        success=True,
        user_id=user["id"],
        role=UserRole(user.get("role", "ALUMNI")),
        full_name=user.get("name", "ConnectED User"),
        message="Account successfully linked to connectED!"
    )


# ==========================================
# 3. Unlink Account
# ==========================================

async def handle_unlink(telegram_user_id: int):
    """Unlinks Telegram account and pauses notifications."""
    res = await db_manager.users.update_many(
        {"telegram_user_id": telegram_user_id},
        {"$set": {"telegram_user_id": None, "telegram_chat_id": None, "is_opted_out": True}}
    )
    await db_manager.alumni.update_many(
        {"telegram_user_id": telegram_user_id},
        {"$set": {"telegram_user_id": None, "telegram_chat_id": None}}
    )
    await db_manager.students.update_many(
        {"telegram_user_id": telegram_user_id},
        {"$set": {"telegram_user_id": None, "telegram_chat_id": None}}
    )

    if res.modified_count > 0:
        return {"success": True, "message": "Your Telegram account has been unlinked and notifications paused."}
    return {"success": False, "message": "No connectED account was found linked to this Telegram ID."}


# ==========================================
# Register Routes Under Both Prefixes
# ==========================================

for prefix in ["/api/v1/telegram", "/telegram"]:
    router.add_api_route(f"{prefix}/link/initiate", handle_link_initiate, methods=["POST"])
    router.add_api_route(f"{prefix}/link/validate", handle_link_validate, methods=["POST"])
    
    @router.post(f"{prefix}/unlink")
    async def unlink_route(body: Dict[str, Any]):
        tid = body.get("telegram_user_id")
        if not tid:
            raise HTTPException(status_code=400, detail="telegram_user_id required")
        return await handle_unlink(int(tid))

    @router.get(f"{prefix}/users/by-telegram-id/{{telegram_user_id}}")
    async def get_user_by_telegram_id(telegram_user_id: int):
        user = await db_manager.users.find_one({"telegram_user_id": telegram_user_id, "is_opted_out": {"$ne": True}})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        return clean_doc(user)

    @router.get(f"{prefix}/users/{{user_id}}/chat-id")
    async def get_chat_id_by_user_id(user_id: str):
        user = await db_manager.users.find_one({"id": user_id, "is_opted_out": {"$ne": True}})
        if not user or not user.get("telegram_chat_id"):
            raise HTTPException(status_code=404, detail="Chat ID not found")
        return {"chat_id": user["telegram_chat_id"]}
