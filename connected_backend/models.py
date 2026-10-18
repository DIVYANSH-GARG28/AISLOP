"""Pydantic schemas and domain models for connectED platform."""

from enum import Enum
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, EmailStr, Field


# ==========================================
# Enums
# ==========================================

class UserRole(str, Enum):
    STUDENT = "STUDENT"
    ALUMNI = "ALUMNI"
    FACULTY = "FACULTY"
    ADMIN = "ADMIN"
    RECRUITER = "RECRUITER"


class VerificationStatus(str, Enum):
    PENDING = "PENDING"
    VERIFIED = "VERIFIED"
    REJECTED = "REJECTED"


class MentorshipStatus(str, Enum):
    PENDING = "PENDING"
    ACCEPTED = "ACCEPTED"
    DECLINED = "DECLINED"
    EXPIRED = "EXPIRED"
    CANCELLED = "CANCELLED"


# ==========================================
# Sub-models & Value Objects
# ==========================================

class PreviousRole(BaseModel):
    title: str
    company: str
    duration: Optional[str] = None
    start_year: Optional[int] = None
    end_year: Optional[int] = None


class MatchReason(BaseModel):
    category: str  # 'skill_match' | 'company_match' | 'role_match' | 'track_record'
    description: str
    score_contribution: float


# ==========================================
# User Auth Models
# ==========================================

class UserRegisterRequest(BaseModel):
    email: EmailStr
    password: str
    name: str
    role: UserRole = UserRole.STUDENT
    # Optional profile initializers
    major: Optional[str] = "Computer Science"
    graduation_year: Optional[int] = 2026
    university: Optional[str] = "IIIT"
    target_role: Optional[str] = None
    target_company: Optional[str] = None
    company: Optional[str] = None
    current_role: Optional[str] = None


class UserLoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: str
    email: EmailStr
    name: str
    role: UserRole
    avatar_url: Optional[str] = None
    telegram_user_id: Optional[int] = None
    telegram_chat_id: Optional[int] = None
    telegram_username: Optional[str] = None
    is_verified: bool = False
    is_institution_verified: bool = False
    institution_email: Optional[str] = None
    institution_domain: Optional[str] = None
    institution_verified_at: Optional[str] = None
    created_at: Optional[str] = None
    student_profile: Optional[Dict[str, Any]] = None
    alumni_profile: Optional[Dict[str, Any]] = None
    faculty_profile: Optional[Dict[str, Any]] = None


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: Dict[str, Any]
    success: bool = True


# ==========================================
# Student Profile Models
# ==========================================

class StudentProfile(BaseModel):
    id: Optional[str] = None
    user_id: str
    name: str
    email: str
    university: str = "IIIT"
    degree: str = "B.Tech Computer Science"
    major: str = "Computer Science"
    graduation_year: int = 2026
    gpa: Optional[float] = 3.8
    skills: List[str] = Field(default_factory=list)
    target_role: Optional[str] = "Software Engineer"
    target_company: Optional[str] = "Google"
    bio: Optional[str] = ""
    github_url: Optional[str] = None
    linkedin_url: Optional[str] = None
    resume_url: Optional[str] = None
    readiness_score: int = 65
    days_completed: int = 36
    is_institution_verified: bool = False
    institution_email: Optional[str] = None
    institution_domain: Optional[str] = None
    institution_verified_at: Optional[str] = None


class StudentProfileUpdate(BaseModel):
    name: Optional[str] = None
    major: Optional[str] = None
    graduation_year: Optional[int] = None
    gpa: Optional[float] = None
    skills: Optional[List[str]] = None
    target_role: Optional[str] = None
    target_company: Optional[str] = None
    bio: Optional[str] = None
    github_url: Optional[str] = None
    linkedin_url: Optional[str] = None
    resume_url: Optional[str] = None


# ==========================================
# Alumni Profile Models
# ==========================================

class AlumniProfile(BaseModel):
    id: Optional[str] = None
    user_id: str
    name: str
    email: str
    avatar_url: Optional[str] = None
    current_role: str = "Senior Software Engineer"
    company: str = "Google"
    location: str = "Mountain View, CA / Remote"
    graduation_year: int = 2020
    degree: str = "B.Tech Computer Science"
    major: str = "Computer Science"
    university: str = "IIIT"
    previous_roles: List[PreviousRole] = Field(default_factory=list)
    skills: List[str] = Field(default_factory=list)
    verification_status: VerificationStatus = VerificationStatus.VERIFIED
    is_verified: bool = True
    verified_at: Optional[str] = None
    impact_score: int = 850
    mentees_guided: int = 12
    badge_tier: str = "Verified Alum ✨"
    bio: Optional[str] = ""
    availability: str = "Available for Mentorship & Referral"
    is_mentor: bool = True
    max_mentees: int = 5
    linkedin_url: Optional[str] = None
    telegram_user_id: Optional[int] = None
    telegram_chat_id: Optional[int] = None


