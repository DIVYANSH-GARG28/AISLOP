"""Institutional email verification router for campus portals and exclusive student hubs."""

import time
import secrets
import re
from datetime import datetime, timezone
from typing import Dict, Any, Optional
from fastapi import APIRouter, HTTPException, Query, BackgroundTasks, status, Depends
from connected_backend.database import db_manager, clean_doc
from connected_backend.config import settings
from connected_backend.models import (
    InstituteOtpRequest,
    InstituteOtpConfirm,
    InstituteStatusResponse,
    ApiResponse
)
from connected_backend.event_dispatcher import dispatch_institute_otp_event

router = APIRouter(prefix="/api/institute", tags=["Institutional Verification"])

# Blocklist of personal/commercial email providers
DISALLOWED_DOMAINS = {
    "gmail.com", "googlemail.com", "yahoo.com", "yahoo.co.in",
    "hotmail.com", "outlook.com", "live.com", "msn.com",
    "icloud.com", "proton.me", "protonmail.com", "zoho.com",
    "mail.com", "aol.com", "yandex.com"
}

# Recognized educational domains / patterns
def is_valid_educational_domain(email: str) -> bool:
    """Validates that the email belongs to an educational or institutional domain."""
    if "@" not in email:
        return False
    domain = email.split("@")[1].strip().lower()
    
    # 1. Reject commercial/personal email domains
    if domain in DISALLOWED_DOMAINS:
        return False

    # 2. Accept educational domain structures
    if (
        domain.endswith(".edu.in")
        or domain.endswith(".ac.in")
        or domain.endswith(".edu")
        or domain.endswith(".org.in")
        or domain in ["its.edu.in", "iiit.ac.in", "kce.edu"]
    ):
        return True

    # Allow custom educational institutions that have 'its' or 'univ' or 'college' or 'inst' in domain
    if any(k in domain for k in ["its", "univ", "college", "institute", "campus", "school"]):
        return True

    return False


def get_institution_name_from_domain(domain: str) -> str:
    """Infers friendly institution name from domain."""
    d = domain.lower()
    if "its.edu.in" in d or "its" in d:
        return "I.T.S Engineering College"
    elif "iiit" in d:
        return "IIIT Alumni & Student Network"
    elif "kce" in d:
        return "KCE Technical Institute"
    return domain.split(".")[0].upper() + " Institute"


# ==========================================
# 1. Request Verification OTP
# ==========================================

