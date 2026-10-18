import json
import requests
from typing import List, Dict, Any, Optional
from src.ai.config import config
from src.ai.data.alumni_db import load_alumni_database
from src.ai.schemas.alumni_schemas import StudentProfile
from src.ai.services.alumni_search import search_alumni_with_profile
from src.ai.services.tavily_search import search_topic_study_resources, search_tavily_resources
from src.ai.schemas.roadmap_schemas import (
    RoadmapRequest,
    RoadmapResponse,
    SkillGapAnalysis,
    RoadmapPhase
)

def _enrich_phases_with_resources(roadmap: RoadmapResponse, target_role: str) -> RoadmapResponse:
    """Enriches each phase of the generated roadmap with topic-wise Tavily study resources."""
    if not roadmap or not roadmap.phases:
        return roadmap

    max_topics = getattr(config, 'TAVILY_MAX_TOPICS_PER_ROADMAP', 8)
    max_per_cat = getattr(config, 'TAVILY_MAX_RESULTS_PER_CATEGORY', 3)
    searched_count = 0

    for phase in roadmap.phases:
        phase_resources = []
        # Extract meaningful topics for phase
        topics = phase.recommendedTopics or [phase.title]
        
        for topic_name in topics:
            if searched_count >= max_topics:
                break
            
            topic_res = search_topic_study_resources(
                topic=topic_name,
                target_role=target_role,
                phase_number=phase.phaseNumber,
                max_results_per_category=max_per_cat
            )
            phase_resources.extend(topic_res)
            searched_count += 1

        # Preserve phase.resources array with all topic-wise discovered resources
        phase.resources = phase_resources

    return roadmap

def generate_career_roadmap(request: RoadmapRequest) -> RoadmapResponse:
    """
    100% LLM-Powered Career Goal Analysis & Skill-Gap Roadmap Generator.
    Analyzes student background vs target career role, generates a chronological 4-phase learning roadmap,
    and links to matching alumni mentors & Tavily study resources.
    """
    db = load_alumni_database()

    # 1. Retrieve top matching alumni mentors in target role
    student_profile = StudentProfile(
        name=request.studentName,
        bio=request.bio or f"Student aspiring to become {request.targetRole}",
        skills=request.currentSkills,
        targetRole=request.targetRole,
        targetCompanies=[request.targetCompany] if request.targetCompany else []
    )
    search_prompt = f"find me alumni mentors in {request.targetRole} {request.targetCompany}"
    mentor_search_result = search_alumni_with_profile(search_prompt, student_profile, db)
    top_mentors = mentor_search_result.matches[:4]

    roadmap = None
    # 2. Use Gemini LLM to generate structured skill-gap analysis & roadmap phases
    if config.GEMINI_API_KEY:
        roadmap = _call_gemini_roadmap_llm(request, top_mentors)

    if not roadmap:
        # Fallback deterministic roadmap if API key is unconfigured or call failed
        roadmap = _fallback_roadmap(request, top_mentors)

    # 3. Enrich roadmap phases with Tavily study resources
    return _enrich_phases_with_resources(roadmap, request.targetRole)

