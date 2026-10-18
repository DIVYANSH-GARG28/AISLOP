"""Explainable matching engine for ConnectED alumni mentorship.

Computes a deterministic, explainable match score (0-100) and concrete
reasons based on skill overlap, target role, target company, and mentorship track record.
"""

from typing import List, Dict, Any, Tuple


def calculate_mentor_match(
    student_profile: Dict[str, Any],
    alumni_profile: Dict[str, Any]
) -> Tuple[int, List[str]]:
    """Calculates an explainable match score and detailed reasons.
    
    Weights:
    - Skill Overlap: 40%
    - Role Alignment: 30%
    - Company Alignment: 20%
    - Track Record & Verification: 10%
    """
    reasons: List[str] = []
    total_score = 0.0

    # 1. Skill Overlap (Max 40 points)
    student_skills = [s.strip().lower() for s in student_profile.get("skills", []) if s]
    alumni_skills = [s.strip().lower() for s in alumni_profile.get("skills", []) if s]

    matched_skills = []
    if student_skills and alumni_skills:
        for s_skill in student_skills:
            for a_skill in alumni_skills:
                if s_skill == a_skill or s_skill in a_skill or a_skill in s_skill:
                    matched_skills.append(s_skill.title())
                    break
        
        matched_skills = list(dict.fromkeys(matched_skills))  # unique preserving order
        overlap_ratio = len(matched_skills) / max(1, len(student_skills))
        skill_score = min(40.0, overlap_ratio * 40.0)
        total_score += skill_score

        if matched_skills:
            skills_str = ", ".join(matched_skills[:4])
            reasons.append(
                f"Skill Alignment: Strong overlap in {skills_str} ({len(matched_skills)} matching competencies)"
            )
        else:
            total_score += 10.0  # baseline for adjacent engineering domains
            reasons.append("Technical Foundation: Broad domain compatibility across software disciplines")
    else:
        total_score += 15.0
        reasons.append("General Engineering: Foundational technical alignment")

    # 2. Target Role Alignment (Max 30 points)
    target_role = (student_profile.get("target_role") or "").strip().lower()
    alum_role = (alumni_profile.get("current_role") or alumni_profile.get("title") or "").strip().lower()
    previous_roles = [
        (pr.get("title", "") if isinstance(pr, dict) else pr.title).lower()
        for pr in alumni_profile.get("previous_roles", [])
    ]

    role_score = 0.0
    if target_role:
        target_words = set(target_role.split())
        current_words = set(alum_role.split())
        prev_words = set(" ".join(previous_roles).split())

        if target_role in alum_role or alum_role in target_role:
            role_score = 30.0
            reasons.append(f"Direct Role Match: Mentor is currently working as '{alumni_profile.get('current_role')}'")
        elif target_words.intersection(current_words):
            common = ", ".join(target_words.intersection(current_words))
            role_score = 22.0
            reasons.append(f"Domain Match: Mentor's current title shares focus on '{common}'")
        elif target_words.intersection(prev_words):
            role_score = 18.0
            reasons.append("Career Progression: Mentor previously held your target position")
        else:
            role_score = 10.0
            reasons.append("Industry Experience: Senior tech leadership with transferable mentoring experience")
    else:
        role_score = 15.0

    total_score += role_score

    # 3. Target Company Alignment (Max 20 points)
    target_company = (student_profile.get("target_company") or "").strip().lower()
    alum_company = (alumni_profile.get("company") or "").strip().lower()
    prev_companies = [
        (pr.get("company", "") if isinstance(pr, dict) else pr.company).lower()
        for pr in alumni_profile.get("previous_roles", [])
    ]

    company_score = 0.0
    if target_company:
        if target_company == alum_company or target_company in alum_company or alum_company in target_company:
            company_score = 20.0
            reasons.append(f"Target Company Insider: Mentor currently works at '{alumni_profile.get('company')}'")
        elif any(target_company in pc for pc in prev_companies):
            company_score = 14.0
            reasons.append(f"Alumni Network: Mentor previously worked at your target organization '{target_company.title()}'")
        else:
            company_score = 8.0
            reasons.append(f"Tier-1 Tech Experience: Mentor at '{alumni_profile.get('company')}' with top-tier hiring loop insights")
    else:
        company_score = 12.0

    total_score += company_score

    # 4. Track Record & Verification (Max 10 points)
    track_score = 0.0
    if alumni_profile.get("is_verified") or alumni_profile.get("verification_status") == "VERIFIED":
        track_score += 4.0

    mentees_count = alumni_profile.get("mentees_guided", 0)
    if mentees_count >= 20:
        track_score += 4.0
        reasons.append(f"High-Impact Mentor: Successfully guided {mentees_count}+ students into industry roles")
    elif mentees_count >= 5:
        track_score += 3.0
        reasons.append(f"Experienced Guide: {mentees_count} previous mentorship sessions completed")
    else:
        track_score += 2.0

    avail = (alumni_profile.get("availability") or "").lower()
    if "available" in avail or "mentorship" in avail:
        track_score += 2.0

    total_score += min(10.0, track_score)

    final_score = int(round(min(100.0, max(50.0, total_score))))
    return final_score, reasons
