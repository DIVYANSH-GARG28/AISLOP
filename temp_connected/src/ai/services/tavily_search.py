import re
import uuid
import logging
import urllib.parse
import requests
from typing import List, Dict, Any, Optional

from src.ai.config import config
from src.ai.schemas.roadmap_schemas import StudyResource

logger = logging.getLogger("connected_tavily")

CTA_MAP = {
    "Documentation": "Read Docs",
    "Video": "Watch Video",
    "Tutorial": "Learn Tutorial",
    "Course": "View Course",
    "Practice": "Practice Problems",
    "Project": "View Project"
}

def sanitize_text(text: Optional[str]) -> str:
    """Strips HTML tags and extra whitespace from title or snippet."""
    if not text:
        return ""
    clean = re.sub(r'<[^>]+>', '', text)
    return " ".join(clean.split())

def validate_url(url: Optional[str]) -> Optional[str]:
    """Validates that URL has http or https protocol."""
    if not url or not isinstance(url, str):
        return None
    url = url.strip()
    if url.startswith("http://") or url.startswith("https://"):
        return url
    return None

def extract_domain(url: str) -> str:
    """Extracts clean hostname domain from URL."""
    try:
        parsed = urllib.parse.urlparse(url)
        domain = parsed.netloc or parsed.path
        if domain.startswith("www."):
            domain = domain[4:]
        return domain
    except Exception:
        return "web"

def classify_category(url: str, title: str, content: str) -> str:
    """
    Enhanced rule-based category classifier supporting:
    Documentation, Video, Tutorial, Course, Practice, Project
    """
    lower_url = url.lower()
    lower_title = title.lower()

    if any(k in lower_url for k in ["youtube.com", "youtu.be", "vimeo.com"]):
        return "Video"
    if any(k in lower_url for k in ["leetcode.com", "hackerrank.com", "codewars.com", "exercism.org", "codingninjas.com", "geeksforgeeks.org", "interviewbit.com"]):
        return "Practice"
    if any(k in lower_url for k in ["github.com", "gitlab.com", "bitbucket.org"]):
        return "Project" if ("/tree/" in lower_url or "/blob/" in lower_url or "sample" in lower_title or "awesome" in lower_title or "project" in lower_title) else "Practice"
    if any(k in lower_url for k in ["coursera.org", "udemy.com", "edx.org", "pluralsight.com", "udacity.com", "fast.ai", "khanacademy.org"]):
        return "Course"
    if any(k in lower_url for k in [
        "developer.mozilla.org", "docs.python.org", "docs.oracle.com", "react.dev", 
        "nodejs.org", "postgresql.org", "docker.com", "kubernetes.io", "spring.io", 
        "expressjs.com", "prisma.io", "learn.microsoft.com", "docs."
    ]):
        return "Documentation"
    
    if any(k in lower_title for k in ["documentation", "official docs", "api reference", "manual"]):
        return "Documentation"
    if any(k in lower_title for k in ["video", "watch", "youtube", "lecture"]):
        return "Video"
    if any(k in lower_title for k in ["course", "specialization", "certification"]):
        return "Course"
    if any(k in lower_title for k in ["practice", "exercise", "problems", "challenges", "quiz"]):
        return "Practice"
    if any(k in lower_title for k in ["github repo", "source code", "open source project"]):
        return "Project"

    return "Tutorial"

def search_topic_study_resources(
    topic: str, 
    target_role: str = "", 
    phase_number: Optional[int] = None, 
    max_results_per_category: int = 3
) -> List[StudyResource]:
    """
    Performs server-side Tavily resource discovery for a specific roadmap topic.
    Categorizes results into Documentation, Video, Tutorial, Course, Practice, and Project.
    """
    api_key = config.TAVILY_API_KEY.strip()
    if not api_key or api_key == "your_tavily_api_key_here":
        logger.info("TAVILY_API_KEY is missing or unconfigured. Returning empty resources fallback.")
        return []

    clean_topic = sanitize_text(topic)
    clean_role = sanitize_text(target_role)
    if not clean_topic:
        return []

    timeout_sec = getattr(config, 'TAVILY_TIMEOUT_SECONDS', 5)
    headers = {"Content-Type": "application/json"}
    resources: List[StudyResource] = []
    seen_urls = set()

    # Define primary query and targeted category query
    queries = [
        f"{clean_role} {clean_topic} tutorial documentation course video github practice".strip(),
        f"{clean_topic} official documentation YouTube course GitHub".strip()
    ]

    for query_str in queries:
        payload = {
            "api_key": api_key,
            "query": query_str,
            "search_depth": "basic",
            "topic": "general",
            "max_results": 10,
            "include_answer": False,
            "include_raw_content": False
        }

        try:
            res = requests.post("https://api.tavily.com/search", json=payload, headers=headers, timeout=timeout_sec)
            if res.status_code != 200:
                logger.warning(f"Tavily API error HTTP {res.status_code} for topic '{clean_topic}'")
                continue

            raw_results = res.json().get("results", [])
            if not isinstance(raw_results, list):
                continue

            for item in raw_results:
                raw_url = item.get("url")
                valid_url = validate_url(raw_url)
                if not valid_url or valid_url in seen_urls:
                    continue

                seen_urls.add(valid_url)
                title = sanitize_text(item.get("title")) or "Study Resource"
                snippet = sanitize_text(item.get("content"))
                if len(snippet) > 200:
                    snippet = snippet[:197] + "..."

                domain = extract_domain(valid_url)
                category = classify_category(valid_url, title, snippet)
                score = float(item.get("score") or 0.85)
                cta = CTA_MAP.get(category, "Learn Tutorial")

                resource_obj = StudyResource(
                    id=f"res_{uuid.uuid4().hex[:8]}",
                    title=title,
                    url=valid_url,
                    category=category,
                    source=domain,
                    snippet=snippet,
                    score=score,
                    topic=clean_topic,
                    phaseNumber=phase_number,
                    ctaText=cta
                )
                resources.append(resource_obj)

        except Exception as err:
            logger.error(f"Tavily search exception for topic '{clean_topic}': {err}")

    # Deduplicate & cap per category
    category_counts: Dict[str, int] = {}
    filtered_resources: List[StudyResource] = []

    # Sort by relevance score descending
    resources.sort(key=lambda r: r.score or 0.0, reverse=True)

    for r in resources:
        count = category_counts.get(r.category, 0)
        if count < max_results_per_category:
            category_counts[r.category] = count + 1
            filtered_resources.append(r)

    return filtered_resources

def search_tavily_resources(topic: str, target_role: str = "", max_results: int = 3) -> List[StudyResource]:
    """Backward compatible wrapper function for phase-level or quick topic searches."""
    return search_topic_study_resources(topic, target_role, max_results_per_category=max_results)