def _call_gemini_roadmap_llm(request: RoadmapRequest, mentors: List[Any]) -> Optional[RoadmapResponse]:
    prompt = f"""
You are the AI Career Strategist and Roadmap Architect for ConnectEd.

STUDENT PROFILE:
- Student Name: {request.studentName}
- Current Bio: "{request.bio}"
- Current Possessed Skills: {json.dumps(request.currentSkills)}
- TARGET CAREER ROLE: {request.targetRole}
- TARGET COMPANY FOCUS: {request.targetCompany or 'Top Tech Industry'}
- TARGET TIMELINE: {request.timelineWeeks} Weeks

RECOMMENDED ALUMNI MENTORS CONTEXT:
{json.dumps([m.dict() for m in mentors], indent=2)}

INSTRUCTIONS:
1. PERFORM DEEP SKILL-GAP ANALYSIS:
   - Identify possessed skills vs essential skills required to become a successful {request.targetRole}.
   - Identify critical missing skills/technologies.
   - Calculate readinessScore (0 to 100).
   - Write a clear, encouraging analysisSummary.

2. BUILD A CHRONOLOGICAL 4-STAGE LEARNING ROADMAP:
   - Divide the {request.timelineWeeks}-week timeline into 4 logical phases:
     * Phase 1: Core Fundamentals & Prerequisite Tools
     * Phase 2: Core Engineering Stack & Tooling
     * Phase 3: Advanced Architecture & Hands-on Portfolio Projects
     * Phase 4: Interview Preparation, System Design & Portfolio Finalization
   - For each phase, provide:
     * title & duration string (e.g. "Weeks 1-3")
     * description of goals
     * skillsToLearn list
     * keyProjects (practical hands-on portfolio projects to build)
     * recommendedTopics to study

Return ONLY a valid JSON object matching this exact schema format:
{{
  "studentName": "{request.studentName}",
  "targetRole": "{request.targetRole}",
  "targetCompany": "{request.targetCompany}",
  "skillGapAnalysis": {{
    "possessedSkills": ["Skill1", "Skill2"],
    "missingSkills": ["Gap1", "Gap2", "Gap3"],
    "readinessScore": 65,
    "analysisSummary": "Detailed skill gap analysis summary"
  }},
  "phases": [
    {{
      "phaseNumber": 1,
      "title": "Phase 1 Title",
      "duration": "Weeks 1-3",
      "description": "Goals for phase 1",
      "skillsToLearn": ["SkillA", "SkillB"],
      "keyProjects": ["Hands-on project 1"],
      "recommendedTopics": ["Topic 1", "Topic 2"]
    }}
  ],
  "recommendedAlumniMentors": {json.dumps([m.dict() for m in mentors])}
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
                return RoadmapResponse(**parsed_json)
        except Exception:
            pass

    return None

def _fallback_roadmap(request: RoadmapRequest, mentors: List[Any]) -> RoadmapResponse:
    possessed = request.currentSkills
    target = request.targetRole
    
    missing = ["Cloud Deployments", "CI/CD Pipelines", "System Design", "Microservices Security"]
    if "Docker" not in possessed: missing.append("Docker & Containerization")
    if "Kubernetes" not in possessed: missing.append("Kubernetes")

    gap_analysis = SkillGapAnalysis(
        possessedSkills=possessed,
        missingSkills=missing,
        readinessScore=62,
        analysisSummary=f"Solid foundation in {', '.join(possessed)}. To transition to a {target}, focus on containerization, cloud infrastructure, and distributed systems."
    )

    phases = [
        RoadmapPhase(
            phaseNumber=1,
            title="Core Fundamentals & Tooling Prerequisites",
            duration="Weeks 1-3",
            description=f"Strengthen foundation in core technologies and version control.",
            skillsToLearn=possessed + ["Git Workflow", "Linux Administration"],
            keyProjects=["Automated Build & Testing Pipeline"],
            recommendedTopics=["Linux Command Line", "Git Branching Strategies", "REST Principles"]
        ),
        RoadmapPhase(
            phaseNumber=2,
            title=f"Core {target} Tech Stack Mastery",
            duration="Weeks 4-6",
            description=f"Master the core framework and database architecture required for {target}.",
            skillsToLearn=["Docker", "PostgreSQL Optimization", "Microservices Architecture"],
            keyProjects=["Containerized Multi-Service Web Application"],
            recommendedTopics=["Docker Compose", "Database Indexing & Query Tuning", "API Rate Limiting"]
        ),
        RoadmapPhase(
            phaseNumber=3,
            title="Advanced Infrastructure & Hands-On Portfolio Projects",
            duration="Weeks 7-9",
            description=f"Build production-grade projects demonstrating real-world {target} capability.",
            skillsToLearn=["AWS / Cloud Services", "CI/CD Automation", "Monitoring & Logging"],
            keyProjects=[f"Production-Grade {target} Portfolio App with CI/CD & Cloud Hosting"],
            recommendedTopics=["AWS EC2 / S3", "GitHub Actions CI/CD", "Prometheus & Grafana"]
        ),
        RoadmapPhase(
            phaseNumber=4,
            title="System Design, Portfolio Finalization & Interview Readiness",
            duration="Weeks 10-12",
            description="Prepare for technical interview loops, system design interviews, and resume review with alumni mentors.",
            skillsToLearn=["System Design", "Scalability", "Technical Communication"],
            keyProjects=["Interactive Demo Deployment & Open Source Contribution"],
            recommendedTopics=["Distributed Caching with Redis", "Load Balancing", "Mock Technical Interviews"]
        )
    ]

    return RoadmapResponse(
        studentName=request.studentName,
        targetRole=request.targetRole,
        targetCompany=request.targetCompany,
        skillGapAnalysis=gap_analysis,
        phases=phases,
        recommendedAlumniMentors=mentors
    )
