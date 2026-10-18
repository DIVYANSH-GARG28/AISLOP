from pydantic import BaseModel, Field
from typing import List, Optional

class StudentProfile(BaseModel):
    name: str = Field(default="Test Student", description="Student's name")
    bio: str = Field(default="", description="Student's profile bio / background summary")
    skills: List[str] = Field(default_factory=list, description="List of student's current technical skills")
    targetRole: Optional[str] = Field(default=None, description="Student's target career role")
    targetCompanies: Optional[List[str]] = Field(default_factory=list, description="Target companies student wants to join")

class SearchRequest(BaseModel):
    query: str = Field(..., description="Semantic search query string", example="DevOps engineers with AWS experience")

class StudentProfileSearchRequest(BaseModel):
    userPrompt: str = Field(..., description="Raw text prompt typed by student", example="iammm springboot dev looking for alumni at Amazon or Zoho")
    studentProfile: StudentProfile = Field(..., description="Student's profile context (bio, skills, goals)")

class ExtractedIntent(BaseModel):
    studentSkills: List[str] = Field(default_factory=list, description="Combined extracted skills")
    targetDomain: str = Field(default="Software Development", description="Target domain identified from query and profile")
    targetCompanies: List[str] = Field(default_factory=list, description="Target companies extracted")

class AlumniMatch(BaseModel):
    alumniId: str
    name: str
    role: str
    company: str
    matchedSkills: List[str]
    matchScore: int = Field(..., description="Calculated relevance match score from 0 to 100")
    matchPercentage: str = Field(..., description="Formatted match percentage string, e.g., '92%'")
    isSimilarRecommendation: bool = Field(default=False, description="True if recommended as a similar alternative when 0 exact matches exist")
    reason: str = Field(..., description="Human-understandable explanation for the match")

class AlumniSearchResult(BaseModel):
    query: str
    extractedIntent: ExtractedIntent
    matches: List[AlumniMatch]
