"""Profiles router: student, alumni, faculty profiles and verification management."""

import time
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, HTTPException, Query, Depends, status
from connected_backend.database import db_manager, clean_doc
from connected_backend.models import (
    StudentProfileUpdate,
    AlumniProfileUpdate,
    FacultyProfileUpdate,
    VerificationStatus,
    UserRole
)
from connected_backend.security import get_current_user_payload

router = APIRouter(prefix="/api", tags=["Profiles"])


# ==========================================
# Alumni Endpoints
# ==========================================

@router.get("/alumni")
async def list_alumni(
    company: Optional[str] = None,
    skill: Optional[str] = None,
    verified_only: bool = False,
    sort_by: str = Query("impactScore", alias="sortBy")
):
    """Retrieves all alumni profiles with filtering and sorting."""
    query: Dict[str, Any] = {}
    if verified_only:
        query["verification_status"] = VerificationStatus.VERIFIED.value
    if company:
        query["company"] = {"$regex": company, "$options": "i"}
    if skill:
        query["skills"] = {"$regex": skill, "$options": "i"}

    cursor = db_manager.alumni.find(query)
    alumni_list = []
    async for doc in cursor:
        clean = clean_doc(doc)
        alumni_list.append(clean)

    # Sort in-memory if needed
    if sort_by == "impactScore":
        alumni_list.sort(key=lambda x: x.get("impact_score", 0), reverse=True)
    elif sort_by == "matchScore":
        alumni_list.sort(key=lambda x: x.get("match_score", 85), reverse=True)

    return {
        "success": True,
        "count": len(alumni_list),
        "data": alumni_list
    }


@router.get("/alumni/{alumni_id}")
async def get_alumni_by_id(alumni_id: str):
    """Retrieves single alumni profile by ID or user_id."""
    alumni = await db_manager.alumni.find_one({"$or": [{"id": alumni_id}, {"user_id": alumni_id}]})
    if not alumni:
        raise HTTPException(status_code=404, detail="Alumni profile not found")
    
    clean = clean_doc(alumni)
    return {
        "success": True,
        "data": clean
    }


@router.put("/alumni/{alumni_id}")
async def update_alumni_profile(
    alumni_id: str,
    update_data: Dict[str, Any]
):
    """Updates alumni profile with protection against unauthorized verification tampering."""
    alumni = await db_manager.alumni.find_one({"$or": [{"id": alumni_id}, {"user_id": alumni_id}]})
    if not alumni:
        raise HTTPException(status_code=404, detail="Alumni profile not found")

    # Protection: Never change verification status from general profile update
    forbidden_keys = ["verification_status", "is_verified", "verified_at", "user_id"]
    sanitized_update = {k: v for k, v in update_data.items() if k not in forbidden_keys and v is not None}

    # Normalize fields (e.g. current_role, title)
    if "role" in sanitized_update and "current_role" not in sanitized_update:
        sanitized_update["current_role"] = sanitized_update["role"]

    await db_manager.alumni.update_one(
        {"$or": [{"id": alumni_id}, {"user_id": alumni_id}]},
        {"$set": sanitized_update}
    )

    updated = await db_manager.alumni.find_one({"$or": [{"id": alumni_id}, {"user_id": alumni_id}]})
    return {
        "success": True,
        "data": clean_doc(updated),
        "message": "Alumni profile updated successfully"
    }


# ==========================================
# Student Endpoints
# ==========================================

@router.get("/students/{student_id}")
async def get_student_by_id(student_id: str):
    """Retrieves single student profile by ID or user_id."""
    student = await db_manager.students.find_one({"$or": [{"id": student_id}, {"user_id": student_id}]})
    if not student:
        raise HTTPException(status_code=404, detail="Student profile not found")
    
    return {
        "success": True,
        "data": clean_doc(student)
    }


