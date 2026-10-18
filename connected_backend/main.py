"""ConnectED authoritative FastAPI backend application.

Provides clean REST endpoints for authentication, student/alumni/faculty profiles,
explainable mentor recommendations, 48h SLA mentorship workflows, and Telegram bot integration.
"""

import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from connected_backend.config import settings
from connected_backend.database import db_manager
from connected_backend.seed import seed_database
from connected_backend.routers import (
    auth,
    profiles,
    mentorship,
    telegram,
    career,
    institute,
    resume
)

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("connected.main")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initializes database connection and seeds demo dataset on startup."""
    logger.info(f"🚀 Initializing {settings.PROJECT_NAME} v{settings.VERSION}...")
    await db_manager.connect()
    await seed_database(force=False)
    yield
    logger.info("🛑 Shutting down backend service...")
    await db_manager.disconnect()


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="ConnectED authoritative backend with MongoDB, explainable mentor recommendations, and Telegram/n8n automation.",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)

# Enable CORS for frontend Vite development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Routers
app.include_router(auth.router)
app.include_router(profiles.router)
app.include_router(mentorship.router)
app.include_router(telegram.router)
app.include_router(career.router)
app.include_router(institute.router)
app.include_router(resume.router)


@app.get("/", tags=["Health"])
async def root():
    return {
        "status": "online",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "database_mode": "mock_memory" if db_manager.is_mock else "mongodb_live",
        "docs_url": "/docs"
    }


@app.get("/api/health", tags=["Health"])
async def health_check():
    return {
        "status": "healthy",
        "database": "connected" if db_manager.client else "disconnected",
        "database_type": "in-memory-mongomock" if db_manager.is_mock else "live-mongodb",
        "n8n_webhook": settings.N8N_WEBHOOK_URL,
        "bot_configured": bool(settings.TELEGRAM_BOT_TOKEN)
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "connected_backend.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG
    )
