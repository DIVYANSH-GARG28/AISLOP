"""Telegram Bot command handlers: /start, /link, /unlink, /optout, /status, /help."""

import logging
from typing import Optional
from connected_bot.models import TelegramMessage
from connected_bot.services.linking_service import linking_service
from connected_bot.backend_client import backend_client
from connected_bot.client import telegram_client

logger = logging.getLogger(__name__)


async def handle_start_command(message: TelegramMessage):
    """Handles `/start` command, including deep-link token payloads (/start link_xxx)."""
    chat_id = message.chat.id
    user = message.from_user
    if not user:
        return

    text_parts = (message.text or "").strip().split()

    # Case 1: Deep linking token provided in /start
    if len(text_parts) > 1:
        token = text_parts[1].strip()
        logger.info(f"[/start] Received deep linking token from user {user.id}")
        await linking_service.handle_start_with_token(
            token=token,
            telegram_user_id=user.id,
            telegram_chat_id=chat_id,
            telegram_username=user.username
        )
        return

    # Case 2: Plain /start without token
    # Check if user is already linked
    existing_user = await backend_client.get_user_by_telegram_id(user.id)
    if existing_user:
        welcome_text = (
            f"👋 Hello <b>{existing_user.get('name', user.first_name)}</b>!\n\n"
            f"You are connected to <b>connectED</b> as an <b>{existing_user.get('role')}</b>.\n\n"
            f"📌 <b>Available Commands:</b>\n"
            f"• /status - Check account connection details\n"
            f"• /help - View instructions and command guide\n"
            f"• /unlink - Disconnect this Telegram account"
        )
    else:
        welcome_text = (
            f"👋 Welcome to <b>connectED Bot</b>, {user.first_name}!\n\n"
            f"connectED connects ambitious students with experienced alumni mentors.\n\n"
            f"🔗 <b>How to Link Your Account:</b>\n"
            f"1. Log in to the <a href=\"https://connected.iiit.ac.in\">connectED Web Portal</a>\n"
            f"2. Go to <b>Profile &gt; Settings &gt; Integrations &gt; Telegram</b>\n"
            f"3. Click <b>\"Connect Telegram\"</b> or paste your link token here with:\n"
            f"   <code>/link &lt;your_token&gt;</code>\n\n"
            f"ℹ️ For security, tokens expire in 15 minutes and can only be used once."
        )

    await telegram_client.send_message(chat_id, welcome_text)


async def handle_link_command(message: TelegramMessage):
    """Handles manual `/link <token>` entry."""
    chat_id = message.chat.id
    user = message.from_user
    if not user:
        return

    text_parts = (message.text or "").strip().split()
    if len(text_parts) < 2:
        await telegram_client.send_message(
            chat_id,
            "⚠️ <b>Missing Token</b>\n\nUsage: <code>/link &lt;your_token&gt;</code>\n"
            "Generate your token from the connectED web dashboard."
        )
        return

    token = text_parts[1].strip()
    await linking_service.handle_start_with_token(
        token=token,
        telegram_user_id=user.id,
        telegram_chat_id=chat_id,
        telegram_username=user.username
    )


async def handle_unlink_command(message: TelegramMessage):
    """Handles `/unlink` and `/optout` commands."""
    if not message.from_user:
        return
    await linking_service.handle_unlink(message.from_user.id, message.chat.id)


async def handle_status_command(message: TelegramMessage):
    """Handles `/status` command."""
    if not message.from_user:
        return
    user = await backend_client.get_user_by_telegram_id(message.from_user.id)
    if user:
        status_text = (
            f"🛡️ <b>connectED Connection Status: ACTIVE</b>\n\n"
            f"<b>Name:</b> {user.get('name')}\n"
            f"<b>Role:</b> {user.get('role')}\n"
            f"<b>Email:</b> {user.get('email')}\n"
            f"<b>Telegram ID:</b> <code>{message.from_user.id}</code>\n"
            f"<b>Notifications:</b> Enabled ✅\n\n"
            f"To disconnect, type /unlink."
        )
    else:
        status_text = (
            f"❌ <b>connectED Connection Status: NOT LINKED</b>\n\n"
            f"This Telegram ID (<code>{message.from_user.id}</code>) is not connected to any connectED account.\n"
            f"Please link via the web dashboard or type /link &lt;token&gt;."
        )
    await telegram_client.send_message(message.chat.id, status_text)


async def handle_help_command(message: TelegramMessage):
    """Handles `/help` command."""
    help_text = (
        f"🤖 <b>connectED Telegram Bot Guide</b>\n\n"
        f"<b>Supported Commands:</b>\n"
        f"• /start - Launch bot or link via deep link\n"
        f"• /link &lt;token&gt; - Manually link with single-use token\n"
        f"• /status - View your current linking and profile status\n"
        f"• /unlink - Disconnect your Telegram account\n"
        f"• /optout - Pause all Telegram notifications\n"
        f"• /help - Display this assistance menu\n\n"
        f"<b>Mentorship Features:</b>\n"
        f"• Real-time Accept / Decline notification buttons\n"
        f"• 48-hour SLA deadline tracking & alerts\n"
        f"• Automated fallback mentor matching updates\n"
        f"• Meeting proposal coordination & confirmations\n\n"
        f"Need web assistance? Visit <a href=\"https://connected.iiit.ac.in\">connectED Portal</a>."
    )
    await telegram_client.send_message(message.chat.id, help_text)