@router.put("/students/{student_id}")
async def update_student_profile(
    student_id: str,
    update_data: Dict[str, Any]
):
    """Updates student profile fields."""
    student = await db_manager.students.find_one({"$or": [{"id": student_id}, {"user_id": student_id}]})
    if not student:
        raise HTTPException(status_code=404, detail="Student profile not found")

    sanitized = {k: v for k, v in update_data.items() if k not in ["user_id"] and v is not None}
    
    # Map common alias fields so both camelCase and snake_case are persisted
    if "targetRole" in sanitized:
        sanitized["target_role"] = sanitized["targetRole"]
    elif "target_role" in sanitized:
        sanitized["targetRole"] = sanitized["target_role"]

    if "targetCompany" in sanitized:
        sanitized["target_company"] = sanitized["targetCompany"]
    elif "target_company" in sanitized:
        sanitized["targetCompany"] = sanitized["target_company"]

    if "graduationYear" in sanitized:
        sanitized["graduation_year"] = int(sanitized["graduationYear"])
    elif "graduation_year" in sanitized:
        sanitized["graduationYear"] = int(sanitized["graduation_year"])

    if "avatarUrl" in sanitized:
        sanitized["avatar_url"] = sanitized["avatarUrl"]
    elif "avatar_url" in sanitized:
        sanitized["avatarUrl"] = sanitized["avatar_url"]

    await db_manager.students.update_one(
        {"$or": [{"id": student_id}, {"user_id": student_id}]},
        {"$set": sanitized}
    )

    # Also sync name/avatar to users collection
    user_updates = {}
    if "name" in sanitized:
        user_updates["name"] = sanitized["name"]
    if "avatarUrl" in sanitized:
        user_updates["avatar_url"] = sanitized["avatarUrl"]
    if user_updates:
        await db_manager.users.update_one(
            {"$or": [{"id": student_id}, {"user_id": student_id}]},
            {"$set": user_updates}
        )

    updated = await db_manager.students.find_one({"$or": [{"id": student_id}, {"user_id": student_id}]})
    return {
        "success": True,
        "data": clean_doc(updated),
        "message": "Student profile updated successfully"
    }


# ==========================================
# Faculty Endpoints
# ==========================================

@router.get("/faculty")
async def list_faculty():
    """Retrieves all faculty profiles and research interests."""
    cursor = db_manager.faculty.find({})
    faculty_list = []
    async for doc in cursor:
        faculty_list.append(clean_doc(doc))
    return {
        "success": True,
        "data": faculty_list
    }


@router.get("/faculty/{faculty_id}")
async def get_faculty_by_id(faculty_id: str):
    """Retrieves faculty profile by ID."""
    doc = await db_manager.faculty.find_one({"$or": [{"id": faculty_id}, {"user_id": faculty_id}]})
    if not doc:
        raise HTTPException(status_code=404, detail="Faculty profile not found")
    return {"success": True, "data": clean_doc(doc)}


@router.put("/faculty/{faculty_id}")
async def update_faculty_profile(
    faculty_id: str,
    update_data: Dict[str, Any]
):
    """Updates faculty research profile."""
    doc = await db_manager.faculty.find_one({"$or": [{"id": faculty_id}, {"user_id": faculty_id}]})
    if not doc:
        raise HTTPException(status_code=404, detail="Faculty profile not found")

    sanitized = {k: v for k, v in update_data.items() if k != "user_id" and v is not None}
    await db_manager.faculty.update_one(
        {"$or": [{"id": faculty_id}, {"user_id": faculty_id}]},
        {"$set": sanitized}
    )
    updated = await db_manager.faculty.find_one({"$or": [{"id": faculty_id}, {"user_id": faculty_id}]})
    return {"success": True, "data": clean_doc(updated)}


# ==========================================
# Admin & Verification Endpoints
# ==========================================

@router.post("/admin/verify-alumni/{alumni_id}")
async def verify_alumni(alumni_id: str):
    """Authoritative admin action to verify an alumni profile."""
    alumni = await db_manager.alumni.find_one({"$or": [{"id": alumni_id}, {"user_id": alumni_id}]})
    if not alumni:
        raise HTTPException(status_code=404, detail="Alumni profile not found")

    now_iso = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    await db_manager.alumni.update_one(
        {"$or": [{"id": alumni_id}, {"user_id": alumni_id}]},
        {
            "$set": {
                "verification_status": VerificationStatus.VERIFIED.value,
                "is_verified": True,
                "verified_at": now_iso,
                "badge_tier": "Verified Alum ✨"
            }
        }
    )

    # Also update user document
    uid = alumni.get("user_id") or alumni.get("id")
    await db_manager.users.update_one(
        {"id": uid},
        {"$set": {"is_verified": True}}
    )

    return {
        "success": True,
        "message": f"Alumni {alumni.get('name')} successfully verified.",
        "verified_at": now_iso
    }


# ==========================================
# Skills Taxonomy
# ==========================================

@router.get("/skills")
async def get_skills():
    """Retrieves standard skills catalogue."""
    cursor = db_manager.skills.find({})
    skills_list = []
    async for doc in cursor:
        skills_list.append(clean_doc(doc))
    return {
        "success": True,
        "data": skills_list
    }
