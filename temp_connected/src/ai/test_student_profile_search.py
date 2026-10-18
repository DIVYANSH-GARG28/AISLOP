import sys
import os

# Set stdout to UTF-8 for Windows console
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

# Ensure project root is in python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from src.ai.schemas.alumni_schemas import StudentProfile
from src.ai.services.alumni_search import search_alumni_with_profile

# ==============================================================================
# 🛠️ EDIT YOUR STUDENT PROFILE & PROMPT HERE TO TEST YOUR OWN QUERIES
# ==============================================================================

STUDENT_PROFILE = StudentProfile(
    name="Sidharth (@sidharth756)",
    bio="Full Stack Software & AI Engineer specializing in Node.js, Python, React, FastAPI, and Generative AI agents.",
    skills=["Python", "React", "Node.js", "FastAPI", "Generative AI"],
    targetRole="AI Engineer",
    targetCompanies=["Google", "Microsoft", "OpenAI"]
)

PROMPT = "find me AI engineers and mentors like @sidharth756"

# ==============================================================================

def run_my_test():
    print("==================================================================")
    print(" ConnectEd AI Engine - Search Test for @sidharth756")
    print("==================================================================")
    print("\n--- 👤 STUDENT PROFILE ---")
    print(f"  Name:             {STUDENT_PROFILE.name}")
    print(f"  Bio:              {STUDENT_PROFILE.bio}")
    print(f"  Profile Skills:   {', '.join(STUDENT_PROFILE.skills)}")
    print(f"  Target Role:      {STUDENT_PROFILE.targetRole}")
    
    print(f"\n--- 💬 SEARCH PROMPT ---\n  \"{PROMPT}\"")

    print("\nSearching via Gemini LLM...")
    result = search_alumni_with_profile(PROMPT, STUDENT_PROFILE)
    
    print("\n==================================================================")
    print(" 🎯 MATCH RESULTS")
    print("==================================================================")
    print(f"Active Skills Filter: {', '.join(result.extractedIntent.studentSkills) if result.extractedIntent.studentSkills else 'None'}")
    print(f"Target Domain:        {result.extractedIntent.targetDomain}")
    print(f"Detected Companies:   {', '.join(result.extractedIntent.targetCompanies) if result.extractedIntent.targetCompanies else 'None'}")
    print(f"Total Matches Found:  {len(result.matches)}\n")

    for idx, match in enumerate(result.matches[:6]):
        tag = "[SIMILAR RECOMMENDATION]" if match.isSimilarRecommendation else f"[{match.matchPercentage} MATCH]"
        print(f"  #{idx + 1}: {match.name} {tag}")
        print(f"      Role & Company: {match.role} @ {match.company}")
        print(f"      Matched Skills: {', '.join(match.matchedSkills) if match.matchedSkills else 'Domain Match'}")
        print(f"      Match Reason:   {match.reason}")
        print("  " + "-" * 60)

    print("\n[SUCCESS] Test Completed!")

if __name__ == "__main__":
    run_my_test()
