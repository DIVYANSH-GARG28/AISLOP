import json
import io
import uuid
import requests
from typing import Optional
from pypdf import PdfReader
from src.ai.config import config
from src.ai.schemas.profile_schemas import ProfileTextParseRequest, ProfileParseResponse, ExtractedProfile, ResumeMatchResponse
from src.ai.schemas.alumni_schemas import StudentProfile
from src.ai.services.alumni_search import search_alumni_with_profile
from src.ai.data.alumni_db import save_alumnus_record

def parse_profile_text(request: ProfileTextParseRequest) -> ProfileParseResponse:
    """Parses raw bio, resume, or profile text using Gemini LLM into structured profile."""
    if not request.rawText.strip():
        return ProfileParseResponse(
            success=False,
            message="Raw text cannot be empty.",
            profile=_create_empty_profile("Unknown")
        )

    if config.GEMINI_API_KEY:
        parsed = _call_gemini_profile_llm(request.rawText)
        if parsed:
            parsed.id = parsed.id or f"prof_{uuid.uuid4().hex[:8]}"
            return ProfileParseResponse(
                success=True,
                message="Successfully parsed profile text using AI LLM.",
                profile=parsed
            )

    # Fallback basic extraction if Gemini key is unavailable
    fallback_prof = _fallback_text_extract(request.rawText)
    return ProfileParseResponse(
        success=True,
        message="Parsed profile using heuristic fallback.",
        profile=fallback_prof
    )

def parse_pdf_resume_bytes(pdf_bytes: bytes) -> ProfileParseResponse:
    """Extracts text from PDF resume file and parses with Gemini LLM."""
    try:
        reader = PdfReader(io.BytesIO(pdf_bytes))
        extracted_text = ""
        for page in reader.pages:
            t = page.extract_text()
            if t:
                extracted_text += t + "\n"
        
        if not extracted_text.strip():
            return ProfileParseResponse(
                success=False,
                message="Could not extract readable text from PDF. It may be an image scan.",
                profile=_create_empty_profile("Resume User")
            )
        
        return parse_profile_text(ProfileTextParseRequest(rawText=extracted_text))
    except Exception as e:
        return ProfileParseResponse(
            success=False,
            message=f"Failed to read PDF resume: {str(e)}",
            profile=_create_empty_profile("Resume User")
        )

def match_alumni_from_resume_text(request: ProfileTextParseRequest) -> ResumeMatchResponse:
    """Parses raw text resume/bio and matches top alumni/mentors."""
    parse_res = parse_profile_text(request)
    if not parse_res.success:
        return ResumeMatchResponse(
            success=False,
            message=parse_res.message,
            extractedProfile=parse_res.profile,
            matchedAlumni=[]
        )

    prof = parse_res.profile
    student_profile = StudentProfile(
        name=prof.name,
        bio=prof.bio or prof.headline,
        skills=prof.skills,
        targetRole=prof.headline or prof.role,
        targetCompanies=[prof.company] if prof.company else []
    )

    search_prompt = f"Find top matching alumni mentors for {prof.name} specializing in {', '.join(prof.skills[:4])}"
    search_res = search_alumni_with_profile(search_prompt, student_profile)

    return ResumeMatchResponse(
        success=True,
        message=f"Successfully extracted resume for {prof.name} and matched top alumni mentors.",
        extractedProfile=prof,
        matchedAlumni=search_res.matches
    )

def match_alumni_from_resume_pdf(pdf_bytes: bytes) -> ResumeMatchResponse:
    """Extracts text from PDF resume, parses profile, and matches top alumni/mentors."""
    try:
        reader = PdfReader(io.BytesIO(pdf_bytes))
        extracted_text = ""
        for page in reader.pages:
            t = page.extract_text()
            if t:
                extracted_text += t + "\n"

        if not extracted_text.strip():
            return ResumeMatchResponse(
                success=False,
                message="Could not extract text from PDF resume.",
                extractedProfile=_create_empty_profile("Resume User"),
                matchedAlumni=[]
            )

        return match_alumni_from_resume_text(ProfileTextParseRequest(rawText=extracted_text))
    except Exception as e:
        return ResumeMatchResponse(
            success=False,
            message=f"Error reading PDF resume: {str(e)}",
            extractedProfile=_create_empty_profile("Resume User"),
            matchedAlumni=[]
        )

def _call_gemini_profile_llm(raw_text: str) -> Optional[ExtractedProfile]:
    prompt = f"""
You are an expert AI Resume and Profile Intelligence Extractor for ConnectEd.
Analyze the following text (which could be a bio, resume, or user profile summary) and extract structured details.

PROFILE SOURCE TEXT:
\"\"\"
{raw_text}
\"\"\"

INSTRUCTIONS:
1. Extract the full name. If not explicitly found, infer or use "Profile User".
2. Extract current job title/headline and company.
3. Extract technical and soft skills into a list of strings (e.g. ["Python", "React", "AWS", "Leadership"]).
4. Extract work experiences or career background summary points into a list of strings.
5. Extract education degrees or certifications into a list of strings.
6. Return a concise, professional 2-3 sentence bio summary.

Return ONLY a valid JSON object matching this exact structure:
{{
  "id": "prof_{uuid.uuid4().hex[:8]}",
  "name": "Full Name",
  "headline": "Current Job Title / Headline",
  "company": "Company Name",
  "role": "Role / Position",
  "location": "City, Country",
  "bio": "Extracted professional bio summary.",
  "skills": ["Skill1", "Skill2", "Skill3"],
  "experience": ["Company A - Software Engineer (2021-Present)", "Company B - Developer Intern"],
  "education": ["B.Tech Computer Science - University X"],
  "email": "user@example.com"
}}
"""
    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {"responseMimeType": "application/json", "temperature": 0.1}
    }

    for model_name in config.GEMINI_MODELS:
        try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={config.GEMINI_API_KEY}"
            res = requests.post(url, json=payload, timeout=20)
            if res.status_code == 200:
                text = res.json()["candidates"][0]["content"]["parts"][0]["text"]
                parsed_json = json.loads(text)
                return ExtractedProfile(**parsed_json)
        except Exception as e:
            print(f"[Profile AI Parser] Error with model {model_name}: {e}")

    return None

def _fallback_text_extract(raw_text: str) -> ExtractedProfile:
    lines = [l.strip() for l in raw_text.splitlines() if l.strip()]
    name = lines[0] if lines else "User Profile"
    
    # Common tech skills heuristic keywords
    skill_keywords = ["Python", "JavaScript", "TypeScript", "React", "Node.js", "Java", "C++", "AWS", "Docker", "SQL", "Git", "Machine Learning"]
    found_skills = [s for s in skill_keywords if s.lower() in raw_text.lower()]
    if not found_skills:
        found_skills = ["Software Engineering", "Communication"]

    return ExtractedProfile(
        id=f"prof_{uuid.uuid4().hex[:8]}",
        name=name if len(name) < 40 else "User Profile",
        headline="Tech Professional / Student",
        company="ConnectEd Member",
        role="Engineer",
        location="India",
        bio=raw_text[:250] + ("..." if len(raw_text) > 250 else ""),
        skills=found_skills,
        experience=["Extracted from submitted profile text"],
        education=["Computer Science / STEM background"],
        email=""
    )

def _create_empty_profile(name: str) -> ExtractedProfile:
    return ExtractedProfile(
        id=f"prof_{uuid.uuid4().hex[:8]}",
        name=name,
        headline="User Profile",
        company="",
        role="",
        location="",
        bio="",
        skills=[],
        experience=[],
        education=[],
        email=""
    )
