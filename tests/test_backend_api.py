"""Automated integration tests for connectED FastAPI backend with MongoDB."""

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
async def test_health_check():
    """Verifies backend health and status reporting."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.get("/api/health")
        assert res.status_code == 200
        data = res.json()
        assert data["status"] == "healthy"
        assert "database" in data


@pytest.mark.asyncio
async def test_auth_registration_and_login():
    """Verifies user registration, bcrypt password hashing, and JWT login."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Register student
        reg_res = await client.post("/api/auth/register", json={
            "name": "Karthik Verma",
            "email": "karthik.v@iiit.ac.in",
            "password": "SecurePassword123!",
            "role": "STUDENT",
            "major": "Computer Science",
            "target_role": "Backend Engineer",
            "target_company": "Stripe"
        })
        assert reg_res.status_code == 200
        reg_json = reg_res.json()
        assert reg_json["success"] is True
        assert "token" in reg_json
        assert reg_json["user"]["email"] == "karthik.v@iiit.ac.in"

        # 2. Login with valid credentials
        login_res = await client.post("/api/auth/login", json={
            "email": "karthik.v@iiit.ac.in",
            "password": "SecurePassword123!"
        })
        assert login_res.status_code == 200
        login_json = login_res.json()
        assert login_json["success"] is True
        token = login_json["token"]

        # 3. Access /api/auth/me with Bearer token
        me_res = await client.get(
            "/api/auth/me",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert me_res.status_code == 200
        me_json = me_res.json()
        assert me_json["data"]["name"] == "Karthik Verma"


@pytest.mark.asyncio
async def test_alumni_listing_and_admin_verification():
    """Verifies alumni retrieval and administrative verification."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Retrieve alumni
        res = await client.get("/api/alumni")
        assert res.status_code == 200
        data = res.json()
        assert data["success"] is True
        assert len(data["data"]) >= 4

        # Register unverified alumni
        reg = await client.post("/api/auth/register", json={
            "name": "Rohan Mehta",
            "email": "rohan.m@iiit.ac.in",
            "password": "Password123!",
            "role": "ALUMNI",
            "current_role": "Software Engineer",
            "company": "Amazon"
        })
        alum_id = reg.json()["user"]["id"]

        # Check alumni initially has pending verification
        alum_res = await client.get(f"/api/alumni/{alum_id}")
        assert alum_res.json()["data"]["is_verified"] is False

        # Admin verifies alumni
        verify_res = await client.post(f"/api/admin/verify-alumni/{alum_id}")
        assert verify_res.status_code == 200
        assert verify_res.json()["success"] is True

        # Check updated status
        updated = await client.get(f"/api/alumni/{alum_id}")
        assert updated.json()["data"]["is_verified"] is True
        assert updated.json()["data"]["verification_status"] == "VERIFIED"


@pytest.mark.asyncio
async def test_explainable_mentor_recommendations():
    """Verifies that mentor recommendations include transparent match scores and concrete reasons."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.get(
            "/api/mentors/recommendations",
            params={
                "target_role": "Senior Software Engineer",
                "target_company": "Google",
                "skills": "Python,System Design,Distributed Systems"
            }
        )
        assert res.status_code == 200
        data = res.json()
        assert data["success"] is True
        assert len(data["data"]) > 0

        top_mentor = data["data"][0]
        # Top mentor should be Priya Sharma (Google Senior SWE)
        assert top_mentor["company"] == "Google"
        assert top_mentor["match_score"] >= 85
        assert len(top_mentor["match_reasons"]) > 0
        assert any("Google" in r or "Skill" in r or "Role" in r for r in top_mentor["match_reasons"])


@pytest.mark.asyncio
async def test_mentorship_request_lifecycle_and_48h_sla():
    """Tests the full mentorship lifecycle: creation, 48h deadline, and accept/decline state transitions."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Create request
        req_res = await client.post(
            "/api/mentorship/requests",
            json={
                "mentor_id": "alum_1",
                "topic": "System Design Mock Interview",
                "message": "Hi Priya, looking forward to practicing high-throughput architecture.",
                "skills": ["System Design", "Python"]
            },
            params={"mentee_id": "student_101"}
        )
        assert req_res.status_code == 200
        req_data = req_res.json()["data"]
        req_id = req_data["request_id"]
        assert req_data["status"] == "PENDING"
        assert req_data["deadline_hours"] == 48
        assert "expires_at" in req_data
        assert req_data["match_score"] > 70

        # 2. Inspect request status
        status_res = await client.get(f"/api/mentorship/requests/{req_id}")
        assert status_res.status_code == 200
        status_data = status_res.json()["data"]
        assert status_data["seconds_remaining"] > 0
        assert status_data["hours_remaining"] <= 48.0

        # 3. Respond with Accept
        accept_res = await client.post(
            f"/api/mentorship/requests/{req_id}/respond",
            json={"action": "accept"}
        )
        assert accept_res.status_code == 200
        assert accept_res.json()["status"] == "ACCEPTED"

        # 4. Idempotent check (responding again returns current accepted status)
        dup_res = await client.post(
            f"/api/mentorship/requests/{req_id}/respond",
            json={"action": "accept"}
        )
        assert dup_res.status_code == 200
        assert dup_res.json()["status"] == "ACCEPTED"


@pytest.mark.asyncio
async def test_telegram_linking_workflow():
    """Tests single-use, 15-minute token TTL Telegram account linking."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Initiate linking
        init_res = await client.post(
            "/api/v1/telegram/link/initiate",
            json={
                "user_id": "student_101",
                "email": "divyansh.g@students.iiit.ac.in",
                "role": "STUDENT"
            }
        )
        assert init_res.status_code == 200
        token = init_res.json()["token"]
        assert token.startswith("link_")

        # 2. Validate linking
        val_res = await client.post(
            "/api/v1/telegram/link/validate",
            json={
                "token": token,
                "telegram_user_id": 999888777,
                "telegram_chat_id": 999888777,
                "telegram_username": "divyansh_test"
            }
        )
        assert val_res.status_code == 200
        assert val_res.json()["success"] is True

        # 3. Reusing token fails (single-use constraint)
        reuse_res = await client.post(
            "/api/v1/telegram/link/validate",
            json={
                "token": token,
                "telegram_user_id": 999888777,
                "telegram_chat_id": 999888777
            }
        )
        assert reuse_res.json()["success"] is False
        assert "already been used" in reuse_res.json()["message"]