@router.post("/verify/request-otp")
async def request_institution_otp(
    req: InstituteOtpRequest,
    background_tasks: BackgroundTasks,
    user_id: Optional[str] = Query(None)
):
    """Sends a 6-digit OTP to the user's institutional email address.
    
    Edge cases handled:
    - Rejects invalid / non-educational domains (e.g. gmail.com)
    - Normalizes email case and whitespace
    - Enforces 60-second cooldown timer between requests
    - Enforces max 5 OTP requests per hour rate limit
    - Dispatches async event to n8n webhook and linked Telegram
    """
    raw_email = req.email.strip()
    if not re.match(r"^[^@]+@[^@]+\.[^@]+$", raw_email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"message": "Please enter a valid email address format."}
        )

    normalized_email = raw_email.lower()
    domain = normalized_email.split("@")[1]

    # Edge Case: Non-educational domain check
    if not is_valid_educational_domain(normalized_email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "message": (
                    f"Domain '@{domain}' is not recognized as an authorized educational institution. "
                    "Please provide your official college/institute email (e.g., student@its.edu.in or @*.ac.in). "
                    "Personal email accounts like Gmail/Yahoo are not permitted for institutional access."
                )
            }
        )

    now = time.time()
    institution_name = req.institution_name or get_institution_name_from_domain(domain)

    # Check for existing pending OTP record for cooldown and rate limit
    existing = await db_manager.institute_verifications.find_one({"email": normalized_email})
    if existing:
        last_requested = existing.get("last_requested_at", 0)
        cooldown_rem = int(settings.INSTITUTE_OTP_COOLDOWN_SECONDS - (now - last_requested))
        if cooldown_rem > 0:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail={
                    "message": f"Please wait {cooldown_rem} seconds before requesting a new verification code.",
                    "cooldown_seconds": cooldown_rem
                }
            )

        # Check hourly rate limit
        hourly_count = existing.get("hourly_requests_count", 0)
        hour_start = existing.get("hourly_window_start", 0)
        if now - hour_start < 3600:
            if hourly_count >= 5:
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail={"message": "Too many verification requests for this email. Please try again in an hour."}
                )
            hourly_count += 1
        else:
            hourly_count = 1
            hour_start = now
    else:
        hourly_count = 1
        hour_start = now

    # Generate secure 6-digit OTP
    otp_code = str(secrets.randbelow(900000) + 100000)
    expires_at = now + (settings.INSTITUTE_OTP_TTL_MINUTES * 60)
    now_iso = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime(now))

    # Resolve linked Telegram chat for backup alert
    telegram_chat_id = None
    if user_id:
        user_doc = await db_manager.users.find_one({"id": user_id})
        if user_doc:
            telegram_chat_id = user_doc.get("telegram_chat_id")

    otp_doc = {
        "email": normalized_email,
        "domain": domain,
        "institution_name": institution_name,
        "user_id": user_id or "student_101",
        "otp_code": otp_code,
        "attempts_left": settings.INSTITUTE_OTP_MAX_ATTEMPTS,
        "last_requested_at": now,
        "created_at_iso": now_iso,
        "expires_at_timestamp": expires_at,
        "hourly_requests_count": hourly_count,
        "hourly_window_start": hour_start,
        "is_verified": False,
        "consumed": False
    }

    await db_manager.institute_verifications.update_one(
        {"email": normalized_email},
        {"$set": otp_doc},
        upsert=True
    )

    # Dispatch to n8n webhook and Telegram
    background_tasks.add_task(dispatch_institute_otp_event, {
        "event": "institute.otp.requested",
        "email": normalized_email,
        "domain": domain,
        "institution_name": institution_name,
        "otp": otp_code,
        "expires_in_minutes": settings.INSTITUTE_OTP_TTL_MINUTES,
        "telegram_chat_id": telegram_chat_id,
        "timestamp": now_iso
    })

    return {
        "success": True,
        "message": f"Verification code successfully sent to {normalized_email}. Please check your inbox.",
        "data": {
            "email": normalized_email,
            "domain": domain,
            "institution_name": institution_name,
            "expires_in_minutes": settings.INSTITUTE_OTP_TTL_MINUTES,
            "cooldown_seconds": settings.INSTITUTE_OTP_COOLDOWN_SECONDS,
            # For convenient local demo testing:
            "_dev_hint_otp": otp_code if settings.DEBUG else None
        }
    }


# ==========================================
# 2. Confirm Verification OTP
# ==========================================

