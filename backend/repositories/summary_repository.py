"""
SummaryRepository — store and retrieve rolling conversation summaries.
"""

import uuid
import logging
from datetime import datetime, timezone
from typing import List, Optional

from database.db import db_connection
from database.models import Summary

logger = logging.getLogger(__name__)

_DT_FMT = "%Y-%m-%dT%H:%M:%S.%f"


def _now_iso() -> str:
    return datetime.now(timezone.utc).strftime(_DT_FMT)


def _row_to_summary(row) -> Summary:
    return Summary(
        id=row["id"],
        conversation_id=row["conversation_id"],
        content=row["content"],
        message_count_at_summary=row["message_count_at_summary"],
        created_at=datetime.strptime(row["created_at"], _DT_FMT),
    )


class SummaryRepository:

    async def save(
        self,
        conversation_id: str,
        content: str,
        message_count_at_summary: int,
    ) -> Summary:
        summary_id = str(uuid.uuid4())
        now = _now_iso()
        async with db_connection() as conn:
            await conn.execute(
                """
                INSERT INTO summaries (id, conversation_id, content, message_count_at_summary, created_at)
                VALUES (?, ?, ?, ?, ?)
                """,
                (summary_id, conversation_id, content, message_count_at_summary, now),
            )
            await conn.commit()
        logger.info(f"Saved summary for conversation {conversation_id}")
        return Summary(
            id=summary_id,
            conversation_id=conversation_id,
            content=content,
            message_count_at_summary=message_count_at_summary,
            created_at=datetime.strptime(now, _DT_FMT),
        )

    async def get_latest(self, conversation_id: str) -> Optional[Summary]:
        async with db_connection() as conn:
            cursor = await conn.execute(
                """
                SELECT * FROM summaries
                WHERE conversation_id = ?
                ORDER BY created_at DESC
                LIMIT 1
                """,
                (conversation_id,),
            )
            row = await cursor.fetchone()
        return _row_to_summary(row) if row else None

    async def list_all(self, conversation_id: str) -> List[Summary]:
        async with db_connection() as conn:
            cursor = await conn.execute(
                """
                SELECT * FROM summaries
                WHERE conversation_id = ?
                ORDER BY created_at ASC
                """,
                (conversation_id,),
            )
            rows = await cursor.fetchall()
        return [_row_to_summary(r) for r in rows]

    async def delete_all(self, conversation_id: str) -> None:
        async with db_connection() as conn:
            await conn.execute(
                "DELETE FROM summaries WHERE conversation_id = ?",
                (conversation_id,),
            )
            await conn.commit()
