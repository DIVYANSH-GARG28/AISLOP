"""Mentorship router: recommendations, request creation, decisions, and 48h SLA timeout handling."""

import time
import uuid
from datetime import datetime, timezone, timedelta
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, HTTPException, Query, BackgroundTasks, status
from connected_backend.database import db_manager, clean_doc
from connected_backend.config import settings
from connected_backend.models import (
    MentorshipRequestCreate,
    MentorshipRespondRequest,
    MentorshipStatus,
    MentorRecommendation
)
from connected_backend.matching_engine import calculate_mentor_match
from connected_backend.event_dispatcher import dispatch_mentorship_created_event

router = APIRouter(prefix="/api", tags=["Mentorship Workflow"])


# ==========================================
# 1. Ranked Mentor Recommendations
# ==========================================

@router.get("/mentors/recommendations")
async def get_mentor_recommendations(
    student_id: Optional[str] = None,
    target_role: Optional[str] = None,
    target_company: Optional[str] = None,
    skills: Optional[str] = None
):
    """Computes and returns ranked mentor recommendations with explainable scores and concrete reasons."""
    # Retrieve student profile if ID provided
    student_profile = {}
    if student_id:
        st_doc = await db_manager.students.find_one({"$or": [{"id": student_id}, {"user_id": student_id}]})
        if st_doc:
            student_profile = clean_doc(st_doc)

    # Override or fill with query parameters
    if target_role:
        student_profile["target_role"] = target_role
    if target_company:
        student_profile["target_company"] = target_company
    if skills:
        student_profile["skills"] = [s.strip() for s in skills.split(",") if s.strip()]

    # Fetch all alumni eligible for mentorship
    cursor = db_manager.alumni.find({"is_mentor": {"$ne": False}})
    recommendations = []

    async for doc in cursor:
        alumni = clean_doc(doc)
        score, reasons = calculate_mentor_match(student_profile, alumni)
        recommendations.append({
            "alumni_id": alumni.get("id"),
            "name": alumni.get("name"),
            "current_role": alumni.get("current_role") or alumni.get("title", "Engineer"),
            "company": alumni.get("company", "Tech Company"),
            "avatar_url": alumni.get("avatar_url") or alumni.get("avatar", ""),
            "graduation_year": alumni.get("graduation_year", 2021),
            "skills": alumni.get("skills", []),
            "impact_score": alumni.get("impact_score", 800),
            "mentees_guided": alumni.get("mentees_guided", 5),
            "badge_tier": alumni.get("badge_tier", "Verified Alum ✨"),
            "is_verified": alumni.get("is_verified", True),
            "availability": alumni.get("availability", "Available for Mentorship"),
            "match_score": score,
            "match_reasons": reasons
        })

    # Sort descending by explainable match score
    recommendations.sort(key=lambda r: (r["match_score"], r["impact_score"]), reverse=True)

    return {
        "success": True,
        "count": len(recommendations),
        "data": recommendations
    }


# ==========================================
# 2. Create Mentorship Request
# ==========================================

