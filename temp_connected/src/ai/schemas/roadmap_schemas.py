from pydantic import BaseModel, Field
from typing import List, Optional
from src.ai.schemas.alumni_schemas import AlumniMatch

class RoadmapRequest(BaseModel):
    studentName: str = Field(default="Student", description="Student's name")
    bio: Optional[str] = Field(default="", description="Student background bio summary")
    currentSkills: List[str] = Field(..., description="List of current skills possessed", example=["Java", "SQL", "Git"])
    targetRole: str = Field(..., description="Target career role desired", example="DevOps Engineer")
    targetCompany: Optional[str] = Field(default="", description="Optional target company focus", example="Flipkart")
    timelineWeeks: Optional[int] = Field(default=12, description="Target timeline in weeks for the roadmap")

class SkillGapAnalysis(BaseModel):
    possessedSkills: List[str] = Field(..., description="Skills student already possesses")
    missingSkills: List[str] = Field(..., description="Critical skill gaps required for target role")
    readinessScore: int = Field(..., description="Current career readiness score 0 to 100")
    analysisSummary: str = Field(..., description="Human-understandable summary of skill gaps and recommendations")

class StudyResource(BaseModel):
    id: str = Field(..., description="Unique resource ID")
    title: str = Field(..., description="Resource title")
    url: str = Field(..., description="Validated HTTP/HTTPS URL")
    category: str = Field(default="Tutorial", description="Category: Documentation, Video, Tutorial, Course, Practice, Project")
    source: str = Field(default="", description="Domain source name (e.g., docs.python.org)")
    snippet: str = Field(default="", description="Sanitized resource description/summary snippet")
    score: Optional[float] = Field(default=0.0, description="Relevance score 0.0 to 1.0")
    topic: Optional[str] = Field(default="", description="Associated roadmap topic name")
    phaseNumber: Optional[int] = Field(default=None, description="Associated roadmap phase number")
    ctaText: Optional[str] = Field(default="", description="Recommended UI CTA button text (e.g., 'Read Docs', 'Watch Video')")

class RoadmapPhase(BaseModel):
    phaseNumber: int = Field(..., description="Phase order (1, 2, 3, 4)")
    title: str = Field(..., description="Phase title (e.g. 'Core Fundamentals & Cloud Prerequisites')")
    duration: str = Field(..., description="Duration (e.g. 'Weeks 1-3')")
    description: str = Field(..., description="High-level description of what the student achieves")
    skillsToLearn: List[str] = Field(..., description="Specific technical skills learned in this phase")
    keyProjects: List[str] = Field(..., description="Recommended hands-on portfolio projects to build")
    recommendedTopics: List[str] = Field(..., description="Topics, books, or documentation areas to focus on")
    resources: List[StudyResource] = Field(default_factory=list, description="Tavily discovered study resources")

class RoadmapResponse(BaseModel):
    studentName: str
    targetRole: str
    targetCompany: Optional[str] = ""
    skillGapAnalysis: SkillGapAnalysis
    phases: List[RoadmapPhase]
    recommendedAlumniMentors: List[AlumniMatch]

class TopicResourceSearchRequest(BaseModel):
    topic: str = Field(..., description="Topic string to search resources for", example="Database Indexing")
    targetRole: Optional[str] = Field(default="", description="Optional target role context", example="Backend Engineer")
    maxResults: Optional[int] = Field(default=3, description="Maximum number of resources to return")
