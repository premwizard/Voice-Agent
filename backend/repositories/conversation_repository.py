"""
ConversationRepository — CRUD for the conversations table.
All methods open their own connection to keep the pattern stateless
and compatible with FastAPI's async request handling.
"""

import uuid
import logging
from datetime import datetime, timezone
from typing import List, Optional

from database.db import db_connection
from database.models import Conversation

logger = logging.getLogger(__name__)

_DT_FMT = "%Y-%m-%dT%H:%M:%S.%f"


def _now_iso() -> str:
    return datetime.now(timezone.utc).strftime(_DT_FMT)


def _row_to_conv(row) -> Conversation:
    return Conversation(
        id=row["id"],
        title=row["title"],
        created_at=datetime.strptime(row["created_at"], _DT_FMT),
        updated_at=datetime.strptime(row["updated_at"], _DT_FMT),
        message_count=row["message_count"],
        is_pinned=bool(row["is_pinned"]),
        mode=row["mode"],
    )


class ConversationRepository:

    async def create(
        self,
        conversation_id: str,
        title: str = "New Conversation",
        mode: str = "chat",
    ) -> Conversation:
        now = _now_iso()
        async with db_connection() as conn:
            await conn.execute(
                """
                INSERT INTO conversations (id, title, created_at, updated_at, message_count, is_pinned, mode)
                VALUES (?, ?, ?, ?, 0, 0, ?)
                """,
                (conversation_id, title, now, now, mode),
            )
            await conn.commit()
        logger.info(f"Created conversation: {conversation_id}")
        return Conversation(
            id=conversation_id,
            title=title,
            created_at=datetime.strptime(now, _DT_FMT),
            updated_at=datetime.strptime(now, _DT_FMT),
            message_count=0,
            is_pinned=False,
            mode=mode,
        )

    async def get(self, conversation_id: str) -> Optional[Conversation]:
        async with db_connection() as conn:
            cursor = await conn.execute(
                "SELECT * FROM conversations WHERE id = ?", (conversation_id,)
            )
            row = await cursor.fetchone()
        return _row_to_conv(row) if row else None

    async def list_all(self, limit: int = 100) -> List[Conversation]:
        async with db_connection() as conn:
            cursor = await conn.execute(
                """
                SELECT * FROM conversations
                ORDER BY is_pinned DESC, updated_at DESC
                LIMIT ?
                """,
                (limit,),
            )
            rows = await cursor.fetchall()
        return [_row_to_conv(r) for r in rows]

    async def rename(self, conversation_id: str, new_title: str) -> bool:
        now = _now_iso()
        async with db_connection() as conn:
            cursor = await conn.execute(
                "UPDATE conversations SET title = ?, updated_at = ? WHERE id = ?",
                (new_title, now, conversation_id),
            )
            await conn.commit()
        return cursor.rowcount > 0

    async def set_pinned(self, conversation_id: str, pinned: bool) -> bool:
        now = _now_iso()
        async with db_connection() as conn:
            cursor = await conn.execute(
                "UPDATE conversations SET is_pinned = ?, updated_at = ? WHERE id = ?",
                (1 if pinned else 0, now, conversation_id),
            )
            await conn.commit()
        return cursor.rowcount > 0

    async def increment_message_count(self, conversation_id: str) -> None:
        now = _now_iso()
        async with db_connection() as conn:
            await conn.execute(
                """
                UPDATE conversations
                SET message_count = message_count + 1, updated_at = ?
                WHERE id = ?
                """,
                (now, conversation_id),
            )
            await conn.commit()

    async def update_mode(self, conversation_id: str, mode: str) -> None:
        async with db_connection() as conn:
            await conn.execute(
                "UPDATE conversations SET mode = ? WHERE id = ?",
                (mode, conversation_id),
            )
            await conn.commit()

    async def delete(self, conversation_id: str) -> bool:
        async with db_connection() as conn:
            cursor = await conn.execute(
                "DELETE FROM conversations WHERE id = ?", (conversation_id,)
            )
            await conn.commit()
        logger.info(f"Deleted conversation: {conversation_id}")
        return cursor.rowcount > 0

    async def search(self, query: str, limit: int = 50) -> List[Conversation]:
        """Full-text search on conversation titles. Keyword-based for now; can be
        extended with FTS5 or semantic search later without changing callers."""
        pattern = f"%{query}%"
        async with db_connection() as conn:
            cursor = await conn.execute(
                """
                SELECT * FROM conversations
                WHERE title LIKE ?
                ORDER BY is_pinned DESC, updated_at DESC
                LIMIT ?
                """,
                (pattern, limit),
            )
            rows = await cursor.fetchall()
        return [_row_to_conv(r) for r in rows]

    async def exists(self, conversation_id: str) -> bool:
        async with db_connection() as conn:
            cursor = await conn.execute(
                "SELECT 1 FROM conversations WHERE id = ? LIMIT 1", (conversation_id,)
            )
            row = await cursor.fetchone()
        return row is not None
