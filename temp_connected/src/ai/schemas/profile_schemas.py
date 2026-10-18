from pydantic import BaseModel, Field
from typing import List, Optional

class ProfileTextParseRequest(BaseModel):
    rawText: str = Field(..., description="Raw bio, resume, or profile text to parse", example="Sidharth is a Senior Full Stack Engineer at Google with 4 years experience in Python, React, AWS, Docker...")
    userRole: Optional[str] = Field(default="alumni", description="Role type: 'alumni' or 'student'")

class ExtractedProfile(BaseModel):
    id: Optional[str] = Field(default=None, description="Unique profile ID")
    name: str = Field(..., description="Full Name extracted from profile/resume")
    headline: str = Field(..., description="Professional headline or title")
    company: Optional[str] = Field(default="", description="Current or recent company")
    role: Optional[str] = Field(default="", description="Primary job title or student status")
    location: Optional[str] = Field(default="", description="City, Region or Country")
    bio: str = Field(..., description="Professional summary / bio")
    skills: List[str] = Field(default_factory=list, description="Extracted technical and soft skills")
    experience: List[str] = Field(default_factory=list, description="Key work experiences or career milestones")
    education: List[str] = Field(default_factory=list, description="Degrees, universities, or certifications")
    email: Optional[str] = Field(default="", description="Contact email if found")

from src.ai.schemas.alumni_schemas import AlumniMatch

class ProfileParseResponse(BaseModel):
    success: bool
    message: str
    profile: ExtractedProfile

class ResumeMatchResponse(BaseModel):
    success: bool
    message: str
    extractedProfile: ExtractedProfile
    matchedAlumni: List[AlumniMatch]