@router.post("/mentorship/requests")
async def create_mentorship_request(
    req: MentorshipRequestCreate,
    background_tasks: BackgroundTasks,
    mentee_id: Optional[str] = Query(None)
):
    """Creates a new mentorship request, sets 48h deadline, and triggers Telegram / n8n automation."""
    # 1. Resolve Mentee
    mentee_id = mentee_id or "student_101"
    student = await db_manager.students.find_one({"$or": [{"id": mentee_id}, {"user_id": mentee_id}]})
    if not student:
        mentee_name = "Divyansh Garg"
    else:
        mentee_name = student.get("name", "Student")

    # 2. Resolve Mentor
    mentor = await db_manager.alumni.find_one({"$or": [{"id": req.mentor_id}, {"user_id": req.mentor_id}]})
    if not mentor:
        raise HTTPException(status_code=404, detail="Selected mentor does not exist")

    # 3. Compute Match Score and Reasons
    student_data = clean_doc(student) or {"skills": req.skills, "target_role": req.topic}
    alumni_data = clean_doc(mentor)
    match_score, match_reasons = calculate_mentor_match(student_data, alumni_data)

    # 4. Generate Timestamps & 48h Response SLA
    now = time.time()
    now_dt = datetime.now(timezone.utc)
    expires_dt = now_dt + timedelta(hours=settings.MENTORSHIP_DEADLINE_HOURS)
    expires_at_ts = now + (settings.MENTORSHIP_DEADLINE_HOURS * 3600)
    req_uuid = uuid.uuid4().hex[:8]
    request_id = f"req_{int(now)}_{req_uuid}"

    # Check mentor Telegram details
    mentor_chat_id = mentor.get("telegram_chat_id")
    if not mentor_chat_id:
        # Check user record for Telegram binding
        user_rec = await db_manager.users.find_one({"id": mentor.get("user_id") or mentor.get("id")})
        if user_rec:
            mentor_chat_id = user_rec.get("telegram_chat_id")

    request_doc = {
        "id": request_id,
        "request_id": request_id,
        "mentor_id": mentor.get("id"),
        "mentor_user_id": mentor.get("user_id") or mentor.get("id"),
        "mentor_name": mentor.get("name"),
        "mentor_company": mentor.get("company"),
        "mentor_telegram_chat_id": mentor_chat_id,
        "mentee_id": mentee_id,
        "mentee_name": mentee_name,
        "topic": req.topic,
        "message": req.message,
        "skills": req.skills if req.skills else ["Fullstack", "System Design"],
        "preferred_date": req.preferred_date,
        "preferred_time": req.preferred_time,
        "request_type": req.request_type,
        "match_score": match_score,
        "match_reasons": match_reasons,
        "status": MentorshipStatus.PENDING.value,
        "created_at": now_dt.strftime("%Y-%m-%dT%H:%M:%SZ"),
        "expires_at": expires_dt.strftime("%Y-%m-%dT%H:%M:%SZ"),
        "expires_at_timestamp": expires_at_ts,
        "deadline_hours": settings.MENTORSHIP_DEADLINE_HOURS,
        "responded_at": None,
        "decline_reason": None
    }

    await db_manager.mentorship_requests.insert_one(request_doc)

    # 5. Dispatch async automation (n8n webhook + Telegram interactive card)
    background_tasks.add_task(dispatch_mentorship_created_event, request_doc)

    return {
        "success": True,
        "message": f"Mentorship request created successfully. Awaiting mentor response (48-hour SLA).",
        "data": clean_doc(request_doc)
    }


# ==========================================
# 3. Retrieve Mentorship Request Status
# ==========================================

@router.get("/mentorship/requests")
async def list_mentorship_requests(
    mentor_id: Optional[str] = None,
    mentee_id: Optional[str] = None,
    status: Optional[str] = None
):
    """Lists mentorship requests with optional filtering."""
    query: Dict[str, Any] = {}
    if mentor_id:
        query["$or"] = [{"mentor_id": mentor_id}, {"mentor_user_id": mentor_id}]
    if mentee_id:
        query["mentee_id"] = mentee_id
    if status:
        query["status"] = status.upper()

    cursor = db_manager.mentorship_requests.find(query)
    results = []
    async for doc in cursor:
        results.append(clean_doc(doc))

    return {
        "success": True,
        "count": len(results),
        "data": results
    }


