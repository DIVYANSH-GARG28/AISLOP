"""Asynchronous MongoDB database connection and collection registry.

Supports both production MongoDB servers (via motor) and automated in-memory
mock databases (via mongomock_motor) for local development and demos.
"""

import logging
from typing import Optional, Any, Dict
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
import mongomock_motor
from connected_backend.config import settings

logger = logging.getLogger("connected.database")


class DatabaseManager:
    """Manages MongoDB connections with automatic fallback to mock store."""

    client: Optional[Any] = None
    db: Optional[Any] = None
    is_mock: bool = False

    async def connect(self):
        """Attempts connection to MongoDB; falls back to mongomock-motor if offline."""
        try:
            # 1. Attempt connection to configured MongoDB URI with a short timeout
            real_client = AsyncIOMotorClient(
                settings.MONGODB_URI,
                serverSelectionTimeoutMS=1500,
                connectTimeoutMS=1500
            )
            # Ping the server to verify connectivity
            await real_client.admin.command('ping')
            self.client = real_client
            self.db = self.client[settings.MONGODB_DB_NAME]
            self.is_mock = False
            logger.info(f"✅ Successfully connected to live MongoDB at {settings.MONGODB_URI}/{settings.MONGODB_DB_NAME}")
        except Exception as e:
            logger.warning(
                f"⚠️  Live MongoDB connection failed ({e}). "
                f"Switching smoothly to high-speed in-memory MongoDB store (mongomock_motor)."
            )
            self.client = mongomock_motor.AsyncMongoMockClient()
            self.db = self.client[settings.MONGODB_DB_NAME]
            self.is_mock = True
            logger.info("⚡ In-memory MongoDB active. All CRUD operations will be persisted in memory for this session.")

        # Ensure collections exist
        await self._init_indexes()

    async def _init_indexes(self):
        """Creates appropriate unique indexes on key collections."""
        try:
            await self.users.create_index("email", unique=True)
            await self.users.create_index("telegram_user_id", sparse=True)
            await self.mentorship_requests.create_index("request_id", unique=True)
            await self.linking_tokens.create_index("token", unique=True)
        except Exception as e:
            logger.debug(f"Index creation note (safe to ignore in mock mode): {e}")

    async def disconnect(self):
        """Closes the active database connection."""
        if self.client:
            self.client.close()
            logger.info("Database connection closed.")

    # Property accessors for collections
    @property
    def users(self):
        return self.db["users"]

    @property
    def students(self):
        return self.db["students"]

    @property
    def alumni(self):
        return self.db["alumni"]

    @property
    def faculty(self):
        return self.db["faculty"]

    @property
    def skills(self):
        return self.db["skills"]

    @property
    def mentorship_requests(self):
        return self.db["mentorship_requests"]

    @property
    def linking_tokens(self):
        return self.db["linking_tokens"]

    @property
    def institute_verifications(self):
        return self.db["institute_verifications"]

    @property
    def roadmaps(self):
        return self.db["roadmaps"]

    @property
    def meetings(self):
        return self.db["meetings"]


# Singleton Database Manager instance
db_manager = DatabaseManager()


def get_db():
    """Dependency helper for FastAPI routes to access current DB instance."""
    return db_manager


def clean_doc(doc: Optional[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    """Sanitizes MongoDB document by converting _id to id and providing camelCase aliases."""
    if doc is None:
        return None
    cleaned = dict(doc)
    if "_id" in cleaned:
        cleaned["_id"] = str(cleaned["_id"])
        if "id" not in cleaned:
            cleaned["id"] = cleaned["_id"]

    # Provide dual camelCase / snake_case access for frontend compatibility
    if "graduation_year" in cleaned and "graduationYear" not in cleaned:
        cleaned["graduationYear"] = cleaned["graduation_year"]
    elif "graduationYear" in cleaned and "graduation_year" not in cleaned:
        cleaned["graduation_year"] = cleaned["graduationYear"]

    if "target_role" in cleaned and "targetRole" not in cleaned:
        cleaned["targetRole"] = cleaned["target_role"]
    elif "targetRole" in cleaned and "target_role" not in cleaned:
        cleaned["target_role"] = cleaned["targetRole"]

    if "target_company" in cleaned and "targetCompany" not in cleaned:
        cleaned["targetCompany"] = cleaned["target_company"]
    elif "targetCompany" in cleaned and "target_company" not in cleaned:
        cleaned["target_company"] = cleaned["targetCompany"]

    if "avatar_url" in cleaned and "avatarUrl" not in cleaned:
        cleaned["avatarUrl"] = cleaned["avatar_url"]
    elif "avatarUrl" in cleaned and "avatar_url" not in cleaned:
        cleaned["avatar_url"] = cleaned["avatarUrl"]

    if "institutional_id" in cleaned and "institutionalId" not in cleaned:
        cleaned["institutionalId"] = cleaned["institutional_id"]
    elif "institutionalId" in cleaned and "institutional_id" not in cleaned:
        cleaned["institutional_id"] = cleaned["institutionalId"]

    if "linkedin_url" in cleaned and "linkedInUrl" not in cleaned:
        cleaned["linkedInUrl"] = cleaned["linkedin_url"]
    elif "linkedInUrl" in cleaned and "linkedin_url" not in cleaned:
        cleaned["linkedin_url"] = cleaned["linkedInUrl"]

    return cleaned
