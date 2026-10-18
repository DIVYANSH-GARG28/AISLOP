"""Official Telegram Bot API Client with bounded retries, 429 rate limit backoff, and mock test harness."""

import asyncio
import logging
import time
from typing import Dict, Any, Optional, List
import httpx
from connected_bot.config import settings

logger = logging.getLogger(__name__)


class TelegramAPIClient:
    """Async HTTP client for interacting with the official Telegram Bot API."""

    def __init__(
        self,
        bot_token: Optional[str] = None,
        base_url: Optional[str] = None,
        max_retries: Optional[int] = None,
        backoff_factor: Optional[float] = None,
        mock_mode: bool = False
    ):
        self.bot_token = bot_token or settings.TELEGRAM_BOT_TOKEN
        self.base_url = (base_url or settings.TELEGRAM_API_BASE_URL).rstrip("/")
        self.max_retries = max_retries if max_retries is not None else settings.MAX_RETRIES
        self.backoff_factor = backoff_factor if backoff_factor is not None else settings.RETRY_BACKOFF_FACTOR
        self.mock_mode = mock_mode

        # Test inspection harness
        self.sent_messages: List[Dict[str, Any]] = []
        self.edited_messages: List[Dict[str, Any]] = []
        self.answered_callbacks: List[Dict[str, Any]] = []
        self.simulated_errors: List[Exception] = []

    @property
    def api_url(self) -> str:
        return f"{self.base_url}/bot{self.bot_token}"

    async def _post_with_retries(self, method: str, payload: Dict[str, Any]) -> Dict[str, Any]:
        """Sends an async HTTP POST request to Telegram API with bounded retries and 429 backoff."""
        if self.mock_mode:
            if self.simulated_errors:
                err = self.simulated_errors.pop(0)
                raise err
            return {"ok": True, "result": {"message_id": 99999, "status": "mock_success"}}

        url = f"{self.api_url}/{method}"
        attempt = 0

        async with httpx.AsyncClient(timeout=10.0) as client:
            while attempt <= self.max_retries:
                attempt += 1
                try:
                    logger.debug(f"[TELEGRAM API REQUEST] Method: {method}, Attempt: {attempt}")
                    response = await client.post(url, json=payload)

                    if response.status_code == 200:
                        data = response.json()
                        if data.get("ok"):
                            return data
                        raise RuntimeError(f"Telegram API error: {data.get('description')}")

                    # Handle HTTP 429 Rate Limiting
                    if response.status_code == 429:
                        try:
                            resp_json = response.json()
                            retry_after = resp_json.get("parameters", {}).get("retry_after", 2)
                        except Exception:
                            retry_after = 2

                        logger.warning(
                            f"[TELEGRAM 429] Rate limited on {method}. Backing off for {retry_after}s. Attempt {attempt}/{self.max_retries}"
                        )
                        if attempt <= self.max_retries:
                            await asyncio.sleep(retry_after)
                            continue
                        response.raise_for_status()

                    # Handle 403 User Blocked Bot
                    if response.status_code == 403:
                        logger.warning(f"[TELEGRAM 403] Bot blocked or user not initiated conversation: {response.text}")
                        return {"ok": False, "error_code": 403, "description": "Forbidden: bot was blocked by the user"}

                    # Retry on 5xx server errors
                    if response.status_code >= 500 and attempt <= self.max_retries:
                        sleep_time = (self.backoff_factor ** attempt)
                        logger.warning(f"[TELEGRAM 5XX] Status {response.status_code}. Retrying in {sleep_time:.2f}s...")
                        await asyncio.sleep(sleep_time)
                        continue

                    response.raise_for_status()

                except (httpx.NetworkError, httpx.TimeoutException) as exc:
                    logger.warning(f"[TELEGRAM NETWORK ERROR] Attempt {attempt}/{self.max_retries} failed: {exc}")
                    if attempt <= self.max_retries:
                        sleep_time = (self.backoff_factor ** attempt)
                        await asyncio.sleep(sleep_time)
                        continue
                    raise

        raise RuntimeError(f"Failed to execute Telegram API call {method} after {self.max_retries} retries")

    async def send_message(
        self,
        chat_id: int,
        text: str,
        parse_mode: str = "HTML",
        reply_markup: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Sends a text message to a specified Telegram chat or user."""
        payload: Dict[str, Any] = {
            "chat_id": chat_id,
            "text": text,
            "parse_mode": parse_mode,
        }
        if reply_markup:
            payload["reply_markup"] = reply_markup

        if self.mock_mode:
            if self.simulated_errors:
                err = self.simulated_errors.pop(0)
                raise err
            record = {
                "chat_id": chat_id,
                "text": text,
                "parse_mode": parse_mode,
                "reply_markup": reply_markup,
                "timestamp": time.time()
            }
            self.sent_messages.append(record)
            logger.info(f"[MOCK TELEGRAM] send_message to {chat_id}: {text[:60]}...")
            return {"ok": True, "result": {"message_id": len(self.sent_messages), "chat": {"id": chat_id}, "text": text}}

        return await self._post_with_retries("sendMessage", payload)

    async def edit_message_text(
        self,
        chat_id: int,
        message_id: int,
        text: str,
        parse_mode: str = "HTML",
        reply_markup: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Edits an existing Telegram message (e.g. to disable buttons after a click)."""
        payload: Dict[str, Any] = {
            "chat_id": chat_id,
            "message_id": message_id,
            "text": text,
            "parse_mode": parse_mode,
        }
        if reply_markup is not None:
            payload["reply_markup"] = reply_markup

        if self.mock_mode:
            record = {
                "chat_id": chat_id,
                "message_id": message_id,
                "text": text,
                "reply_markup": reply_markup,
                "timestamp": time.time()
            }
            self.edited_messages.append(record)
            logger.info(f"[MOCK TELEGRAM] edit_message_text msg_id {message_id} in {chat_id}")
            return {"ok": True, "result": {"message_id": message_id, "text": text}}

        return await self._post_with_retries("editMessageText", payload)

    async def answer_callback_query(
        self,
        callback_query_id: str,
        text: Optional[str] = None,
        show_alert: bool = False
    ) -> Dict[str, Any]:
        """Answers an incoming callback query to acknowledge user button interaction."""
        payload: Dict[str, Any] = {
            "callback_query_id": callback_query_id,
            "show_alert": show_alert,
        }
        if text:
            payload["text"] = text

        if self.mock_mode:
            record = {
                "callback_query_id": callback_query_id,
                "text": text,
                "show_alert": show_alert,
                "timestamp": time.time()
            }
            self.answered_callbacks.append(record)
            logger.info(f"[MOCK TELEGRAM] answer_callback_query id {callback_query_id}: {text}")
            return {"ok": True, "result": True}

        return await self._post_with_retries("answerCallbackQuery", payload)

    async def set_webhook(
        self,
        url: str,
        secret_token: Optional[str] = None,
        drop_pending_updates: bool = False
    ) -> Dict[str, Any]:
        """Registers the HTTPS webhook endpoint with Telegram Bot API."""
        payload: Dict[str, Any] = {
            "url": url,
            "drop_pending_updates": drop_pending_updates,
            "allowed_updates": ["message", "callback_query"]
        }
        if secret_token:
            payload["secret_token"] = secret_token

        if self.mock_mode:
            return {"ok": True, "result": True, "description": "Webhook was set"}

        return await self._post_with_retries("setWebhook", payload)

    async def delete_webhook(self, drop_pending_updates: bool = False) -> Dict[str, Any]:
        """Removes webhook configuration (useful for teardown or local polling dev)."""
        payload = {"drop_pending_updates": drop_pending_updates}
        if self.mock_mode:
            return {"ok": True, "result": True}
        return await self._post_with_retries("deleteWebhook", payload)

    async def get_me(self) -> Dict[str, Any]:
        """Fetches bot user info from Telegram."""
        if self.mock_mode:
            return {
                "ok": True,
                "result": {
                    "id": 123456789,
                    "is_bot": True,
                    "first_name": "connectED Bot",
                    "username": settings.TELEGRAM_BOT_USERNAME
                }
            }
        return await self._post_with_retries("getMe", {})


# Global telegram client instance
telegram_client = TelegramAPIClient()
