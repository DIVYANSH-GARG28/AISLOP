import sys
import os

# Set stdout to utf-8 for Windows console support
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

# Ensure project root is in python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from src.ai.services.alumni_search import search_alumni_by_skills

def run_python_tests():
    test_queries = [
        "I am a Spring Boot student find me alumni similar to my skill",
        "I am learning React and Next.js, show me frontend mentors",
        "Looking for alumni working in AI and PyTorch at Microsoft or similar companies"
    ]

    print("==================================================")
    print("ConnectEd Python AI Engine - Multi-Query Test Suite")
    print("==================================================\n")

    for query in test_queries:
        print(f"[QUERY] \"{query}\"")
        result = search_alumni_by_skills(query)
        
        print(f"   Detected Skills: {', '.join(result.extractedIntent.studentSkills)}")
        print(f"   Target Domain:   {result.extractedIntent.targetDomain}")
        print(f"   Matches Found:   {len(result.matches)}")
        
        for idx, match in enumerate(result.matches):
            print(f"     #{idx + 1}: {match.name} ({match.role} @ {match.company})")
            print(f"        Matched Skills: {', '.join(match.matchedSkills)}")
            print(f"        Reason:         {match.reason}")
        print("--------------------------------------------------\n")

    print("==================================================")
    print("[SUCCESS] All Python AI Engine Queries Executed & Validated with Pydantic!")
    print("==================================================")

if __name__ == "__main__":
    run_python_tests()
