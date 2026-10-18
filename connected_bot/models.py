"""Pydantic data models for Telegram API updates, backend integration contracts, and internal events."""

from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List, Dict, Any
from enum import Enum
from datetime import datetime


# ==========================================
# 1. Official Telegram Bot API Models
# ==========================================

class TelegramUser(BaseModel):
    id: int
    is_bot: bool = False
    first_name: str
    last_name: Optional[str] = None
    username: Optional[str] = None
    language_code: Optional[str] = None


class TelegramChat(BaseModel):
    id: int
    type: str  # "private", "group", "supergroup", "channel"
    title: Optional[str] = None
    username: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None


class InlineKeyboardButton(BaseModel):
    text: str
    callback_data: Optional[str] = None
    url: Optional[str] = None


class InlineKeyboardMarkup(BaseModel):
    inline_keyboard: List[List[InlineKeyboardButton]] = []


class TelegramMessage(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    message_id: int
    from_user: Optional[TelegramUser] = Field(default=None, alias="from")
    chat: TelegramChat
    date: int
    text: Optional[str] = None
    reply_markup: Optional[InlineKeyboardMarkup] = None


class CallbackQuery(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str
    from_user: TelegramUser = Field(alias="from")
    message: Optional[TelegramMessage] = None
    inline_message_id: Optional[str] = None
    chat_instance: Optional[str] = None
    data: Optional[str] = None


class TelegramUpdate(BaseModel):
    update_id: int
    message: Optional[TelegramMessage] = None
    edited_message: Optional[TelegramMessage] = None
    callback_query: Optional[CallbackQuery] = None


# ==========================================
# 2. Account Linking & Security Models
# ==========================================

class UserRole(str, Enum):
    ALUMNI = "ALUMNI"
    STUDENT = "STUDENT"
    ADMIN = "ADMIN"


class LinkInitiateRequest(BaseModel):
    user_id: str = Field(description="connectED unique User ID")
    email: str = Field(description="Verified user email address")
    role: UserRole = Field(description="ALUMNI or STUDENT")


class LinkInitiateResponse(BaseModel):
    success: bool
    token: str = Field(description="Single-use short-lived cryptographic token")
    expires_at: str = Field(description="ISO timestamp of token expiration")
    deep_link_url: str = Field(description="Telegram deep-link URL (e.g. t.me/Bot?start=token)")
    message: str


class LinkValidateRequest(BaseModel):
    token: str
    telegram_user_id: int
    telegram_chat_id: int
    telegram_username: Optional[str] = None


class LinkValidateResponse(BaseModel):
    success: bool
    user_id: Optional[str] = None
    role: Optional[UserRole] = None
    full_name: Optional[str] = None
    message: str


class UnlinkRequest(BaseModel):
    telegram_user_id: int


class UnlinkResponse(BaseModel):
    success: bool
    message: str


# ==========================================
# 3. Mentorship Workflow Models
# ==========================================

class MentorshipStatus(str, Enum):
    PENDING = "PENDING"
    ACCEPTED = "ACCEPTED"
    DECLINED = "DECLINED"
    EXPIRED = "EXPIRED"


class MentorshipRequestCreatedEvent(BaseModel):
    event_id: str
    event_type: str = "mentorship.request.created"
    request_id: str
    mentor_id: str
    mentee_id: str
    mentee_name: str
    topic: str
    message: str
    skills: List[str] = []
    created_at: str
    expires_at: str


class MentorshipActionType(str, Enum):
    ACCEPT = "accept"
    DECLINE = "decline"


class MentorshipDecisionSubmission(BaseModel):
    request_id: str
    mentor_user_id: str
    telegram_user_id: int
    action: MentorshipActionType
    reason: Optional[str] = None


class MentorshipDecisionResponse(BaseModel):
    success: bool
    status: MentorshipStatus
    message: str
    updated_at: str


class MentorshipRequestExpiredEvent(BaseModel):
    event_id: str
    event_type: str = "mentorship.request.expired"
    request_id: str
    mentor_id: str
    mentee_id: str
    expired_at: str
    fallback_recommended: bool = True


class MentorshipFallbackCreatedEvent(BaseModel):
    event_id: str
    event_type: str = "mentorship.fallback.created"
    original_request_id: str
    new_request_id: str
    mentee_id: str
    new_mentor_id: str
    new_mentor_name: str
    skills_matched: List[str] = []
    reason: str = "Original request expired after 48h timeout"


# ==========================================
# 4. Meeting Coordination Models
# ==========================================

class MeetingProposedEvent(BaseModel):
    event_id: str
    event_type: str = "meeting.proposed"
    meeting_id: str
    request_id: str
    proposer_id: str
    proposer_name: str
    recipient_id: str
    proposed_time: str
    duration_minutes: int = 30
    topic: str
    agenda: Optional[str] = None


class MeetingDecisionSubmission(BaseModel):
    meeting_id: str
    responder_id: str
    telegram_user_id: int
    action: str  # "confirm" | "reschedule" | "cancel"
    note: Optional[str] = None


class MeetingConfirmedEvent(BaseModel):
    event_id: str
    event_type: str = "meeting.confirmed"
    meeting_id: str
    request_id: str
    student_id: str
    mentor_id: str
    confirmed_time: str
    meeting_link: str
    duration_minutes: int = 30
