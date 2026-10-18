"""Account linking service orchestrating secure Telegram-to-connectED account bindings."""

import logging
from typing import Optional, Dict, Any
from connected_bot.models import (
    LinkInitiateRequest,
    LinkInitiateResponse,
    LinkValidateRequest,
    LinkValidateResponse,
    UnlinkResponse,
    UserRole
)
from connected_bot.backend_client import backend_client
from connected_bot.client import telegram_client

logger = logging.getLogger(__name__)


class AccountLinkingService:
    """Manages secure linking between Telegram chats and connectED user accounts."""

    def __init__(self, backend=None, telegram=None):
        self.backend = backend or backend_client
        self.telegram = telegram or telegram_client

    async def initiate_linking(self, user_id: str, email: str, role: UserRole) -> LinkInitiateResponse:
        """Called by connectED web application when a user wants to link their Telegram."""
        req = LinkInitiateRequest(user_id=user_id, email=email, role=role)
        return await self.backend.initiate_link_token(req)

    async def handle_start_with_token(
        self,
        token: str,
        telegram_user_id: int,
        telegram_chat_id: int,
        telegram_username: Optional[str] = None
    ) -> LinkValidateResponse:
        """Processes `/start <token>` or `/link <token>` sent by a user in Telegram."""
        validate_req = LinkValidateRequest(
            token=token.strip(),
            telegram_user_id=telegram_user_id,
            telegram_chat_id=telegram_chat_id,
            telegram_username=telegram_username
        )
        result = await self.backend.validate_and_link_account(validate_req)

        if result.success:
            welcome_text = (
                f"🎉 <b>Account Linked Successfully!</b>\n\n"
                f"Welcome <b>{result.full_name}</b> ({result.role.value if hasattr(result.role, 'value') else result.role})!\n"
                f"Your Telegram account is now connected to <b>connectED</b>.\n\n"
                f"🔔 You will receive real-time notifications for:\n"
                f"• Mentorship requests & status updates\n"
                f"• Meeting proposals & schedule confirmations\n"
                f"• Fallback recommendations & reminders\n\n"
                f"Type /help to see all available commands or /status to view account details."
            )
            await self.telegram.send_message(telegram_chat_id, welcome_text)
        else:
            fail_text = (
                f"⚠️ <b>Account Linking Failed</b>\n\n"
                f"{result.message}\n\n"
                f"Please log in to your connectED portal, navigate to Settings > Integrations > Telegram, "
                f"and generate a fresh linking link."
            )
            await self.telegram.send_message(telegram_chat_id, fail_text)

        return result

    async def handle_unlink(self, telegram_user_id: int, telegram_chat_id: int) -> UnlinkResponse:
        """Handles user-initiated unlinking (/unlink or /optout)."""
        res = await self.backend.unlink_account(telegram_user_id)
        if res.success:
            msg = (
                "🔌 <b>Account Unlinked</b>\n\n"
                "Your Telegram account has been disconnected from connectED.\n"
                "You will no longer receive mentorship or meeting notifications here.\n"
                "To reconnect at any time, generate a new link token from your connectED dashboard."
            )
        else:
            msg = f"ℹ️ {res.message}"

        await self.telegram.send_message(telegram_chat_id, msg)
        return res


# Global linking service instance
linking_service = AccountLinkingService()
