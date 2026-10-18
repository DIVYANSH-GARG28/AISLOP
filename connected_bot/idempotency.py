"""Idempotency and deduplication engine for Telegram updates and backend events."""

import time
from typing import Dict, Optional, Tuple, Any
import logging

logger = logging.getLogger(__name__)


class IdempotencyStore:
    """Thread-safe TTL-based in-memory idempotency cache for deduplicating incoming events and updates."""

    def __init__(self, default_ttl_seconds: int = 86400):
        self.default_ttl = default_ttl_seconds
        # key -> (expiry_timestamp, cached_result)
        self._cache: Dict[str, Tuple[float, Any]] = {}

    def _cleanup_expired(self):
        now = time.time()
        expired_keys = [k for k, (exp, _) in self._cache.items() if exp <= now]
        for k in expired_keys:
            del self._cache[k]

    def check_and_set(self, key: str, value: Any = True, ttl_seconds: Optional[int] = None) -> bool:
        """Atomically checks if a key exists and is valid.
        
        Returns:
            True if key is NEW and was successfully set (safe to proceed).
            False if key ALREADY EXISTS (duplicate, skip processing).
        """
        now = time.time()
        self._cleanup_expired()

        if key in self._cache:
            exp, _ = self._cache[key]
            if exp > now:
                logger.info(f"[IDEMPOTENCY] Duplicate detected for key: {key}")
                return False

        ttl = ttl_seconds if ttl_seconds is not None else self.default_ttl
        self._cache[key] = (now + ttl, value)
        return True

    def get_result(self, key: str) -> Optional[Any]:
        """Retrieves cached result for an already-processed key if available."""
        now = time.time()
        if key in self._cache:
            exp, val = self._cache[key]
            if exp > now:
                return val
        return None

    def set_result(self, key: str, value: Any, ttl_seconds: Optional[int] = None):
        """Updates or sets cached result for an idempotency key."""
        now = time.time()
        ttl = ttl_seconds if ttl_seconds is not None else self.default_ttl
        self._cache[key] = (now + ttl, value)

    def remove(self, key: str):
        """Removes a key from cache."""
        if key in self._cache:
            del self._cache[key]

    def clear(self):
        """Clears all cached keys."""
        self._cache.clear()


# Global singleton instance
idempotency_store = IdempotencyStore()
