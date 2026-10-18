import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    TAVILY_API_KEY: str = os.getenv("TAVILY_API_KEY", "")
    TAVILY_MAX_RESULTS_PER_CATEGORY: int = int(os.getenv("TAVILY_MAX_RESULTS_PER_CATEGORY", 4))
    TAVILY_MAX_TOPICS_PER_ROADMAP: int = int(os.getenv("TAVILY_MAX_TOPICS_PER_ROADMAP", 8))
    TAVILY_TIMEOUT_SECONDS: int = int(os.getenv("TAVILY_TIMEOUT_SECONDS", 5))
    GEMINI_MODELS: list = [
        "gemini-3.1-flash-lite",
        "gemini-3.6-flash",
        "gemini-flash-latest"
    ]
    PORT: int = int(os.getenv("AI_PORT", 8000))
    HOST: str = os.getenv("AI_HOST", "0.0.0.0")

config = Config()