class AlumniProfileUpdate(BaseModel):
    name: Optional[str] = None
    current_role: Optional[str] = None
    company: Optional[str] = None
    location: Optional[str] = None
    graduation_year: Optional[int] = None
    degree: Optional[str] = None
    major: Optional[str] = None
    previous_roles: Optional[List[PreviousRole]] = None
    skills: Optional[List[str]] = None
    bio: Optional[str] = None
    availability: Optional[str] = None
    is_mentor: Optional[bool] = None
    max_mentees: Optional[int] = None
    linkedin_url: Optional[str] = None
    avatar_url: Optional[str] = None


# ==========================================
# Faculty Profile Models
# ==========================================

class FacultyProfile(BaseModel):
    id: Optional[str] = None
    user_id: str
    name: str
    email: str
    department: str = "Computer Science & Engineering"
    title: str = "Professor & Head of Research"
    university: str = "IIIT"
    research_interests: List[str] = Field(default_factory=list)
    publications_count: int = 24
    office_hours: Optional[str] = "Mon/Wed 2:00 PM - 4:00 PM"
    bio: Optional[str] = ""
    website_url: Optional[str] = None
    avatar_url: Optional[str] = None


class FacultyProfileUpdate(BaseModel):
    name: Optional[str] = None
    department: Optional[str] = None
    title: Optional[str] = None
    research_interests: Optional[List[str]] = None
    publications_count: Optional[int] = None
    office_hours: Optional[str] = None
    bio: Optional[str] = None
    website_url: Optional[str] = None
    avatar_url: Optional[str] = None


# ==========================================
# Skills Model
# ==========================================

class SkillItem(BaseModel):
    id: Optional[str] = None
    name: str
    category: str = "Technical"
    demand_level: str = "High"


# ==========================================
# Mentorship Request & Recommendation Models
# ==========================================

class MentorshipRequestCreate(BaseModel):
    mentor_id: str
    topic: str
    message: str
    skills: List[str] = Field(default_factory=list)
    preferred_date: Optional[str] = None
    preferred_time: Optional[str] = None
    request_type: str = "mentorship"  # 'mentorship' | 'referral'


class MentorshipRequestResponse(BaseModel):
    id: str
    request_id: str
    mentor_id: str
    mentor_name: str
    mentor_company: str
    mentee_id: str
    mentee_name: str
    topic: str
    message: str
    skills: List[str]
    match_score: int
    match_reasons: List[str]
    status: MentorshipStatus
    created_at: str
    expires_at: str
    deadline_hours: int = 48
    responded_at: Optional[str] = None
    decline_reason: Optional[str] = None


class MentorshipRespondRequest(BaseModel):
    action: str = Field(..., description="'accept' or 'decline'")
    reason: Optional[str] = Field(None, description="Reason if declining")


class MentorRecommendation(BaseModel):
    alumni_id: str
    name: str
    current_role: str
    company: str
    avatar_url: str
    graduation_year: int
    skills: List[str]
    impact_score: int
    mentees_guided: int
    badge_tier: str
    is_verified: bool
    availability: str
    match_score: int
    match_reasons: List[str]


# ==========================================
# Telegram Integration Models
# ==========================================

class TelegramLinkInitiateRequest(BaseModel):
    user_id: str
    email: EmailStr
    role: UserRole


class TelegramLinkInitiateResponse(BaseModel):
    success: bool
    token: str
    expires_at: str
    deep_link_url: str
    message: str


class TelegramLinkValidateRequest(BaseModel):
    token: str
    telegram_user_id: int
    telegram_chat_id: int
    telegram_username: Optional[str] = None


class TelegramLinkValidateResponse(BaseModel):
    success: bool
    user_id: Optional[str] = None
    role: Optional[UserRole] = None
    full_name: Optional[str] = None
    message: str


# ==========================================
# Institutional Verification Models
# ==========================================

class InstituteOtpRequest(BaseModel):
    email: str = Field(..., description="Institutional email address, e.g. user@its.edu.in")
    institution_name: Optional[str] = "ITS Engineering College / IIIT"


class InstituteOtpConfirm(BaseModel):
    email: str
    otp: str = Field(..., min_length=4, max_length=8, description="6-digit verification code")


class InstituteStatusResponse(BaseModel):
    is_verified: bool
    institution_email: Optional[str] = None
    institution_name: Optional[str] = None
    institution_domain: Optional[str] = None
    verified_at: Optional[str] = None


# Generic API standard response envelope
class ApiResponse(BaseModel):
    success: bool = True
    data: Optional[Any] = None
    message: Optional[str] = None
    error: Optional[Dict[str, Any]] = None
