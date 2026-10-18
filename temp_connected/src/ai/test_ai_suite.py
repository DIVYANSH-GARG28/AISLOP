import json
from src.ai.schemas.alumni_schemas import SearchRequest, StudentProfileSearchRequest, StudentProfile
from src.ai.schemas.roadmap_schemas import RoadmapRequest
from src.ai.schemas.profile_schemas import ProfileTextParseRequest
from src.ai.services.alumni_search import search_alumni_by_skills, search_alumni_with_profile
from src.ai.services.career_roadmap import generate_career_roadmap
from src.ai.services.profile_parser import parse_profile_text

def run_tests():
    print("\n=======================================================")
    print(" CONNECTED AI ENGINE: FULL FEATURE INTEGRATION TEST ")
    print("=======================================================\n")

    # TEST 1: Semantic Alumni Search
    print("--- [TEST 1] SEMANTIC ALUMNI SEARCH ---")
    query = "DevOps engineers with Kubernetes and AWS experience"
    print(f"Query: '{query}'")
    search_res = search_alumni_by_skills(query)
    print(f"Total Matches Found: {len(search_res.matches)}")
    for idx, match in enumerate(search_res.matches[:3], 1):
        print(f"  {idx}. {match.name} ({match.company}) - Match: {match.matchPercentage}")
        print(f"     Reason: {match.reason}")

    # TEST 2: Student Profile-Aware Mentorship Search
    print("\n--- [TEST 2] STUDENT PROFILE-AWARE MENTORSHIP MATCH ---")
    student = StudentProfile(
        name="Sidharth",
        bio="Final year Computer Science student passionate about Cloud Native and DevOps",
        skills=["Python", "Linux", "Git", "Docker"],
        targetRole="DevOps Engineer",
        targetCompanies=["Google", "Flipkart"]
    )
    student_search_res = search_alumni_with_profile("looking for senior DevOps mentor in India", student)
    print(f"Student: {student.name} (Target: {student.targetRole})")
    print(f"Total Matches Found: {len(student_search_res.matches)}")
    for idx, match in enumerate(student_search_res.matches[:3], 1):
        print(f"  {idx}. {match.name} ({match.role} at {match.company}) - Score: {match.matchScore}")
        print(f"     Reason: {match.reason}")

    # TEST 3: AI Profile & Resume Parser
    print("\n--- [TEST 3] AI PROFILE / BIO PARSER ---")
    raw_bio = """
    Sidharth is a Senior Full-Stack Cloud Engineer based in Bengaluru. 
    He has 4 years of experience working with Python, FastAPI, React, Docker, Kubernetes, and AWS.
    Educated at IIT Madras with B.Tech in Computer Science. Interested in mentoring junior developers in DevOps and AI systems.
    Contact: sidharth@connected.edu
    """
    parse_res = parse_profile_text(ProfileTextParseRequest(rawText=raw_bio))
    print(f"Parser Success: {parse_res.success}")
    prof = parse_res.profile
    print(f"Extracted Name: {prof.name}")
    print(f"Headline: {prof.headline}")
    print(f"Skills Extracted: {prof.skills}")
    print(f"Education Extracted: {prof.education}")

    # TEST 4: Career Goal Analysis & Skill-Gap Roadmap Generator
    print("\n--- [TEST 4] AI CAREER GOAL ANALYSIS & ROADMAP GENERATOR ---")
    roadmap_req = RoadmapRequest(
        studentName="Sidharth",
        bio="Final year student aspiring to be a Site Reliability & DevOps Engineer",
        currentSkills=["Python", "Linux", "SQL", "Git"],
        targetRole="DevOps Engineer",
        targetCompany="Atlassian",
        timelineWeeks=12
    )
    roadmap = generate_career_roadmap(roadmap_req)
    print(f"Student: {roadmap.studentName} | Target: {roadmap.targetRole} @ {roadmap.targetCompany}")
    print(f"Readiness Score: {roadmap.skillGapAnalysis.readinessScore}/100")
    print(f"Missing Skills: {roadmap.skillGapAnalysis.missingSkills}")
    print(f"Analysis Summary: {roadmap.skillGapAnalysis.analysisSummary}")
    print(f"\nPhases Generated ({len(roadmap.phases)}):")
    for phase in roadmap.phases:
        print(f"  Phase {phase.phaseNumber}: {phase.title} ({phase.duration})")
        print(f"     Skills to learn: {phase.skillsToLearn}")
        print(f"     Key Projects: {phase.keyProjects}")
        print(f"     Discovered Resources ({len(phase.resources)}):")
        for res in phase.resources:
            safe_title = res.title.encode('ascii', 'ignore').decode('ascii')
            print(f"       - [{res.category}] {safe_title} ({res.source}) -> {res.url[:45]}...")

    print(f"\nRecommended Alumni Mentors Linked ({len(roadmap.recommendedAlumniMentors)}):")
    for m in roadmap.recommendedAlumniMentors:
        print(f"  [Mentor] {m.name} ({m.role} at {m.company}) - Match: {m.matchPercentage}")

    # TEST 5: Resume-Based Alumni & Mentor Matching
    print("\n--- [TEST 5] RESUME-BASED ALUMNI & MENTOR MATCHING ---")
    from src.ai.services.profile_parser import match_alumni_from_resume_text
    resume_text = """
    Sidharth - Senior Full Stack Engineer
    Bengaluru, India | sidharth@connected.edu
    Summary: 4+ years of software engineering experience specializing in Python, FastAPI, React, Docker, Kubernetes, AWS, and Cloud Architecture.
    Education: B.Tech Computer Science from IIT Madras
    Skills: Python, FastAPI, React, JavaScript, AWS, Docker, Kubernetes, SQL, Microservices
    Experience: 
    - Lead Developer at Tech Startup: Built containerized microservices and automated deployment pipelines.
    """
    resume_match = match_alumni_from_resume_text(ProfileTextParseRequest(rawText=resume_text))
    print(f"Resume Matcher Success: {resume_match.success}")
    print(f"Extracted Profile Name: {resume_match.extractedProfile.name} ({resume_match.extractedProfile.headline})")
    print(f"Extracted Skills: {resume_match.extractedProfile.skills}")
    print(f"Total Alumni Mentors Matched: {len(resume_match.matchedAlumni)}")
    for idx, match in enumerate(resume_match.matchedAlumni[:3], 1):
        print(f"  {idx}. {match.name} ({match.role} at {match.company}) - Match: {match.matchPercentage}")
        print(f"     Reason: {match.reason}")

    # TEST 6: Standalone Tavily Study Resource Search
    print("\n--- [TEST 6] STANDALONE TAVILY STUDY RESOURCE SEARCH ---")
    from src.ai.services.tavily_search import search_tavily_resources, classify_category
    topic_resources = search_tavily_resources("Database Indexing & Query Optimization", "Backend Engineer", 3)
    print(f"Found {len(topic_resources)} Tavily study resources for 'Database Indexing':")
    for idx, res in enumerate(topic_resources, 1):
        safe_title = res.title.encode('ascii', 'ignore').decode('ascii')
        safe_snippet = res.snippet.encode('ascii', 'ignore').decode('ascii')
        print(f"  {idx}. [{res.category}] {safe_title} ({res.source})")
        print(f"     URL: {res.url}")
        print(f"     Snippet: {safe_snippet[:90]}...")

    # TEST A: Tavily Key Configuration Check
    print("\n--- [TEST A] TAVILY KEY CONFIGURATION CHECK ---")
    from src.ai.config import config
    is_tavily_set = bool(config.TAVILY_API_KEY and config.TAVILY_API_KEY.strip() != "your_tavily_api_key_here")
    print(f"TAVILY_API_KEY Configured: {'PASS' if is_tavily_set else 'FAIL'}")
    assert is_tavily_set, "TAVILY_API_KEY must be configured in environment"

    # TEST B & C: Resource Categories Coverage Test
    print("\n--- [TEST B & C] RESOURCE CATEGORY CLASSIFICATION & DISCOVERY ---")
    sample_urls = [
        ("https://docs.python.org/3/", "Python Documentation", "Documentation"),
        ("https://www.youtube.com/watch?v=12345", "Asyncio Tutorial Video", "Video"),
        ("https://realpython.com/async-io-python/", "Real Python Guide", "Tutorial"),
        ("https://www.coursera.org/learn/python", "Python Deep Dive Course", "Course"),
        ("https://leetcode.com/problems/two-sum/", "LeetCode Practice Problems", "Practice"),
        ("https://github.com/torvalds/linux", "Linux Source Code Project", "Project")
    ]
    for url, title, expected_cat in sample_urls:
        cat = classify_category(url, title, "")
        print(f"  Category classification for '{title}' -> {cat} (Expected: {expected_cat})")
        assert cat == expected_cat, f"Expected {expected_cat} for {url}, got {cat}"

    # TEST D: Endpoint Data Structure Verification
    print("\n--- [TEST D] /api/ai/search-resources ENDPOINT SCHEMA ---")
    from src.ai.schemas.roadmap_schemas import TopicResourceSearchRequest
    from src.ai.main import api_search_tavily_resources
    ep_request = TopicResourceSearchRequest(topic="Python", targetRole="Senior AI Engineer", maxResults=2)
    ep_resources = api_search_tavily_resources(ep_request)
    print(f"Endpoint returned {len(ep_resources)} resources:")
    for r in ep_resources[:2]:
        print(f"  - [{r.category}] {r.title} | CTA: {r.ctaText} | URL: {r.url[:40]}...")
        assert r.url.startswith("http"), "Resource URL must be HTTP/HTTPS"
        assert r.category in ["Documentation", "Video", "Tutorial", "Course", "Practice", "Project"], "Invalid category"

    # TEST E: Cached Roadmap Auto-Enrichment Verification
    print("\n--- [TEST E] CACHED ROADMAP ENRICHMENT VERIFICATION ---")
    from src.ai.services.career_roadmap import _enrich_phases_with_resources
    from src.ai.schemas.roadmap_schemas import RoadmapResponse, RoadmapPhase, SkillGapAnalysis
    old_roadmap = RoadmapResponse(
        studentName="TestStudent",
        targetRole="Senior AI Engineer",
        targetCompany="Google",
        skillGapAnalysis=SkillGapAnalysis(possessedSkills=["Python"], missingSkills=["System Design"], readinessScore=60, analysisSummary="Good foundation"),
        phases=[
            RoadmapPhase(phaseNumber=1, title="Core Python", duration="Weeks 1-3", description="Learn Python", skillsToLearn=["Python"], keyProjects=["Queue Engine"], recommendedTopics=["Event Loop Internals"], resources=[])
        ],
        recommendedAlumniMentors=[]
    )
    assert len(old_roadmap.phases[0].resources) == 0, "Old roadmap should initially have empty resources"
    enriched = _enrich_phases_with_resources(old_roadmap, "Senior AI Engineer")
    print(f"Enriched old roadmap phase 1 resources count: {len(enriched.phases[0].resources)}")
    assert len(enriched.phases[0].resources) > 0, "Enriched roadmap should have non-empty study resources"

    # TEST F: Graceful Failure Simulation Test
    print("\n--- [TEST F] TAVILY UNCONFIGURED / FAILURE GRACEFUL DEGRADATION ---")
    orig_key = config.TAVILY_API_KEY
    config.TAVILY_API_KEY = ""
    fallback_res = search_tavily_resources("Python", "Senior AI Engineer", 3)
    print(f"Fallback response when key empty: {len(fallback_res)} resources returned (no crash)")
    assert fallback_res == [], "Should return empty list gracefully when Tavily unconfigured"
    config.TAVILY_API_KEY = orig_key

    print("\n=======================================================")
    print(" SUCCESS: ALL CONNECTED AI ENGINE TESTS PASSED!")
    print("=======================================================\n")

if __name__ == "__main__":
    run_tests()

