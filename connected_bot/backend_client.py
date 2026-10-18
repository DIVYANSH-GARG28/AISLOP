"""Client interface for communicating with connectED authoritative backend (Person 2).

Includes both live HTTP client and a fully functional in-memory MongoDB-simulation
mock backend for development, testing, and isolated demonstrations.
"""

import time
import uuid
import logging
from typing import Dict, Any, Optional, List
import httpx
from connected_bot.config import settings
from connected_bot.models import (
    UserRole,
    LinkInitiateRequest,
    LinkInitiateResponse,
    LinkValidateRequest,
    LinkValidateResponse,
    UnlinkResponse,
    MentorshipStatus,
    MentorshipDecisionSubmission,
    MentorshipDecisionResponse,
    MeetingDecisionSubmission,
)

logger = logging.getLogger(__name__)


class BackendAPIClient:
    """Communicates with the authoritative connectED backend service.
    
    Can operate in Live Mode (HTTP calls to Person 2's FastAPI/Express service)
    or Mock Mode (in-memory state simulation for tests and offline development).
    """

    def __init__(
        self,
        base_url: Optional[str] = None,
        service_token: Optional[str] = None,
        mock_mode: bool = False
    ):
        self.base_url = (base_url or settings.BACKEND_API_BASE_URL).rstrip("/")
        self.service_token = service_token or settings.BACKEND_SERVICE_TOKEN
        self.mock_mode = mock_mode

        # Simulated Backend Storage (MongoDB Collections)
        # users collection: user_id -> {id, email, name, role, telegram_user_id, telegram_chat_id, is_opted_out}
        self._db_users: Dict[str, Dict[str, Any]] = {}
        # linking_tokens collection: token -> {user_id, email, role, expires_at, is_used}
        self._db_linking_tokens: Dict[str, Dict[str, Any]] = {}
        # mentorship_requests collection: request_id -> {id, mentor_id, mentee_id, status, created_at, expires_at, ...}
        self._db_mentorship_requests: Dict[str, Dict[str, Any]] = {}
        # meetings collection: meeting_id -> {id, request_id, proposer_id, recipient_id, status, confirmed_by, ...}
        self._db_meetings: Dict[str, Dict[str, Any]] = {}

        self._seed_default_mock_data()

    def _seed_default_mock_data(self):
        """Seeds initial mock data for testing and local demonstrations."""
        alumni_1 = {
            "id": "alumni_001",
            "email": "priya.sharma@alumni.iiit.ac.in",
            "name": "Priya Sharma",
            "role": UserRole.ALUMNI,
            "company": "Google",
            "telegram_user_id": 987654321,
            "telegram_chat_id": 987654321,
            "is_opted_out": False
        }
        alumni_2 = {
            "id": "alumni_002",
            "email": "aravind.n@alumni.iiit.ac.in",
            "name": "Aravind Nair",
            "role": UserRole.ALUMNI,
            "company": "Microsoft",
            "telegram_user_id": 987654322,
            "telegram_chat_id": 987654322,
            "is_opted_out": False
        }
        student_1 = {
            "id": "student_101",
            "email": "divyansh.g@students.iiit.ac.in",
            "name": "Divyansh Garg",
            "role": UserRole.STUDENT,
            "telegram_user_id": 111222333,
            "telegram_chat_id": 111222333,
            "is_opted_out": False
        }
        self._db_users[alumni_1["id"]] = alumni_1
        self._db_users[alumni_2["id"]] = alumni_2
        self._db_users[student_1["id"]] = student_1

    # ==========================================
    # 1. Account Linking Workflow
    # ==========================================

    async def initiate_link_token(self, request: LinkInitiateRequest) -> LinkInitiateResponse:
        """Requests a short-lived single-use linking token from backend."""
        if not self.mock_mode:
            async with httpx.AsyncClient(timeout=10.0) as client:
                res = await client.post(
                    f"{self.base_url}/telegram/link/initiate",
                    headers={"Authorization": f"Bearer {self.service_token}"},
                    json=request.model_dump()
                )
                res.raise_for_status()
                data = res.json()
                return LinkInitiateResponse(**data)

        # Mock Mode Logic:
        token = f"link_{uuid.uuid4().hex[:16]}"
        now = time.time()
        expires_at = now + settings.LINKING_TOKEN_TTL_SECONDS

        self._db_linking_tokens[token] = {
            "user_id": request.user_id,
            "email": request.email,
            "role": request.role,
            "expires_at": expires_at,
            "is_used": False,
        }

        bot_username = settings.TELEGRAM_BOT_USERNAME
        deep_link = f"https://t.me/{bot_username}?start={token}"
        return LinkInitiateResponse(
            success=True,
            token=token,
            expires_at=time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime(expires_at)),
            deep_link_url=deep_link,
            message="Linking token generated successfully. Valid for 15 minutes."
        )

    async def validate_and_link_account(self, request: LinkValidateRequest) -> LinkValidateResponse:
        """Validates linking token and binds Telegram account to connectED user."""
        if not self.mock_mode:
            async with httpx.AsyncClient(timeout=10.0) as client:
                res = await client.post(
                    f"{self.base_url}/telegram/link/validate",
                    headers={"Authorization": f"Bearer {self.service_token}"},
                    json=request.model_dump()
                )
                res.raise_for_status()
                data = res.json()
                return LinkValidateResponse(**data)

        # Mock Mode Logic:
        token_data = self._db_linking_tokens.get(request.token)
        if not token_data:
            return LinkValidateResponse(
                success=False,
                message="Invalid linking token. Please generate a new one from your connectED dashboard."
            )

        if token_data["is_used"]:
            return LinkValidateResponse(
                success=False,
                message="This linking token has already been used. Tokens are strictly single-use."
            )

        if time.time() > token_data["expires_at"]:
            return LinkValidateResponse(
                success=False,
                message="This linking token has expired. Linking tokens are valid for 15 minutes only."
            )

        user_id = token_data["user_id"]
        user = self._db_users.get(user_id)
        if not user:
            # Register user record if linking for newly verified user
            user = {
                "id": user_id,
                "email": token_data["email"],
                "role": token_data["role"],
                "name": token_data["email"].split("@")[0].replace(".", " ").title(),
                "is_opted_out": False
            }
            self._db_users[user_id] = user

        # Bind Telegram account
        user["telegram_user_id"] = request.telegram_user_id
        user["telegram_chat_id"] = request.telegram_chat_id
        user["telegram_username"] = request.telegram_username
        user["is_opted_out"] = False

        # Mark token as consumed
        token_data["is_used"] = True

        logger.info(f"[BACKEND LINK] Successfully bound user {user_id} to Telegram ID {request.telegram_user_id}")
        return LinkValidateResponse(
            success=True,
            user_id=user["id"],
            role=user["role"],
            full_name=user["name"],
            message="Account successfully linked to connectED!"
        )

    async def unlink_account(self, telegram_user_id: int) -> UnlinkResponse:
        """Unlinks a Telegram account and sets user to opted-out."""
        if not self.mock_mode:
            async with httpx.AsyncClient(timeout=10.0) as client:
                res = await client.post(
                    f"{self.base_url}/telegram/unlink",
                    headers={"Authorization": f"Bearer {self.service_token}"},
                    json={"telegram_user_id": telegram_user_id}
                )
                res.raise_for_status()
                return UnlinkResponse(**res.json())

        # Mock Mode Logic:
        found = False
        for user in self._db_users.values():
            if user.get("telegram_user_id") == telegram_user_id:
                user["telegram_user_id"] = None
                user["telegram_chat_id"] = None
                user["is_opted_out"] = True
                found = True

        if found:
            return UnlinkResponse(success=True, message="Your Telegram account has been unlinked and notifications paused.")
        return UnlinkResponse(success=False, message="No connectED account was found linked to this Telegram ID.")

    # ==========================================
    # 2. User & Chat Resolution
    # ==========================================

    async def get_user_by_telegram_id(self, telegram_user_id: int) -> Optional[Dict[str, Any]]:
        """Resolves linked user profile by Telegram User ID."""
        for user in self._db_users.values():
            if user.get("telegram_user_id") == telegram_user_id and not user.get("is_opted_out"):
                return user
        return None

    async def get_telegram_chat_by_user_id(self, user_id: str) -> Optional[int]:
        """Resolves Telegram chat_id for a given connectED user_id."""
        user = self._db_users.get(user_id)
        if user and user.get("telegram_chat_id") and not user.get("is_opted_out"):
            return user["telegram_chat_id"]
        return None

    # ==========================================
    # 3. Mentorship State Management
    # ==========================================

    async def get_mentorship_request(self, request_id: str) -> Optional[Dict[str, Any]]:
        """Retrieves authoritative mentorship request from backend."""
        return self._db_mentorship_requests.get(request_id)

    def register_mentorship_request(self, request_data: Dict[str, Any]):
        """Helper to register a mentorship request into backend state (used on event ingest)."""
        self._db_mentorship_requests[request_data["request_id"]] = request_data

    async def submit_mentorship_decision(
        self,
        submission: MentorshipDecisionSubmission
    ) -> MentorshipDecisionResponse:
        """Authoritatively submits mentor's Accept/Decline decision to backend state machine."""
        if not self.mock_mode:
            async with httpx.AsyncClient(timeout=10.0) as client:
                res = await client.post(
                    f"{self.base_url}/mentorship/requests/{submission.request_id}/respond",
                    headers={"Authorization": f"Bearer {self.service_token}"},
                    json=submission.model_dump()
                )
                res.raise_for_status()
                return MentorshipDecisionResponse(**res.json())

        # Authoritative Mock State Machine:
        req = self._db_mentorship_requests.get(submission.request_id)
        if not req:
            return MentorshipDecisionResponse(
                success=False,
                status=MentorshipStatus.EXPIRED,
                message="Mentorship request not found in connectED records.",
                updated_at=time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
            )

        # 1. Validate mentor authorization
        if req["mentor_id"] != submission.mentor_user_id:
            logger.warning(
                f"[SECURITY ALERT] Unauthorized decision attempt on request {submission.request_id}. "
                f"Expected mentor: {req['mentor_id']}, Attempted by: {submission.mentor_user_id}"
            )
            return MentorshipDecisionResponse(
                success=False,
                status=MentorshipStatus(req["status"]),
                message="Unauthorized: You are not the assigned mentor for this request.",
                updated_at=time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
            )

        # 2. Check if request is expired
        now = time.time()
        expiry_ts = req.get("expires_at_timestamp")
        if expiry_ts and now > expiry_ts:
            req["status"] = MentorshipStatus.EXPIRED.value
            return MentorshipDecisionResponse(
                success=False,
                status=MentorshipStatus.EXPIRED,
                message="This mentorship request has expired (48-hour response window exceeded).",
                updated_at=time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
            )

        # 3. Check if already processed
        current_status = req.get("status", MentorshipStatus.PENDING.value)
        if current_status != MentorshipStatus.PENDING.value:
            return MentorshipDecisionResponse(
                success=False,
                status=MentorshipStatus(current_status),
                message=f"This request has already been {current_status.lower()}.",
                updated_at=time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
            )

        # 4. Apply transition
        new_status = MentorshipStatus.ACCEPTED if submission.action == "accept" else MentorshipStatus.DECLINED
        req["status"] = new_status.value
        req["responded_at"] = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
        req["decline_reason"] = submission.reason

        logger.info(f"[BACKEND STATE TRANSITION] Request {submission.request_id} transitioned to {new_status.value}")
        return MentorshipDecisionResponse(
            success=True,
            status=new_status,
            message=f"Mentorship request successfully {new_status.value.lower()}.",
            updated_at=req["responded_at"]
        )

    # ==========================================
    # 4. Meeting Coordination State Management
    # ==========================================

    def register_meeting(self, meeting_data: Dict[str, Any]):
        """Registers a proposed meeting into backend state."""
        self._db_meetings[meeting_data["meeting_id"]] = {
            **meeting_data,
            "status": "PROPOSED",
            "agreements": [meeting_data["proposer_id"]],
        }

    async def get_meeting(self, meeting_id: str) -> Optional[Dict[str, Any]]:
        return self._db_meetings.get(meeting_id)

    async def submit_meeting_decision(self, decision: MeetingDecisionSubmission) -> Dict[str, Any]:
        """Submits participant's response to a proposed meeting."""
        meeting = self._db_meetings.get(decision.meeting_id)
        if not meeting:
            return {"success": False, "message": "Meeting not found"}

        if decision.action == "confirm":
            if decision.responder_id not in meeting["agreements"]:
                meeting["agreements"].append(decision.responder_id)

            # Mutual confirmation check: both proposer and recipient must agree
            if (
                meeting["proposer_id"] in meeting["agreements"]
                and meeting["recipient_id"] in meeting["agreements"]
            ):
                meeting["status"] = "CONFIRMED"
                return {
                    "success": True,
                    "status": "CONFIRMED",
                    "message": "Meeting mutually confirmed by both participants!"
                }
            return {
                "success": True,
                "status": "AWAITING_COUNTERPART",
                "message": "Your confirmation recorded. Awaiting confirmation from counterpart."
            }

        elif decision.action == "reschedule":
            meeting["status"] = "RESCHEDULE_REQUESTED"
            return {"success": True, "status": "RESCHEDULE_REQUESTED", "message": "Reschedule request submitted."}

        else:
            meeting["status"] = "CANCELLED"
            return {"success": True, "status": "CANCELLED", "message": "Meeting declined."}


# Global backend client instance (defaults to mock_mode=True for standalone reliability/testing)
backend_client = BackendAPIClient(mock_mode=True)
