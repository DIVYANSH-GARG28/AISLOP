"""Comprehensive database seeder for connectED platform.

Preloads realistic verified alumni mentors, students, faculty,
skills catalogue, and active mentorship requests.
"""

import time
import logging
from connected_backend.database import db_manager
from connected_backend.models import (
    UserRole,
    VerificationStatus,
    MentorshipStatus
)
from connected_backend.security import hash_password

logger = logging.getLogger("connected.seed")


async def seed_database(force: bool = False):
    """Populates database with initial rich demo dataset if empty or force=True."""
    existing_users = await db_manager.users.count_documents({})
    if existing_users > 0 and not force:
        logger.info(f"Database already contains {existing_users} users. Skipping seed.")
        return

    logger.info("🌱 Seeding connectED database with rich demo dataset...")

    # Clear existing collections if forcing
    if force:
        await db_manager.users.delete_many({})
        await db_manager.students.delete_many({})
        await db_manager.alumni.delete_many({})
        await db_manager.faculty.delete_many({})
        await db_manager.skills.delete_many({})
        await db_manager.mentorship_requests.delete_many({})
        await db_manager.linking_tokens.delete_many({})

    default_pw_hash = hash_password("Password123!")
    now_iso = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())

    # ==========================================
    # 1. Alumni Mentors
    # ==========================================
    alumni_users = [
        {
            "id": "alum_1",
            "email": "priya.sharma@google.com",
            "name": "Priya Sharma",
            "role": UserRole.ALUMNI.value,
            "password_hash": default_pw_hash,
            "avatar_url": "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=250",
            "is_verified": True,
            "created_at": now_iso
        },
        {
            "id": "alumni_002",
            "email": "aravind.n@microsoft.com",
            "name": "Aravind Nair",
            "role": UserRole.ALUMNI.value,
            "password_hash": default_pw_hash,
            "avatar_url": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=250",
            "telegram_user_id": 6160961793,  # Bound to live Telegram chat for instant test cards!
            "telegram_chat_id": 6160961793,
            "telegram_username": "anish12131",
            "is_verified": True,
            "created_at": now_iso
        },
        {
            "id": "alum_2",
            "email": "marcus.v@stripe.com",
            "name": "Marcus Vance",
            "role": UserRole.ALUMNI.value,
            "password_hash": default_pw_hash,
            "avatar_url": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=250",
            "is_verified": True,
            "created_at": now_iso
        },
        {
            "id": "alum_3",
            "email": "elena.r@meta.com",
            "name": "Elena Rostova",
            "role": UserRole.ALUMNI.value,
            "password_hash": default_pw_hash,
            "avatar_url": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250",
            "is_verified": True,
            "created_at": now_iso
        },
        {
            "id": "alum_4",
            "email": "david.kim@vercel.com",
            "name": "David Kim",
            "role": UserRole.ALUMNI.value,
            "password_hash": default_pw_hash,
            "avatar_url": "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=250",
            "is_verified": True,
            "created_at": now_iso
        }
    ]
    await db_manager.users.insert_many(alumni_users)

    alumni_profiles = [
        {
            "id": "alum_1",
            "user_id": "alum_1",
            "name": "Priya Sharma",
            "email": "priya.sharma@google.com",
            "avatar_url": "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=250",
            "current_role": "Senior Software Engineer",
            "company": "Google",
            "location": "Mountain View, CA (Hybrid)",
            "graduation_year": 2019,
            "degree": "B.Tech Computer Science",
            "major": "Computer Science",
            "university": "IIIT",
            "previous_roles": [
                {"title": "Software Engineer II", "company": "Google", "duration": "2020 - 2022"},
                {"title": "Associate SWE", "company": "Amazon", "duration": "2019 - 2020"}
            ],
            "skills": ["System Design", "Python", "Go", "Distributed Systems", "Cloud Infrastructure", "Kubernetes"],
            "verification_status": VerificationStatus.VERIFIED.value,
            "is_verified": True,
            "verified_at": "2024-01-15T10:00:00Z",
            "impact_score": 985,
            "mentees_guided": 34,
            "badge_tier": "#1 Top Mentor 🔥",
            "bio": "Senior SWE at Google building high-throughput distributed systems. Passionate about helping students crack technical coding and system architecture interview loops.",
            "availability": "Available for Mentorship & Referral",
            "is_mentor": True,
            "max_mentees": 5,
            "linkedin_url": "https://linkedin.com/in/priya-sharma-google"
        },
        {
            "id": "alumni_002",
            "user_id": "alumni_002",
            "name": "Aravind Nair",
            "email": "aravind.n@microsoft.com",
            "avatar_url": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=250",
            "current_role": "Principal Cloud Architect",
            "company": "Microsoft",
            "location": "Hyderabad, India / Remote",
            "graduation_year": 2018,
            "degree": "B.Tech Computer Science",
            "major": "Computer Science",
            "university": "IIIT",
            "previous_roles": [
                {"title": "Senior Solutions Architect", "company": "Microsoft", "duration": "2020 - 2023"},
                {"title": "Cloud Engineer", "company": "Oracle", "duration": "2018 - 2020"}
            ],
            "skills": ["Azure", "Cloud Architecture", "Distributed Systems", "Microservices", "Python", "Docker"],
            "verification_status": VerificationStatus.VERIFIED.value,
            "is_verified": True,
            "verified_at": "2023-11-20T14:30:00Z",
            "impact_score": 940,
            "mentees_guided": 28,
            "badge_tier": "Master Mentor ⭐",
            "bio": "Principal Architect at Microsoft specializing in enterprise cloud scalability and fault tolerance. Open to mentoring on architectural designs and job referrals.",
            "availability": "Available for Mentorship & Referral",
            "is_mentor": True,
            "max_mentees": 4,
            "telegram_user_id": 6160961793,
            "telegram_chat_id": 6160961793,
            "linkedin_url": "https://linkedin.com/in/aravind-nair-microsoft"
        },
        {
            "id": "alum_2",
            "user_id": "alum_2",
            "name": "Marcus Vance",
            "email": "marcus.v@stripe.com",
            "avatar_url": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=250",
            "current_role": "Staff Infrastructure Engineer",
            "company": "Stripe",
            "location": "San Francisco, CA / Remote",
            "graduation_year": 2017,
            "degree": "B.Tech Computer Science",
            "major": "Computer Science",
            "university": "IIIT",
            "previous_roles": [
                {"title": "Senior Backend Engineer", "company": "Stripe", "duration": "2019 - 2022"},
                {"title": "Infrastructure Engineer", "company": "Uber", "duration": "2017 - 2019"}
            ],
            "skills": ["Distributed Systems", "PostgreSQL", "Go", "Kafka", "High Availability", "System Design"],
            "verification_status": VerificationStatus.VERIFIED.value,
            "is_verified": True,
            "verified_at": "2023-08-10T09:15:00Z",
            "impact_score": 990,
            "mentees_guided": 42,
            "badge_tier": "#1 Top Mentor 🔥",
            "bio": "Staff Infrastructure Engineer handling financial processing and global consensus. Mentoring candidates on high-scale distributed systems.",
            "availability": "Available for Mentorship",
            "is_mentor": True,
            "max_mentees": 4,
            "linkedin_url": "https://linkedin.com/in/marcus-vance-stripe"
        },
        {
            "id": "alum_3",
            "user_id": "alum_3",
            "name": "Elena Rostova",
            "email": "elena.r@meta.com",
            "avatar_url": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250",
            "current_role": "Senior Data Scientist",
            "company": "Meta",
            "location": "Menlo Park, CA (Hybrid)",
            "graduation_year": 2020,
            "degree": "B.Tech Computer Science & Data",
            "major": "Data Science",
            "university": "IIIT",
            "previous_roles": [
                {"title": "Data Scientist", "company": "Meta", "duration": "2020 - 2023"}
            ],
            "skills": ["Python", "Machine Learning", "A/B Testing", "SQL", "PyTorch", "Causal Inference"],
            "verification_status": VerificationStatus.VERIFIED.value,
            "is_verified": True,
            "verified_at": "2024-03-01T11:00:00Z",
            "impact_score": 910,
            "mentees_guided": 19,
            "badge_tier": "Senior Mentor ⚡",
            "bio": "Senior Data Scientist at Meta focused on product experimentation, recommendation modeling, and statistical causal inference.",
            "availability": "Available for Mentorship & Referral",
            "is_mentor": True,
            "max_mentees": 3,
            "linkedin_url": "https://linkedin.com/in/elena-rostova-meta"
        },
        {
            "id": "alum_4",
            "user_id": "alum_4",
            "name": "David Kim",
            "email": "david.kim@vercel.com",
            "avatar_url": "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=250",
            "current_role": "Product Engineer",
            "company": "Vercel",
            "location": "San Francisco, CA / Remote",
            "graduation_year": 2021,
            "degree": "B.Tech Computer Science",
            "major": "Computer Science",
            "university": "IIIT",
            "previous_roles": [
                {"title": "Frontend Engineer", "company": "HashiCorp", "duration": "2021 - 2023"}
            ],
            "skills": ["React", "Next.js", "TypeScript", "TailwindCSS", "Edge Computing", "UI/UX Design"],
            "verification_status": VerificationStatus.VERIFIED.value,
            "is_verified": True,
            "verified_at": "2024-04-12T16:00:00Z",
            "impact_score": 880,
            "mentees_guided": 15,
            "badge_tier": "Senior Mentor ⚡",
            "bio": "Product Engineer at Vercel optimizing frontend performance and edge computing architectures. Passionate about developer tooling.",
            "availability": "Available for Mentorship",
            "is_mentor": True,
            "max_mentees": 3,
            "linkedin_url": "https://linkedin.com/in/david-kim-vercel"
        }
    ]
    await db_manager.alumni.insert_many(alumni_profiles)

    # ==========================================
    # 2. Students
    # ==========================================
    student_users = [
        {
            "id": "user_101",
            "email": "alex.johnson@kce.edu",
            "name": "Alex Johnson",
            "role": UserRole.STUDENT.value,
            "password_hash": default_pw_hash,
            "avatar_url": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250",
            "is_verified": True,
            "created_at": now_iso
        },
        {
            "id": "student_101",
            "email": "divyansh.g@students.iiit.ac.in",
            "name": "Divyansh Garg",
            "role": UserRole.STUDENT.value,
            "password_hash": default_pw_hash,
            "avatar_url": "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=250",
            "is_verified": True,
            "created_at": now_iso
        }
    ]
    await db_manager.users.insert_many(student_users)

    student_profiles = [
        {
            "id": "user_101",
            "user_id": "user_101",
            "name": "Alex Johnson",
            "email": "alex.johnson@kce.edu",
            "university": "IIIT",
            "degree": "B.Tech Computer Science",
            "major": "Computer Science",
            "graduation_year": 2026,
            "gpa": 3.85,
            "target_role": "Senior AI Engineer",
            "target_company": "Google DeepMind",
            "skills": ["Python", "PyTorch", "React", "JavaScript", "Node.js", "SQL"],
            "bio": "Pre-final year student passionate about foundation models, neural architectures, and distributed training systems.",
            "readiness_score": 64,
            "days_completed": 36,
            "github_url": "https://github.com/alex-johnson",
            "linkedin_url": "https://linkedin.com/in/alex-johnson-cs"
        },
        {
            "id": "student_101",
            "user_id": "student_101",
            "name": "Divyansh Garg",
            "email": "divyansh.g@students.iiit.ac.in",
            "university": "IIIT",
            "degree": "B.Tech Computer Science & Engineering",
            "major": "Computer Science",
            "graduation_year": 2026,
            "gpa": 3.92,
            "target_role": "Senior Software Engineer",
            "target_company": "Google",
            "skills": ["Python", "FastAPI", "React", "System Design", "MongoDB", "Distributed Systems", "Docker"],
            "bio": "Fullstack and distributed systems engineer passionate about AI pipelines, event-driven architectures, and high-performance microservices.",
            "readiness_score": 85,
            "days_completed": 48,
            "github_url": "https://github.com/divyanshgarg",
            "linkedin_url": "https://linkedin.com/in/divyansh-garg"
        }
    ]
    await db_manager.students.insert_many(student_profiles)

    # ==========================================
    # 3. Faculty Profiles
    # ==========================================
    faculty_user = {
        "id": "faculty_1",
        "email": "sarah.chen@kce.edu",
        "name": "Dr. Sarah Chen",
        "role": UserRole.FACULTY.value,
        "password_hash": default_pw_hash,
        "avatar_url": "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=250",
        "is_verified": True,
        "created_at": now_iso
    }
    await db_manager.users.insert_one(faculty_user)

    faculty_profile = {
        "id": "faculty_1",
        "user_id": "faculty_1",
        "name": "Dr. Sarah Chen",
        "email": "sarah.chen@kce.edu",
        "department": "Computer Science & Artificial Intelligence",
        "title": "Head of Alumni Relations & Platform Admin",
        "university": "IIIT",
        "research_interests": ["Deep Learning", "Generative AI", "Distributed Systems Governance", "Career Pathways"],
        "publications_count": 38,
        "office_hours": "Tuesday / Thursday 3:00 PM - 5:00 PM",
        "bio": "Distinguished Professor and Administrator leading the connectED initiative to bridge students with global alumni leaders.",
        "website_url": "https://iiit.ac.in/faculty/sarah-chen"
    }
    await db_manager.faculty.insert_one(faculty_profile)

    # ==========================================
    # 4. Standard Skills Taxonomy
    # ==========================================
    skills_data = [
        {"name": "Python", "category": "Language", "demand_level": "Critical"},
        {"name": "System Design", "category": "Architecture", "demand_level": "Critical"},
        {"name": "Distributed Systems", "category": "Architecture", "demand_level": "Critical"},
        {"name": "FastAPI", "category": "Backend Framework", "demand_level": "High"},
        {"name": "React", "category": "Frontend Framework", "demand_level": "High"},
        {"name": "Node.js", "category": "Backend Runtime", "demand_level": "High"},
        {"name": "Docker", "category": "DevOps", "demand_level": "High"},
        {"name": "Kubernetes", "category": "Cloud Infrastructure", "demand_level": "High"},
        {"name": "PostgreSQL", "category": "Database", "demand_level": "High"},
        {"name": "MongoDB", "category": "Database", "demand_level": "High"},
        {"name": "PyTorch", "category": "AI / ML", "demand_level": "High"},
        {"name": "Machine Learning", "category": "AI / ML", "demand_level": "High"}
    ]
    await db_manager.skills.insert_many(skills_data)

    # ==========================================
    # 5. Active Sample Mentorship Requests
    # ==========================================
    now_ts = time.time()
    sample_requests = [
        {
            "id": "req_seed_001",
            "request_id": "req_seed_001",
            "mentor_id": "alum_1",
            "mentor_user_id": "alum_1",
            "mentor_name": "Priya Sharma",
            "mentor_company": "Google",
            "mentee_id": "student_101",
            "mentee_name": "Divyansh Garg",
            "topic": "System Design & Distributed Ingestion Interview Loop",
            "message": "Hi Priya, I am targeting Senior SWE at Google and would love a mock architecture session on vector retrieval and caching.",
            "skills": ["System Design", "Python", "Distributed Systems"],
            "match_score": 96,
            "match_reasons": [
                "Skill Alignment: Strong overlap in Python, System Design (2 matching competencies)",
                "Direct Role Match: Mentor is currently working as 'Senior Software Engineer'",
                "Target Company Insider: Mentor currently works at 'Google'",
                "High-Impact Mentor: Successfully guided 34+ students into industry roles"
            ],
            "status": MentorshipStatus.ACCEPTED.value,
            "created_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime(now_ts - 7200)),
            "expires_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime(now_ts + (48 * 3600))),
            "expires_at_timestamp": now_ts + (48 * 3600),
            "deadline_hours": 48,
            "responded_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime(now_ts - 3600)),
            "decline_reason": None
        },
        {
            "id": "req_seed_002",
            "request_id": "req_seed_002",
            "mentor_id": "alumni_002",
            "mentor_user_id": "alumni_002",
            "mentor_name": "Aravind Nair",
            "mentor_company": "Microsoft",
            "mentor_telegram_chat_id": 6160961793,
            "mentee_id": "student_101",
            "mentee_name": "Divyansh Garg",
            "topic": "Cloud Microservices & Azure Job Referral",
            "message": "Hi Aravind, I have built event-driven services on Azure and would appreciate guidance on referral evaluation.",
            "skills": ["Cloud Architecture", "Microservices", "Python"],
            "match_score": 93,
            "match_reasons": [
                "Skill Alignment: Strong overlap in Python, Microservices (2 matching competencies)",
                "Tier-1 Tech Experience: Mentor at 'Microsoft' with top-tier hiring loop insights",
                "High-Impact Mentor: Successfully guided 28+ students into industry roles"
            ],
            "status": MentorshipStatus.PENDING.value,
            "created_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime(now_ts)),
            "expires_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime(now_ts + (48 * 3600))),
            "expires_at_timestamp": now_ts + (48 * 3600),
            "deadline_hours": 48,
            "responded_at": None,
            "decline_reason": None
        }
    ]
    await db_manager.mentorship_requests.insert_many(sample_requests)

    logger.info("✅ ConnectED database seeded successfully with realistic demo dataset.")