@router.post("/verify/confirm-otp")
async def confirm_institution_otp(
    req: InstituteOtpConfirm,
    user_id: Optional[str] = Query(None)
):
    """Validates the 6-digit OTP code and binds verified institutional status to the student.
    
    Edge cases handled:
    - Verifies code validity and single-use constraint
    - Rejects expired OTPs (10-minute TTL)
    - Rejects brute-force attempts (> 3 incorrect guesses invalidates OTP)
    - Updates user and student profiles with verified institutional metadata
    """
    normalized_email = req.email.strip().lower()
    submitted_otp = req.otp.strip()

    record = await db_manager.institute_verifications.find_one({"email": normalized_email})
    if not record:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"message": "No active verification request found for this email. Please request a new code."}
        )

    # Edge Case: Already consumed/verified
    if record.get("consumed") or record.get("is_verified"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"message": "This verification code has already been used. Please request a new code if needed."}
        )

    now = time.time()
    expires_at = record.get("expires_at_timestamp", 0)

    # Edge Case: Expired OTP
    if now > expires_at:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"message": "Verification code has expired. Please request a new code."}
        )

    attempts_left = record.get("attempts_left", settings.INSTITUTE_OTP_MAX_ATTEMPTS)

    # Edge Case: Exceeded attempts
    if attempts_left <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"message": "Too many failed attempts. This code has been invalidated. Please request a new code."}
        )

    # Edge Case: Incorrect OTP
    if record.get("otp_code") != submitted_otp:
        new_attempts = attempts_left - 1
        await db_manager.institute_verifications.update_one(
            {"email": normalized_email},
            {"$set": {"attempts_left": new_attempts}}
        )
        if new_attempts <= 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"message": "Too many incorrect attempts. This code has been invalidated. Please request a new code."}
            )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "message": f"Incorrect verification code. {new_attempts} attempt(s) remaining.",
                "attempts_left": new_attempts
            }
        )

    # Successful verification
    now_iso = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime(now))
    domain = record.get("domain", normalized_email.split("@")[1])
    institution_name = record.get("institution_name") or get_institution_name_from_domain(domain)
    target_user_id = user_id or record.get("user_id", "student_101")

    # Mark OTP as consumed and verified
    await db_manager.institute_verifications.update_one(
        {"email": normalized_email},
        {
            "$set": {
                "is_verified": True,
                "consumed": True,
                "verified_at": now_iso
            }
        }
    )

    # Update User and Student records
    verification_payload = {
        "is_institution_verified": True,
        "institution_email": normalized_email,
        "institution_domain": domain,
        "institution_name": institution_name,
        "institution_verified_at": now_iso
    }

    await db_manager.users.update_one(
        {"id": target_user_id},
        {"$set": verification_payload}
    )
    await db_manager.students.update_one(
        {"$or": [{"id": target_user_id}, {"user_id": target_user_id}]},
        {"$set": verification_payload}
    )

    return {
        "success": True,
        "message": f"Congratulations! Your {institution_name} account has been verified.",
        "data": {
            "is_verified": True,
            "institution_email": normalized_email,
            "institution_name": institution_name,
            "institution_domain": domain,
            "verified_at": now_iso
        }
    }


# ==========================================
# 3. Check Institution Verification Status
# ==========================================

@router.get("/status")
async def get_institution_status(
    email: Optional[str] = None,
    user_id: Optional[str] = None
):
    """Checks whether the user or given email has completed institutional verification."""
    # Check by user_id first
    if user_id:
        user = await db_manager.users.find_one({"id": user_id})
        if user and user.get("is_institution_verified"):
            return {
                "success": True,
                "data": {
                    "is_verified": True,
                    "institution_email": user.get("institution_email"),
                    "institution_name": user.get("institution_name", "ITS Engineering College / IIIT"),
                    "institution_domain": user.get("institution_domain"),
                    "verified_at": user.get("institution_verified_at")
                }
            }

    # Check by email
    if email:
        norm = email.strip().lower()
        rec = await db_manager.institute_verifications.find_one({"email": norm, "is_verified": True})
        if rec:
            return {
                "success": True,
                "data": {
                    "is_verified": True,
                    "institution_email": norm,
                    "institution_name": rec.get("institution_name"),
                    "institution_domain": rec.get("domain"),
                    "verified_at": rec.get("verified_at")
                }
            }

    return {
        "success": True,
        "data": {
            "is_verified": False,
            "institution_email": None,
            "institution_name": None
        }
    }


# ==========================================
# 4. Protected Institute Portal Data
# ==========================================

