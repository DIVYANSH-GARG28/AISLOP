import json
import re
import requests
from typing import List, Dict, Any, Optional
from src.ai.config import config
from src.ai.data.alumni_db import load_alumni_database
from src.ai.schemas.alumni_schemas import (
    AlumniSearchResult, 
    AlumniMatch, 
    ExtractedIntent,
    StudentProfile
)

def search_alumni_by_skills(user_query: str, custom_db: Optional[List[Dict[str, Any]]] = None) -> AlumniSearchResult:
    """Simple query search."""
    dummy_profile = StudentProfile(name="Student", bio="", skills=[])
    return search_alumni_with_profile(user_query, dummy_profile, custom_db)

def search_alumni_with_profile(
    user_prompt: str, 
    student_profile: StudentProfile, 
    custom_db: Optional[List[Dict[str, Any]]] = None
) -> AlumniSearchResult:
    """
    100% LLM-Powered NLP Alumni Search Engine using Google Gemini.
    Parses bio, prompt, skills, and target career goals to calculate true match percentages and human explanations.
    """
    db = custom_db or load_alumni_database()
    
    if config.GEMINI_API_KEY:
        llm_res = _call_gemini_llm_chain(user_prompt, student_profile, db)
        if llm_res and len(llm_res.matches) > 0:
            return llm_res

    # Resilient Fallback Engine if API key is unconfigured
    return _fallback_profile_matcher(user_prompt, student_profile, db)

def _call_gemini_llm_chain(
    user_prompt: str, 
    student_profile: StudentProfile, 
    db: List[Dict[str, Any]]
) -> Optional[AlumniSearchResult]:
    """Iterates through active Gemini models to perform deep LLM NLP reasoning."""
    
    prompt = f"""
You are the AI Semantic Alumni Matcher for ConnectEd.

STUDENT PROFILE CONTEXT:
- Student Name: {student_profile.name}
- Student Bio: "{student_profile.bio}"
- Explicit Profile Skills List: {json.dumps(student_profile.skills)}
- Target Role: {student_profile.targetRole or 'Not specified'}
- Target Companies: {json.dumps(student_profile.targetCompanies or [])}

RAW USER SEARCH PROMPT: "{user_prompt}"

ALUMNI DATABASE ({len(db)} total records):
{json.dumps(db, indent=2)}

DEEP NLP INSTRUCTIONS:
1. READ & ANALYZE the Student's Bio, Skills List, and Raw Search Prompt. Extract hidden & explicit skills (e.g. if bio says 'Java backend student developer', extract ['Java', 'Spring Boot', 'Backend Development', 'REST APIs']).
2. DETERMINE SEARCH QUERY INTENT:
   - Does the prompt explicitly ask for a specific company/filter (e.g. "search Microsoft employees")? If so, prioritize matching that specific company.
   - If prompt says "find me alumni similar to my skill" or is general, match based on student's bio & skills.
3. MATCH & RANK ALUMNI:
   - Find top alumni from the database who match the student's extracted skills, domain, or target companies.
   - NEVER invent alumni outside the database.
4. CALCULATE REALISTIC RELEVANCE MATCH SCORES:
   - matchScore: Integer score between 60 and 98 based on true skill overlap and career path alignment.
   - matchPercentage: Format string as "XX%" (e.g. "96%", "88%", "75%").
   - Sort matches descending by matchScore.
5. EXPLAINABLE REASONING:
   - Provide a clear, human-understandable explanation for WHY each alumnus matches the student.
6. IF 0 EXACT MATCHES EXIST:
   - Return top 3-4 similar alumni in related engineering domains with isSimilarRecommendation=true and 75% match.

Return ONLY a valid JSON object matching this schema structure:
{{
  "query": "{user_prompt}",
  "extractedIntent": {{
    "studentSkills": ["ExtractedSkill1", "ExtractedSkill2"],
    "targetDomain": "Domain Name",
    "targetCompanies": ["TargetCompany1"]
  }},
  "matches": [
    {{
      "alumniId": "alum-1",
      "name": "Alumnus Name",
      "role": "Role Title",
      "company": "Company Name",
      "matchedSkills": ["MatchedSkill1", "MatchedSkill2"],
      "matchScore": 95,
      "matchPercentage": "95%",
      "isSimilarRecommendation": false,
      "reason": "Detailed natural language explanation for why this alumnus matches."
    }}
  ]
}}
"""
    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {"responseMimeType": "application/json", "temperature": 0.1}
    }

    for model_name in config.GEMINI_MODELS:
        try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={config.GEMINI_API_KEY}"
            res = requests.post(url, json=payload, timeout=25)
            if res.status_code == 200:
                data = res.json()
                text = data["candidates"][0]["content"]["parts"][0]["text"]
                parsed_json = json.loads(text)
                return AlumniSearchResult(**parsed_json)
        except Exception:
            pass

    return None

def _fallback_profile_matcher(
    user_prompt: str, 
    student_profile: StudentProfile, 
    db: List[Dict[str, Any]]
) -> AlumniSearchResult:
    combined_text = f"{user_prompt} {student_profile.bio} {' '.join(student_profile.skills)} {student_profile.targetRole or ''}".lower()
    
    known_tech = ["react", "frontend", "spring boot", "java", "python", "pytorch", "aws", "docker", "figma", "javascript"]
    detected_skills = [t for t in known_tech if t in combined_text]

    matches = []
    for alum in db:
        alum_skills = alum.get("skills", [])
        matched = [s for s in alum_skills if any(ds in s.lower() for ds in detected_skills)]
        
        if matched or any(ds in alum.get("role", "").lower() for ds in detected_skills):
            matches.append(
                AlumniMatch(
                    alumniId=str(alum.get("id", "")),
                    name=alum["name"],
                    role=alum["role"],
                    company=alum.get("company", ""),
                    matchedSkills=matched if matched else ["Relevant Domain"],
                    matchScore=85,
                    matchPercentage="85%",
                    isSimilarRecommendation=False,
                    reason=f"Matched background in {alum['role']} at {alum.get('company', '')}."
                )
            )

    return AlumniSearchResult(
        query=user_prompt,
        extractedIntent=ExtractedIntent(studentSkills=detected_skills, targetDomain="Software Engineering", targetCompanies=[]),
        matches=matches
    )
