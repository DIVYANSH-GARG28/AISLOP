"""Authentication router: register, login, session inspection."""

import time
import uuid
from typing import Dict, Any, Optional
from fastapi import APIRouter, HTTPException, Depends, status
from connected_backend.database import db_manager, clean_doc
from connected_backend.models import (
    UserRegisterRequest,
    UserLoginRequest,
    UserRole,
    VerificationStatus
)
from connected_backend.security import (
    hash_password,
    verify_password,
    create_access_token,
    get_current_user_payload
)

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/register")
async def register(req: UserRegisterRequest):
    """Registers a new user and creates their role-specific profile document."""
    # Check if user with email already exists
    existing = await db_manager.users.find_one({"email": req.email.lower()})
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"message": "An account with this email address already exists"}
        )

    user_id = f"usr_{uuid.uuid4().hex[:12]}"
    hashed_pw = hash_password(req.password)
    now_iso = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())

    # Create User Document
    user_doc = {
        "id": user_id,
        "email": req.email.lower(),
        "password_hash": hashed_pw,
        "name": req.name,
        "role": req.role.value,
        "avatar_url": "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=250",
        "created_at": now_iso,
        "is_verified": req.role != UserRole.ALUMNI,  # Alumni require verification
    }
    await db_manager.users.insert_one(user_doc)

    # Create Role-Specific Profile Document
    if req.role == UserRole.STUDENT:
        student_doc = {
            "id": user_id,
            "user_id": user_id,
            "name": req.name,
            "email": req.email.lower(),
            "university": req.university or "IIIT",
            "degree": "B.Tech Computer Science",
            "major": req.major or "Computer Science",
            "graduation_year": req.graduation_year or 2026,
            "gpa": 3.8,
            "target_role": req.target_role or "Software Engineer",
            "target_company": req.target_company or "Google",
            "skills": ["Python", "Data Structures", "Web Development"],
            "bio": f"Student at {req.university or 'IIIT'} passionate about engineering.",
            "readiness_score": 65,
            "days_completed": 0
        }
        await db_manager.students.insert_one(student_doc)

    elif req.role == UserRole.ALUMNI:
        alumni_doc = {
            "id": user_id,
            "user_id": user_id,
            "name": req.name,
            "email": req.email.lower(),
            "avatar_url": user_doc["avatar_url"],
            "current_role": req.current_role or "Software Engineer",
            "company": req.company or "Tech Enterprise",
            "location": "India / Remote",
            "graduation_year": req.graduation_year or 2021,
            "degree": "B.Tech Computer Science",
            "major": req.major or "Computer Science",
            "university": req.university or "IIIT",
            "previous_roles": [],
            "skills": ["Python", "System Design", "Cloud Infrastructure"],
            "verification_status": VerificationStatus.PENDING.value,
            "is_verified": False,
            "verified_at": None,
            "impact_score": 750,
            "mentees_guided": 0,
            "badge_tier": "New Mentor 🌱",
            "bio": f"Alumnus from {req.university or 'IIIT'} working at {req.company or 'Tech Enterprise'}.",
            "availability": "Available for Mentorship",
            "is_mentor": True,
            "max_mentees": 3
        }
        await db_manager.alumni.insert_one(alumni_doc)

    elif req.role == UserRole.FACULTY:
        faculty_doc = {
            "id": user_id,
            "user_id": user_id,
            "name": req.name,
            "email": req.email.lower(),
            "department": req.major or "Computer Science & Engineering",
            "title": "Professor",
            "university": req.university or "IIIT",
            "research_interests": ["Artificial Intelligence", "Distributed Systems"],
            "publications_count": 10,
            "bio": f"Faculty member at {req.university or 'IIIT'}."
        }
        await db_manager.faculty.insert_one(faculty_doc)

    # Generate JWT Token
    token = create_access_token({
        "sub": user_id,
        "email": req.email.lower(),
        "role": req.role.value,
        "name": req.name
    })

    return {
        "success": True,
        "token": token,
        "user": {
            "id": user_id,
            "name": req.name,
            "email": req.email.lower(),
            "role": req.role.value,
            "avatar_url": user_doc["avatar_url"],
            "targetRole": req.target_role,
            "targetCompany": req.target_company
        }
    }


@router.post("/login")
async def login(req: UserLoginRequest):
    """Authenticates user with email/password and returns JWT token."""
    user = await db_manager.users.find_one({"email": req.email.lower()})
    if not user or not verify_password(req.password, user.get("password_hash", "")):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"message": "Invalid email or password"}
        )

    user_clean = clean_doc(user)
    token = create_access_token({
        "sub": user_clean["id"],
        "email": user_clean["email"],
        "role": user_clean["role"],
        "name": user_clean["name"]
    })

    # Fetch corresponding profile
    student_prof = None
    alumni_prof = None
    if user_clean["role"] == UserRole.STUDENT.value:
        student_prof = clean_doc(await db_manager.students.find_one({"user_id": user_clean["id"]}))
    elif user_clean["role"] == UserRole.ALUMNI.value:
        alumni_prof = clean_doc(await db_manager.alumni.find_one({"user_id": user_clean["id"]}))

    return {
        "success": True,
        "token": token,
        "user": {
            "id": user_clean["id"],
            "name": user_clean["name"],
            "email": user_clean["email"],
            "role": user_clean["role"],
            "avatar_url": user_clean.get("avatar_url"),
            "studentProfile": student_prof,
            "alumniProfile": alumni_prof,
            "targetRole": student_prof.get("target_role") if student_prof else None,
            "targetCompany": student_prof.get("target_company") if student_prof else None,
        }
    }


@router.get("/me")
async def get_me(current_payload: Dict[str, Any] = Depends(get_current_user_payload)):
    """Returns currently authenticated user profile."""
    user_id = current_payload.get("sub") or current_payload.get("user_id")
    user = await db_manager.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user_clean = clean_doc(user)
    student_prof = clean_doc(await db_manager.students.find_one({"user_id": user_id}))
    alumni_prof = clean_doc(await db_manager.alumni.find_one({"user_id": user_id}))
    faculty_prof = clean_doc(await db_manager.faculty.find_one({"user_id": user_id}))

    return {
        "success": True,
        "data": {
            **user_clean,
            "studentProfile": student_prof,
            "alumniProfile": alumni_prof,
            "facultyProfile": faculty_prof,
        }
    }