@router.get("/mentorship/requests/{request_id}")
async def get_mentorship_request(request_id: str):
    """Retrieves specific mentorship request with real-time deadline status."""
    req = await db_manager.mentorship_requests.find_one({"request_id": request_id})
    if not req:
        raise HTTPException(status_code=404, detail="Mentorship request not found")

    clean = clean_doc(req)
    
    # Calculate remaining time
    now = time.time()
    expires_ts = clean.get("expires_at_timestamp", 0)
    seconds_remaining = max(0, int(expires_ts - now))
    hours_remaining = round(seconds_remaining / 3600, 1)

    clean["seconds_remaining"] = seconds_remaining
    clean["hours_remaining"] = hours_remaining
    clean["is_expired"] = now > expires_ts and clean.get("status") == MentorshipStatus.PENDING.value

    return {
        "success": True,
        "data": clean
    }


# ==========================================
# 4. Accept / Decline Mentorship Request
# ==========================================

@router.post("/mentorship/requests/{request_id}/respond")
async def respond_to_mentorship_request(
    request_id: str,
    resp: MentorshipRespondRequest
):
    """Accepts or declines a mentorship request with idempotency and 48h SLA validation."""
    req = await db_manager.mentorship_requests.find_one({"request_id": request_id})
    if not req:
        raise HTTPException(status_code=404, detail="Mentorship request not found")

    current_status = req.get("status", MentorshipStatus.PENDING.value)
    now = time.time()
    expires_ts = req.get("expires_at_timestamp", 0)

    # 1. Check if expired
    if current_status == MentorshipStatus.PENDING.value and now > expires_ts:
        await db_manager.mentorship_requests.update_one(
            {"request_id": request_id},
            {"$set": {"status": MentorshipStatus.EXPIRED.value}}
        )
        return {
            "success": False,
            "status": MentorshipStatus.EXPIRED.value,
            "message": "This mentorship request has expired (48-hour SLA deadline passed)."
        }

    # 2. Check if already processed (Idempotency)
    if current_status != MentorshipStatus.PENDING.value:
        return {
            "success": True,
            "status": current_status,
            "message": f"This request was already {current_status.lower()}.",
            "data": clean_doc(req)
        }

    # 3. Transition to ACCEPTED or DECLINED
    action_lower = resp.action.lower()
    new_status = MentorshipStatus.ACCEPTED.value if action_lower == "accept" else MentorshipStatus.DECLINED.value
    now_iso = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())

    await db_manager.mentorship_requests.update_one(
        {"request_id": request_id},
        {
            "$set": {
                "status": new_status,
                "responded_at": now_iso,
                "decline_reason": resp.reason if new_status == MentorshipStatus.DECLINED.value else None
            }
        }
    )

    # 4. Update mentor impact score and mentees guided count if accepted
    if new_status == MentorshipStatus.ACCEPTED.value:
        mentor_id = req.get("mentor_id") or req.get("mentor_user_id")
        await db_manager.alumni.update_one(
            {"$or": [{"id": mentor_id}, {"user_id": mentor_id}]},
            {"$inc": {"mentees_guided": 1, "impact_score": 50}}
        )

    updated = await db_manager.mentorship_requests.find_one({"request_id": request_id})
    return {
        "success": True,
        "status": new_status,
        "message": f"Mentorship request successfully {new_status.lower()}.",
        "data": clean_doc(updated)
    }


# ==========================================
# 5. SLA Deadline Timeout Monitor (Scheduler)
# ==========================================

@router.post("/mentorship/scheduler/check-timeouts")
async def check_request_timeouts():
    """Idempotent scheduled job to mark pending requests older than 48 hours as EXPIRED."""
    now = time.time()
    query = {
        "status": MentorshipStatus.PENDING.value,
        "expires_at_timestamp": {"$lt": now}
    }

    cursor = db_manager.mentorship_requests.find(query)
    expired_ids = []
    async for doc in cursor:
        expired_ids.append(doc["request_id"])

    if expired_ids:
        await db_manager.mentorship_requests.update_many(
            {"request_id": {"$in": expired_ids}},
            {"$set": {"status": MentorshipStatus.EXPIRED.value}}
        )

    return {
        "success": True,
        "checked_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "expired_count": len(expired_ids),
        "expired_request_ids": expired_ids
    }
