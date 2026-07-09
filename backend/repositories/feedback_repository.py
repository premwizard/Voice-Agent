import logging
from datetime import datetime, timezone
from typing import List, Optional

from database.db import db_connection
from database.models import Feedback

logger = logging.getLogger(__name__)

_DT_FMT = "%Y-%m-%dT%H:%M:%S.%f"

def _now_iso() -> str:
    return datetime.now(timezone.utc).strftime(_DT_FMT)

def _row_to_feedback(row) -> Feedback:
    return Feedback(
        id=row["id"],
        workspace_id=row["workspace_id"],
        trace_id=row["trace_id"],
        rating=row["rating"],
        comment=row["comment"],
        created_at=datetime.strptime(row["created_at"], _DT_FMT),
    )

class FeedbackRepository:
    async def create(self, feedback: Feedback) -> Feedback:
        now = _now_iso()
        async with db_connection() as conn:
            await conn.execute(
                """
                INSERT INTO feedback (id, workspace_id, trace_id, rating, comment, created_at)
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                (feedback.id, feedback.workspace_id, feedback.trace_id, feedback.rating, feedback.comment, now)
            )
            await conn.commit()
        return feedback

    async def get_by_trace(self, trace_id: str) -> Optional[Feedback]:
        async with db_connection() as conn:
            cursor = await conn.execute("SELECT * FROM feedback WHERE trace_id = ?", (trace_id,))
            row = await cursor.fetchone()
        return _row_to_feedback(row) if row else None
