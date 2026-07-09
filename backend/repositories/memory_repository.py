"""
MemoryRepository — store and retrieve long-term user memory items.
Memory items are global (not per-conversation) — they represent persistent
facts about the user that apply across all sessions.
"""

import uuid
import logging
from datetime import datetime, timezone
from typing import List, Optional

from database.db import db_connection
from database.models import MemoryItem

logger = logging.getLogger(__name__)

_DT_FMT = "%Y-%m-%dT%H:%M:%S.%f"


def _now_iso() -> str:
    return datetime.now(timezone.utc).strftime(_DT_FMT)


def _row_to_item(row) -> MemoryItem:
    return MemoryItem(
        id=row["id"],
        key=row["key"],
        value=row["value"],
        category=row["category"],
        confidence=row["confidence"],
        created_at=datetime.strptime(row["created_at"], _DT_FMT),
        updated_at=datetime.strptime(row["updated_at"], _DT_FMT),
    )


class MemoryRepository:

    async def upsert(
        self,
        key: str,
        value: str,
        category: str = "fact",
        confidence: float = 1.0,
    ) -> MemoryItem:
        now = _now_iso()
        async with db_connection() as conn:
            # Check existing
            cursor = await conn.execute(
                "SELECT * FROM memory_items WHERE key = ?", (key,)
            )
            existing = await cursor.fetchone()

            if existing:
                await conn.execute(
                    """
                    UPDATE memory_items
                    SET value = ?, category = ?, confidence = ?, updated_at = ?
                    WHERE key = ?
                    """,
                    (value, category, confidence, now, key),
                )
                item_id = existing["id"]
                created_at = existing["created_at"]
            else:
                item_id = str(uuid.uuid4())
                created_at = now
                await conn.execute(
                    """
                    INSERT INTO memory_items (id, key, value, category, confidence, created_at, updated_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                    """,
                    (item_id, key, value, category, confidence, now, now),
                )
            await conn.commit()

        logger.debug(f"Upserted memory: {key} = {value!r}")
        return MemoryItem(
            id=item_id,
            key=key,
            value=value,
            category=category,
            confidence=confidence,
            created_at=datetime.strptime(created_at, _DT_FMT),
            updated_at=datetime.strptime(now, _DT_FMT),
        )

    async def get_all(self, category: Optional[str] = None) -> List[MemoryItem]:
        async with db_connection() as conn:
            if category:
                cursor = await conn.execute(
                    "SELECT * FROM memory_items WHERE category = ? ORDER BY confidence DESC, updated_at DESC",
                    (category,),
                )
            else:
                cursor = await conn.execute(
                    "SELECT * FROM memory_items ORDER BY confidence DESC, updated_at DESC"
                )
            rows = await cursor.fetchall()
        return [_row_to_item(r) for r in rows]

    async def get(self, key: str) -> Optional[MemoryItem]:
        async with db_connection() as conn:
            cursor = await conn.execute(
                "SELECT * FROM memory_items WHERE key = ?", (key,)
            )
            row = await cursor.fetchone()
        return _row_to_item(row) if row else None

    async def delete(self, key: str) -> bool:
        async with db_connection() as conn:
            cursor = await conn.execute(
                "DELETE FROM memory_items WHERE key = ?", (key,)
            )
            await conn.commit()
        return cursor.rowcount > 0

    async def clear_all(self) -> None:
        async with db_connection() as conn:
            await conn.execute("DELETE FROM memory_items")
            await conn.commit()
        logger.info("Cleared all memory items.")

    async def count(self) -> int:
        async with db_connection() as conn:
            cursor = await conn.execute("SELECT COUNT(*) as cnt FROM memory_items")
            row = await cursor.fetchone()
        return row["cnt"] if row else 0
