"""Unit and integration tests for Resume Parser and RAG Chatbot endpoints."""

import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from connected_backend.main import app
from connected_backend.database import db_manager
from connected_backend.seed import seed_database


@pytest_asyncio.fixture(autouse=True)
async def setup_test_db():
    """Initializes and seeds database before each test run."""
    await db_manager.connect()
    await seed_database(force=True)
    yield
    await db_manager.disconnect()


@pytest.mark.asyncio
async def test_resume_parser_json_payload():
    """Verifies that resume text is accurately parsed into skills, targetRole, and graduationYear."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        sample_resume = (
            "Alex Johnson\n"
            "Computer Science & Engineering | Class of 2029\n"
            "Senior AI Engineer candidate with 3 years building PyTorch models, FastAPI services, "
            "PostgreSQL databases, Docker containers, and Distributed Vector Search Engines."
        )

        resp = await client.post(
            "/api/resume/parse-json",
            json={
                "resume_text": sample_resume,
                "filename": "alex_resume.txt",
                "user_id": "student1"
            }
        )

        assert resp.status_code == 200
        data = resp.json()["data"]
        assert "skills" in data
        assert any("Python" in s or "FastAPI" in s or "PyTorch" in s for s in data["skills"])
        assert data["graduationYear"] == 2029
        assert data["targetRole"] == "Senior AI Engineer"
        assert data["readinessScore"] >= 68


@pytest.mark.asyncio
async def test_resume_parser_multipart_text():
    """Verifies multipart file parsing with automatic profile synchronization."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resume_content = b"Candidate graduated in 2030 with skills in React, TypeScript, Node.js, GraphQL, Docker."
        files = {"file": ("my_resume.txt", resume_content, "text/plain")}

        resp = await client.post(
            "/api/resume/parse",
            files=files,
            data={"user_id": "student1"}
        )

        assert resp.status_code == 200
        payload = resp.json()
        assert payload["success"] is True
        assert payload["data"]["graduationYear"] == 2030
        assert "React" in payload["data"]["skills"]
        assert len(payload["data"]["matches"]) > 0


@pytest.mark.asyncio
async def test_resume_rag_chat_interview_questions():
    """Verifies that RAG chat synthesizes tailored interview questions grounded in the resume."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.post(
            "/api/resume/rag-chat",
            json={
                "query": "What technical interview questions will they ask based on my data streaming project?",
                "student_id": "student1",
                "target_role": "Backend Systems Architect",
                "resume_text": "Built real-time data streaming pipeline with Kafka, Redis, and FastAPI handling 50k req/s."
            }
        )

        assert resp.status_code == 200
        body = resp.json()
        assert body["success"] is True
        assert "answer" in body
        assert "Interview" in body["answer"] or "STAR" in body["answer"]


@pytest.mark.asyncio
async def test_resume_rag_chat_ats_gaps():
    """Verifies that RAG chat identifies competency and ATS gaps."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.post(
            "/api/resume/rag-chat",
            json={
                "query": "What are my biggest ATS gaps and missing skills for this role?",
                "student_id": "student1",
                "target_role": "Senior AI Engineer"
            }
        )

        assert resp.status_code == 200
        body = resp.json()
        assert body["success"] is True
        assert "Gap" in body["answer"] or "Critique" in body["answer"]
