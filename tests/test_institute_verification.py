"""Unit and integration tests for institutional email verification and edge case handling."""

import pytest
import pytest_asyncio
import time
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
async def test_valid_institution_email_otp_request():
    """Verifies that an authorized educational email (@its.edu.in) successfully generates an OTP."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.post(
            "/api/institute/verify/request-otp",
            json={"email": "divyansh.garg@its.edu.in", "institution_name": "I.T.S Engineering College"},
            params={"user_id": "student_101"}
        )
        assert res.status_code == 200
        data = res.json()
        assert data["success"] is True
        assert data["data"]["email"] == "divyansh.garg@its.edu.in"
        assert data["data"]["domain"] == "its.edu.in"
        assert data["data"]["cooldown_seconds"] == 60


@pytest.mark.asyncio
async def test_rejection_of_non_educational_email():
    """Edge Case: Rejects generic commercial email providers like gmail.com or yahoo.com."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.post(
            "/api/institute/verify/request-otp",
            json={"email": "personal.account@gmail.com"}
        )
        assert res.status_code == 400
        data = res.json()
        assert "not permitted" in data["detail"]["message"].lower() or "not recognized" in data["detail"]["message"].lower()


@pytest.mark.asyncio
async def test_case_insensitivity_and_normalization():
    """Edge Case: Normalizes uppercase institutional emails (e.g., ANISH@ITS.EDU.IN)."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.post(
            "/api/institute/verify/request-otp",
            json={"email": "  ANISH.KUMAR@ITS.EDU.IN  "}
        )
        assert res.status_code == 200
        assert res.json()["data"]["email"] == "anish.kumar@its.edu.in"


@pytest.mark.asyncio
async def test_cooldown_rate_limit_enforcement():
    """Edge Case: Rejects spam OTP requests within the 60-second cooldown window."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # First request succeeds
        res1 = await client.post(
            "/api/institute/verify/request-otp",
            json={"email": "cooldown.test@its.edu.in"}
        )
        assert res1.status_code == 200

        # Immediate second request is blocked with 429
        res2 = await client.post(
            "/api/institute/verify/request-otp",
            json={"email": "cooldown.test@its.edu.in"}
        )
        assert res2.status_code == 429
        assert "Please wait" in res2.json()["detail"]["message"]


@pytest.mark.asyncio
async def test_successful_otp_confirmation_and_profile_upgrade():
    """Verifies that submitting the correct OTP marks student as institution-verified."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Request OTP
        req_res = await client.post(
            "/api/institute/verify/request-otp",
            json={"email": "priya.verma@its.edu.in"},
            params={"user_id": "student_101"}
        )
        assert req_res.status_code == 200
        otp_code = req_res.json()["data"]["_dev_hint_otp"]
        assert otp_code is not None

        # 2. Confirm OTP
        confirm_res = await client.post(
            "/api/institute/verify/confirm-otp",
            json={"email": "priya.verma@its.edu.in", "otp": otp_code},
            params={"user_id": "student_101"}
        )
        assert confirm_res.status_code == 200
        confirm_data = confirm_res.json()
        assert confirm_data["success"] is True
        assert confirm_data["data"]["is_verified"] is True
        assert confirm_data["data"]["institution_domain"] == "its.edu.in"

        # 3. Check status
        status_res = await client.get("/api/institute/status", params={"user_id": "student_101"})
        assert status_res.status_code == 200
        assert status_res.json()["data"]["is_verified"] is True


@pytest.mark.asyncio
async def test_incorrect_otp_attempt_limits():
    """Edge Case: Wrong OTP decrements attempts and invalidates after 3 failures."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Request OTP
        await client.post(
            "/api/institute/verify/request-otp",
            json={"email": "brute.test@its.edu.in"}
        )

        # Attempt 1: wrong OTP
        res1 = await client.post(
            "/api/institute/verify/confirm-otp",
            json={"email": "brute.test@its.edu.in", "otp": "000000"}
        )
        assert res1.status_code == 400
        assert res1.json()["detail"]["attempts_left"] == 2

        # Attempt 2: wrong OTP
        res2 = await client.post(
            "/api/institute/verify/confirm-otp",
            json={"email": "brute.test@its.edu.in", "otp": "000001"}
        )
        assert res2.status_code == 400
        assert res2.json()["detail"]["attempts_left"] == 1

        # Attempt 3: wrong OTP (locks out)
        res3 = await client.post(
            "/api/institute/verify/confirm-otp",
            json={"email": "brute.test@its.edu.in", "otp": "000002"}
        )
        assert res3.status_code == 400
        assert "invalidated" in res3.json()["detail"]["message"].lower()


@pytest.mark.asyncio
async def test_portal_data_access_gate():
    """Edge Case: Access to /api/institute/portal-data is forbidden for unverified users and granted for verified."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Unverified user attempt -> 403 Forbidden
        unverified_res = await client.get(
            "/api/institute/portal-data",
            params={"user_id": "student_101"}
        )
        assert unverified_res.status_code == 403
        assert unverified_res.json()["detail"]["error"] == "INSTITUTION_VERIFICATION_REQUIRED"

        # 2. Complete verification
        req = await client.post(
            "/api/institute/verify/request-otp",
            json={"email": "access.gate@its.edu.in"},
            params={"user_id": "student_101"}
        )
        otp = req.json()["data"]["_dev_hint_otp"]
        await client.post(
            "/api/institute/verify/confirm-otp",
            json={"email": "access.gate@its.edu.in", "otp": otp},
            params={"user_id": "student_101"}
        )

        # 3. Verified user attempt -> 200 OK with exclusive campus placement drives
        verified_res = await client.get(
            "/api/institute/portal-data",
            params={"user_id": "student_101"}
        )
        assert verified_res.status_code == 200
        portal_data = verified_res.json()["data"]
        assert len(portal_data["drives"]) >= 2
        assert len(portal_data["circulars"]) >= 1
        assert any(d["company"] == "Google India" for d in portal_data["drives"])
