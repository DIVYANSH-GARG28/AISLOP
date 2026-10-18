"""AI Conversational Assistant for connectED Telegram Bot implementing mentorship guidance and support."""

import logging
from typing import Optional
from connected_bot.system_prompt import get_system_prompt
from connected_bot.backend_client import backend_client
from connected_bot.client import telegram_client

logger = logging.getLogger(__name__)


class AIBotAssistant:
    """Provides conversational guidance to students and mentors inside Telegram."""

    def __init__(self):
        self.system_prompt = get_system_prompt()

    async def handle_conversational_message(
        self,
        chat_id: int,
        telegram_user_id: int,
        user_text: str,
        user_name: str
    ):
        """Generates structured, helpful mentorship advice and guidance based on user queries."""
        text_lower = user_text.lower()
        user_profile = await backend_client.get_user_by_telegram_id(telegram_user_id)
        is_linked = user_profile is not None
        role = user_profile.get("role") if user_profile else None

        # 1. Unlinked User Assistance
        if not is_linked:
            response = (
                f"👋 Hi {user_name}! I am the <b>connectED Mentorship Assistant</b>.\n\n"
                f"To receive your mentorship requests, meeting proposals, and status updates directly in Telegram, "
                f"you need to link your connectED account.\n\n"
                f"👉 <b>How to link:</b>\n"
                f"1. Log in to <a href=\"https://connected.iiit.ac.in\">connectED Web</a>\n"
                f"2. Navigate to <b>Settings &gt; Integrations &gt; Telegram</b>\n"
                f"3. Click <b>Connect Telegram</b> or send me <code>/link &lt;your_token&gt;</code>\n\n"
                f"Let me know if you need help with anything else!"
            )
            await telegram_client.send_message(chat_id, response)
            return

        # 2. Advice on Writing Great Mentorship Inquiries
        if any(w in text_lower for w in ["write", "request", "draft", "ask", "inquiry", "how to"]):
            response = (
                f"💡 <b>Tips for Writing High-Impact Mentorship Requests:</b>\n\n"
                f"Alumni mentors receive multiple requests. Here is how to make yours stand out:\n\n"
                f"1. <b>Specific Objective:</b> State exactly what you need (e.g. <i>'Feedback on system design portfolio'</i> vs <i>'need guidance'</i>).\n"
                f"2. <b>Show Homework:</b> Mention 1-2 projects you've already completed.\n"
                f"3. <b>Clear Timebox:</b> Ask for a concise 20-30 minute focused session.\n"
                f"4. <b>Prepared Questions:</b> Come with 3 targeted questions.\n\n"
                f"<i>Remember: Mentors have 48 hours to accept or decline before connectED suggests a fallback alumni match!</i>"
            )
            await telegram_client.send_message(chat_id, response)
            return

        # 3. Meeting & Scheduling Queries
        if any(w in text_lower for w in ["meeting", "schedule", "calendar", "time", "reschedule", "zoom", "meet"]):
            response = (
                f"📅 <b>connectED Meeting Coordination:</b>\n\n"
                f"• Once a mentorship request is <b>Accepted</b>, a meeting proposal can be sent.\n"
                f"• Both participants must confirm the time for mutual verification.\n"
                f"• As soon as both confirm, connectED delivers calendar invites and video meeting links right here in Telegram!\n\n"
                f"To check your active requests or connection status, use /status."
            )
            await telegram_client.send_message(chat_id, response)
            return

        # 4. 48-Hour SLA and Fallback Questions
        if any(w in text_lower for w in ["timeout", "expire", "fallback", "deadline", "48"]):
            response = (
                f"⏳ <b>connectED 48-Hour SLA & Fallback System:</b>\n\n"
                f"• Alumni have <b>48 hours</b> to accept or decline incoming mentorship requests.\n"
                f"• If a request is not answered within 48h, the system automatically marks it as <code>EXPIRED</code>.\n"
                f"• The student is instantly notified, and our AI matching engine immediately recommends the next best available alumni mentor.\n"
                f"• No request is ever left abandoned in limbo!"
            )
            await telegram_client.send_message(chat_id, response)
            return

        # 5. Default Helpful Persona Guidance
        response = (
            f"🤝 <b>connectED Assistant at your service!</b>\n\n"
            f"You are logged in as <b>{user_profile.get('name')}</b> ({role}).\n\n"
            f"Here is what I can help you with:\n"
            f"• <b>Mentorship Alerts:</b> Real-time Accept / Decline notifications\n"
            f"• <b>Meeting Sync:</b> Proposed time alerts & 1-click confirmations\n"
            f"• <b>Account Status:</b> Run /status or /help at any time\n\n"
            f"Need assistance with writing requests, scheduling sessions, or career roadmaps? Just ask!"
        )
        await telegram_client.send_message(chat_id, response)


# Global assistant instance
ai_bot_assistant = AIBotAssistant()
