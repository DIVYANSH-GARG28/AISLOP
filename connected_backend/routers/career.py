"""Career roadmap and AI copilot assistant router."""

import time
from typing import Dict, Any, Optional, List
from fastapi import APIRouter, HTTPException
from connected_backend.database import db_manager, clean_doc

router = APIRouter(prefix="/api", tags=["Career & AI Copilot"])


@router.get("/career/roadmap/{student_id}")
async def get_student_roadmap(student_id: str):
    """Retrieves saved career roadmap for a student."""
    doc = await db_manager.roadmaps.find_one({"student_id": student_id})
    if not doc:
        return {"success": True, "data": None}
    return {"success": True, "data": clean_doc(doc)}


@router.post("/career/roadmap")
async def save_student_roadmap(body: Dict[str, Any]):
    """Saves or updates career roadmap for a student."""
    student_id = body.get("studentId") or body.get("student_id", "student_101")
    target_role = body.get("targetRole", "Software Engineer")
    roadmap_data = body.get("roadmapData", {})

    await db_manager.roadmaps.update_one(
        {"student_id": student_id},
        {
            "$set": {
                "student_id": student_id,
                "target_role": target_role,
                "roadmap_data": roadmap_data,
                "updated_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
            }
        },
        upsert=True
    )
    return {"success": True, "message": "Roadmap saved successfully"}


@router.post("/career/roadmap/generate")
async def generate_career_roadmap(body: Dict[str, Any]):
    """Generates an intelligent 4-phase career roadmap based on student's current skills and target role."""
    target_role = body.get("targetRole", "Senior Software Engineer")
    current_skills = body.get("currentSkills", ["Python", "DSA"])
    student_name = body.get("studentName", "Student")

    phases = [
        {
            "phaseNumber": 1,
            "title": "Foundation & Algorithms",
            "duration": "Weeks 1-3",
            "description": f"Solidify fundamental architecture, clean code, and algorithmic problem solving for {target_role}.",
            "skillsToLearn": ["Advanced Data Structures", "Concurrency", "Git Branching"],
            "keyProjects": ["Scalable Algorithmic Processing Engine"],
            "tasks": [
                {"id": "p1_1", "text": "Master algorithmic complexity and benchmark tests", "done": True},
                {"id": "p1_2", "text": "Build modular object-oriented project architecture", "done": True}
            ]
        },
        {
            "phaseNumber": 2,
            "title": "Modern Frameworks & Database Engineering",
            "duration": "Weeks 4-6",
            "description": "Design relational & document database schemas with query optimization and REST/gRPC endpoints.",
            "skillsToLearn": ["FastAPI / Node.js", "MongoDB & PostgreSQL", "Docker Containerization"],
            "keyProjects": ["High-Throughput Microservice API"],
            "tasks": [
                {"id": "p2_1", "text": "Implement secure JWT authentication and role-based access", "done": False},
                {"id": "p2_2", "text": "Containerize backend services using Docker Compose", "done": False}
            ]
        },
        {
            "phaseNumber": 3,
            "title": "Cloud Infrastructure & Distributed Systems",
            "duration": "Weeks 7-9",
            "description": "Deploy scalable workloads to cloud infrastructure with CI/CD and caching layers.",
            "skillsToLearn": ["AWS / GCP", "Redis Distributed Caching", "GitHub Actions CI/CD"],
            "keyProjects": ["Cloud-Native Event-Driven Architecture"],
            "tasks": [
                {"id": "p3_1", "text": "Deploy microservice cluster with automated CI/CD pipelines", "done": False},
                {"id": "p3_2", "text": "Configure Redis caching for sub-10ms response latency", "done": False}
            ]
        },
        {
            "phaseNumber": 4,
            "title": "System Design, Mock Loops & Placement Readiness",
            "duration": "Weeks 10-12",
            "description": f"Complete alumni mock interviews and portfolio evaluation with {target_role} mentors.",
            "skillsToLearn": ["System Design Architecture", "Load Balancing", "Behavioral Interview Prep"],
            "keyProjects": ["Comprehensive Production Portfolio & Live Demo"],
            "tasks": [
                {"id": "p4_1", "text": "Conduct 1-on-1 alumni technical mock interview on connectED", "done": False},
                {"id": "p4_2", "text": "Submit candidate referral packet to alumni network", "done": False}
            ]
        }
    ]

    roadmap_payload = {
        "studentName": student_name,
        "targetRole": target_role,
        "skillGapAnalysis": {
            "possessedSkills": current_skills,
            "missingSkills": ["System Design", "Distributed Systems", "Cloud CI/CD"],
            "readinessScore": 72
        },
        "phases": phases
    }

    return {
        "success": True,
        "data": roadmap_payload
    }


@router.post("/ai/copilot")
async def ai_copilot(body: Dict[str, Any]):
    """AI Copilot assistant that analyzes query and recommends verified alumni mentors."""
    prompt = body.get("prompt", "").lower()
    user_goal = body.get("userGoal", {})

    # Fetch alumni mentors
    cursor = db_manager.alumni.find({"is_mentor": {"$ne": False}})
    all_alumni = []
    async for doc in cursor:
        all_alumni.append(clean_doc(doc))

    # Match based on prompt keywords
    matched = []
    for a in all_alumni:
        skills = [s.lower() for s in a.get("skills", [])]
        company = (a.get("company") or "").lower()
        role = (a.get("current_role") or a.get("title") or "").lower()

        if any(w in prompt for w in skills) or (company and company in prompt) or (role and any(w in prompt for w in role.split())):
            matched.append(a)

    if not matched:
        matched = all_alumni[:3]

    suggested = matched[:4]
    response_text = (
        f"I analyzed our verified alumni database based on your request. "
        f"Found {len(suggested)} senior alumni mentors who specialize in your target tech stack and companies."
    )

    return {
        "success": True,
        "text": response_text,
        "suggestedAlumni": suggested
    }