@router.get("/portal-data")
async def get_institute_portal_data(
    user_id: Optional[str] = Query(None),
    email: Optional[str] = Query(None)
):
    """Protected endpoint returning exclusive campus placement drives, circulars, and verified batchmates.
    
    Edge case: Returns 403 Forbidden if student has not completed institutional email verification.
    """
    is_verified = False
    inst_name = "I.T.S Engineering College"

    if user_id:
        user = await db_manager.users.find_one({"id": user_id})
        if user and user.get("is_institution_verified"):
            is_verified = True
            inst_name = user.get("institution_name", inst_name)
    elif email:
        norm = email.strip().lower()
        rec = await db_manager.institute_verifications.find_one({"email": norm, "is_verified": True})
        if rec:
            is_verified = True
            inst_name = rec.get("institution_name", inst_name)

    # Edge Case: Enforce Institutional Verification Access Gate
    if not is_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "error": "INSTITUTION_VERIFICATION_REQUIRED",
                "message": "Access restricted: You must verify your official institutional email (e.g., @its.edu.in) to access campus placement drives and institutional resources."
            }
        )

    # Return exclusive verified institute data
    campus_drives = [
        {
            "id": "drive_01",
            "company": "Google India",
            "role": "Software Engineer (New Grad 2026)",
            "package": "₹32 LPA",
            "eligibility": "B.Tech CSE/IT — CGPA >= 7.5",
            "deadline": "2026-11-15",
            "type": "On-Campus Exclusive",
            "status": "Active Registrations"
        },
        {
            "id": "drive_02",
            "company": "Microsoft R&D",
            "role": "Cloud Solutions & DevOps Engineer",
            "package": "₹28 LPA",
            "eligibility": "B.Tech All Circuital — CGPA >= 7.0",
            "deadline": "2026-11-20",
            "type": "On-Campus Exclusive",
            "status": "Shortlisting"
        },
        {
            "id": "drive_03",
            "company": "TCS Digital / Prime",
            "role": "Fullstack Systems Developer",
            "package": "₹11 LPA",
            "eligibility": "All Branches — No Active Backlogs",
            "deadline": "2026-11-05",
            "type": "Campus Pool",
            "status": "Aptitude Test Next Week"
        }
    ]

    notices = [
        {
            "id": "not_01",
            "title": "Semester VII Technical Mock Interviews with Alumni Panel",
            "category": "Placement Cell",
            "date": "October 24, 2026",
            "summary": "Mandatory 1-on-1 architecture assessment with verified alumni mentors before campus drive commencement."
        },
        {
            "id": "not_02",
            "title": "Industry Capstone Evaluation Guidelines",
            "category": "Academic Board",
            "date": "October 20, 2026",
            "summary": "Review criteria for cloud infrastructure and microservice production deployment."
        }
    ]

    verified_batchmates = [
        {"name": "Ananya Sharma", "branch": "CSE - AI/ML", "year": "2026", "badge": "Verified ITS Student 🎓"},
        {"name": "Rohan Gupta", "branch": "CSE - Systems", "year": "2026", "badge": "Verified ITS Student 🎓"},
        {"name": "Siddharth Verma", "branch": "Information Technology", "year": "2026", "badge": "Verified ITS Student 🎓"}
    ]

    return {
        "success": True,
        "institution_name": inst_name,
        "access_granted": True,
        "data": {
            "drives": campus_drives,
            "circulars": notices,
            "batchmates": verified_batchmates
        }
    }


# ==========================================
# 5. Reset Verification (Edge Case: Email Change)
# ==========================================

@router.post("/verify/reset")
async def reset_institution_verification(
    user_id: str = Query(...)
):
    """Allows student to reset their institutional email verification if changing accounts."""
    await db_manager.users.update_one(
        {"id": user_id},
        {
            "$set": {
                "is_institution_verified": False,
                "institution_email": None,
                "institution_domain": None,
                "institution_name": None,
                "institution_verified_at": None
            }
        }
    )
    await db_manager.students.update_one(
        {"$or": [{"id": user_id}, {"user_id": user_id}]},
        {
            "$set": {
                "is_institution_verified": False,
                "institution_email": None,
                "institution_domain": None,
                "institution_name": None,
                "institution_verified_at": None
            }
        }
    )
    return {
        "success": True,
        "message": "Institutional email verification reset. Please verify your new address."
    }
