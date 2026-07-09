import os
import json
import logging
from typing import Any, Optional
import redis.asyncio as redis

logger = logging.getLogger(__name__)

class RedisService:
    def __init__(self):
        self.redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/0")
        self.client: Optional[redis.Redis] = None

    async def connect(self):
        try:
            self.client = redis.from_url(self.redis_url, decode_responses=True)
            await self.client.ping()
            logger.info(f"Connected to Redis at {self.redis_url}")
        except Exception as e:
            logger.error(f"Failed to connect to Redis: {e}")
            self.client = None

    async def disconnect(self):
        if self.client:
            await self.client.close()

    async def get_cache(self, key: str) -> Optional[Any]:
        if not self.client:
            return None
        try:
            val = await self.client.get(key)
            return json.loads(val) if val else None
        except Exception:
            return None

    async def set_cache(self, key: str, value: Any, ttl: int = 3600):
        if not self.client:
            return
        try:
            await self.client.set(key, json.dumps(value), ex=ttl)
        except Exception as e:
            logger.warning(f"Failed to set cache for {key}: {e}")

redis_service = RedisService()
