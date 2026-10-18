from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional

from src.ai.schemas.alumni_schemas import SearchRequest, StudentProfileSearchRequest, AlumniSearchResult
from src.ai.schemas.roadmap_schemas import RoadmapRequest, RoadmapResponse, TopicResourceSearchRequest, StudyResource
from src.ai.schemas.profile_schemas import ProfileTextParseRequest, ProfileParseResponse, ResumeMatchResponse

from src.ai.services.alumni_search import search_alumni_by_skills, search_alumni_with_profile
from src.ai.services.career_roadmap import generate_career_roadmap
from src.ai.services.tavily_search import search_tavily_resources
from src.ai.services.profile_parser import (
    parse_profile_text, 
    parse_pdf_resume_bytes,
    match_alumni_from_resume_text,
    match_alumni_from_resume_pdf
)

app = FastAPI(
    title="ConnectEd AI Engine",
    description="Python AI Engine powering semantic alumni search, AI resume/profile parsing, career goal analysis, and 4-phase learning roadmap generation.",
    version="2.0.0"
)

# Enable CORS for Node.js backend and React frontend interaction
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

import os
from fastapi.responses import HTMLResponse

@app.get("/", response_class=HTMLResponse)
@app.get("/playground", response_class=HTMLResponse)
def serve_playground():
    html_path = os.path.join(os.path.dirname(__file__), "test_playground.html")
    if os.path.exists(html_path):
        with open(html_path, "r", encoding="utf-8") as f:
            return f.read()
    return "<h1>ConnectEd AI Engine is Online</h1><p>Visit /docs for API Swagger UI.</p>"

@app.get("/api/health")
def health_check():
    return {
        "status": "online",
        "service": "ConnectEd Python AI Engine",
        "version": "2.0.0"
    }

# 1. Semantic Alumni Search Endpoints
@app.post("/api/ai/alumni-search", response_model=AlumniSearchResult)
def api_search_alumni(request: SearchRequest):
    if not request.query.strip():
        raise HTTPException(status_code=400, detail="Query string cannot be empty")
    return search_alumni_by_skills(request.query)

@app.post("/api/ai/alumni-search-with-profile", response_model=AlumniSearchResult)
def api_search_alumni_with_profile(request: StudentProfileSearchRequest):
    return search_alumni_with_profile(request.userPrompt, request.studentProfile)

# 2. Career Goal Analysis & Skill-Gap Roadmap Generator Endpoint
@app.post("/api/ai/generate-roadmap", response_model=RoadmapResponse)
def api_generate_career_roadmap(request: RoadmapRequest):
    """
    Analyzes student skills & background vs target role, creates a 4-phase structured learning roadmap,
    and attaches top matching alumni mentors.
    """
    if not request.targetRole.strip():
        raise HTTPException(status_code=400, detail="Target career role is required.")
    return generate_career_roadmap(request)

@app.post("/api/ai/search-resources", response_model=List[StudyResource])
def api_search_tavily_resources(request: TopicResourceSearchRequest):
    """
    Dynamically searches and categorizes study resources for a specified topic using server-side Tavily API.
    """
    if not request.topic.strip():
        raise HTTPException(status_code=400, detail="Topic string cannot be empty.")
    return search_tavily_resources(
        topic=request.topic,
        target_role=request.targetRole or "",
        max_results=request.maxResults or 3
    )

# 3. AI Profile & Resume Parser Endpoints
@app.post("/api/ai/parse-profile-text", response_model=ProfileParseResponse)
def api_parse_profile_text(request: ProfileTextParseRequest):
    """Parses raw user bio or profile text using Gemini LLM into structured profile fields."""
    return parse_profile_text(request)

@app.post("/api/ai/parse-resume-pdf", response_model=ProfileParseResponse)
async def api_parse_resume_pdf(file: UploadFile = File(...)):
    """Extracts text from uploaded PDF resume and converts to structured profile using Gemini LLM."""
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Uploaded file must be a PDF document.")
    contents = await file.read()
    return parse_pdf_resume_bytes(contents)

# 4. Resume-Based Alumni & Mentorship Matching Endpoints
@app.post("/api/ai/match-resume-text", response_model=ResumeMatchResponse)
def api_match_resume_text(request: ProfileTextParseRequest):
    """Parses raw text resume/bio, extracts profile, and returns top matched alumni mentors."""
    return match_alumni_from_resume_text(request)

@app.post("/api/ai/match-resume-pdf", response_model=ResumeMatchResponse)
async def api_match_resume_pdf(file: UploadFile = File(...)):
    """Extracts text from uploaded PDF resume, parses profile, and returns top matched alumni mentors."""
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Uploaded file must be a PDF document.")
    contents = await file.read()
    return match_alumni_from_resume_pdf(contents)
