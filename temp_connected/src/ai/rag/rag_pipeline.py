import json
import time
import requests
from typing import List, Dict, Any, Optional
from src.ai.config import config
from src.ai.rag.vector_store import PythonVectorStore
from src.ai.schemas.alumni_schemas import AlumniSearchResult, AlumniMatch, ExtractedIntent

class PythonRAGPipeline:
    def __init__(self):
        self.vector_store = PythonVectorStore()

    def execute_rag_search(
        self, 
        user_query: str, 
        student_profile_skills: List[str],
        db: List[Dict[str, Any]], 
        top_k: int = 5
    ) -> AlumniSearchResult:
        start_time = time.time()
        
        if not self.vector_store.is_indexed or len(self.vector_store.documents) != len(db):
            self.vector_store.index_documents(db)

        combined_query = f"{user_query} {' '.join(student_profile_skills)}"
        retrieved_results = self.vector_store.search(combined_query, top_k=top_k)

        if not retrieved_results:
            return AlumniSearchResult(
                query=user_query,
                extractedIntent=ExtractedIntent(studentSkills=student_profile_skills, targetDomain="General", targetCompanies=[]),
                matches=[]
            )

        top_candidates = [r["document"] for r in retrieved_results]

        # Call Gemini or Ollama if configured
        if config.GEMINI_API_KEY:
            llm_res = self._call_gemini_rag(user_query, student_profile_skills, top_candidates)
            if llm_res and len(llm_res.matches) > 0:
                return llm_res

        # High-Speed Vector Fallback
        matches = []
        for r in retrieved_results:
            doc = r["document"]
            matched_skills = r["matchedTerms"] if r["matchedTerms"] else doc.get("skills", ["Engineering"])[:3]
            matches.append(
                AlumniMatch(
                    alumniId=str(doc.get("id", "")),
                    name=doc.get("name", "Alumnus"),
                    role=doc.get("role") or doc.get("title") or "Engineer",
                    company=doc.get("company", ""),
                    matchedSkills=matched_skills,
                    matchScore=r["matchScore"],
                    matchPercentage=f"{r['matchScore']}%",
                    isSimilarRecommendation=False,
                    reason=f"Vector RAG matched similarity ({int(r['similarity']*100)}%) with background as {doc.get('role')} at {doc.get('company')}."
                )
            )

        return AlumniSearchResult(
            query=user_query,
            extractedIntent=ExtractedIntent(studentSkills=student_profile_skills, targetDomain="Software Engineering", targetCompanies=[]),
            matches=matches
        )

    def _call_gemini_rag(
        self, 
        user_query: str, 
        skills: List[str], 
        top_candidates: List[Dict[str, Any]]
    ) -> Optional[AlumniSearchResult]:
        prompt = f"""
You are the RAG Alumni Matcher for ConnectEd.
Student Query / Skills: "{user_query}" {json.dumps(skills)}

Retrieved Candidates ({len(top_candidates)} items):
{json.dumps([{
  "id": c.get("id"),
  "name": c.get("name"),
  "role": c.get("role") or c.get("title"),
  "company": c.get("company"),
  "skills": c.get("skills"),
  "bio": c.get("bio")
} for c in top_candidates], indent=2)}

INSTRUCTIONS:
Select top matching alumni and provide clear explanations.
Return ONLY valid JSON matching this schema:
{{
  "query": "{user_query}",
  "extractedIntent": {{
    "studentSkills": {json.dumps(skills)},
    "targetDomain": "Domain Name",
    "targetCompanies": []
  }},
  "matches": [
    {{
      "alumniId": "alum-id",
      "name": "Name",
      "role": "Role",
      "company": "Company",
      "matchedSkills": ["skill"],
      "matchScore": 92,
      "matchPercentage": "92%",
      "isSimilarRecommendation": false,
      "reason": "Human explanation"
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
                res = requests.post(url, json=payload, timeout=20)
                if res.status_code == 200:
                    data = res.json()
                    text = data["candidates"][0]["content"]["parts"][0]["text"]
                    parsed = json.loads(text)
                    return AlumniSearchResult(**parsed)
            except Exception:
                pass
        return None

global_rag_pipeline = PythonRAGPipeline()
