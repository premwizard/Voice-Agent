"""
MessageRepository — persist and retrieve messages per conversation.
"""

import uuid
import json
import logging
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any

from database.db import db_connection
from database.models import Message

logger = logging.getLogger(__name__)

_DT_FMT = "%Y-%m-%dT%H:%M:%S.%f"


def _now_iso() -> str:
    return datetime.now(timezone.utc).strftime(_DT_FMT)


def _row_to_msg(row) -> Message:
    metadata = None
    if row["metadata"]:
        try:
            metadata = json.loads(row["metadata"])
        except (json.JSONDecodeError, TypeError):
            metadata = None
    return Message(
        id=row["id"],
        conversation_id=row["conversation_id"],
        role=row["role"],
        content=row["content"],
        timestamp=datetime.strptime(row["timestamp"], _DT_FMT),
        mode=row["mode"],
        metadata=metadata,
    )


class MessageRepository:

    async def save(
        self,
        conversation_id: str,
        role: str,
        content: str,
        mode: str = "chat",
        metadata: Optional[Dict[str, Any]] = None,
    ) -> Message:
        msg_id = str(uuid.uuid4())
        now = _now_iso()
        meta_json = json.dumps(metadata) if metadata else None
        async with db_connection() as conn:
            await conn.execute(
                """
                INSERT INTO messages (id, conversation_id, role, content, timestamp, mode, metadata)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                """,
                (msg_id, conversation_id, role, content, now, mode, meta_json),
            )
            await conn.commit()
        return Message(
            id=msg_id,
            conversation_id=conversation_id,
            role=role,
            content=content,
            timestamp=datetime.strptime(now, _DT_FMT),
            mode=mode,
            metadata=metadata,
        )

    async def get_recent(self, conversation_id: str, limit: int) -> List[Message]:
        """Return the most recent `limit` messages in chronological order."""
        async with db_connection() as conn:
            cursor = await conn.execute(
                """
                SELECT * FROM (
                    SELECT * FROM messages
                    WHERE conversation_id = ?
                    ORDER BY timestamp DESC
                    LIMIT ?
                ) ORDER BY timestamp ASC
                """,
                (conversation_id, limit),
            )
            rows = await cursor.fetchall()
        return [_row_to_msg(r) for r in rows]

    async def get_all(self, conversation_id: str) -> List[Message]:
        async with db_connection() as conn:
            cursor = await conn.execute(
                "SELECT * FROM messages WHERE conversation_id = ? ORDER BY timestamp ASC",
                (conversation_id,),
            )
            rows = await cursor.fetchall()
        return [_row_to_msg(r) for r in rows]

    async def get_older_than(
        self, conversation_id: str, keep_recent: int
    ) -> List[Message]:
        """Return all messages except the most recent `keep_recent` ones."""
        async with db_connection() as conn:
            cursor = await conn.execute(
                """
                SELECT * FROM messages
                WHERE conversation_id = ?
                  AND id NOT IN (
                      SELECT id FROM messages
                      WHERE conversation_id = ?
                      ORDER BY timestamp DESC
                      LIMIT ?
                  )
                ORDER BY timestamp ASC
                """,
                (conversation_id, conversation_id, keep_recent),
            )
            rows = await cursor.fetchall()
        return [_row_to_msg(r) for r in rows]

    async def count(self, conversation_id: str) -> int:
        async with db_connection() as conn:
            cursor = await conn.execute(
                "SELECT COUNT(*) as cnt FROM messages WHERE conversation_id = ?",
                (conversation_id,),
            )
            row = await cursor.fetchone()
        return row["cnt"] if row else 0

    async def delete_older_than(
        self, conversation_id: str, keep_recent: int
    ) -> int:
        """Delete old messages after summarization. Returns number of rows deleted."""
        async with db_connection() as conn:
            cursor = await conn.execute(
                """
                DELETE FROM messages
                WHERE conversation_id = ?
                  AND id NOT IN (
                      SELECT id FROM messages
                      WHERE conversation_id = ?
                      ORDER BY timestamp DESC
                      LIMIT ?
                  )
                """,
                (conversation_id, conversation_id, keep_recent),
            )
            await conn.commit()
        deleted = cursor.rowcount
        if deleted > 0:
            logger.info(
                f"Pruned {deleted} old messages from conversation {conversation_id}"
            )
        return deleted

    async def remove_last(self, conversation_id: str) -> bool:
        """Remove the last message (used on cancelled/failed generation)."""
        async with db_connection() as conn:
            cursor = await conn.execute(
                """
                DELETE FROM messages
                WHERE id = (
                    SELECT id FROM messages
                    WHERE conversation_id = ?
                    ORDER BY timestamp DESC
                    LIMIT 1
                )
                """,
                (conversation_id,),
            )
            await conn.commit()
        return cursor.rowcount > 0
