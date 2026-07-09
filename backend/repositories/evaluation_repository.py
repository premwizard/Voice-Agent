import logging
import uuid
import json
from datetime import datetime, timezone
from typing import List, Optional

from database.db import db_connection
from database.models import Evaluation

logger = logging.getLogger(__name__)

_DT_FMT = "%Y-%m-%dT%H:%M:%S.%f"

def _now_iso() -> str:
    return datetime.now(timezone.utc).strftime(_DT_FMT)

def _row_to_eval(row) -> Evaluation:
    return Evaluation(
        id=row["id"],
        workspace_id=row["workspace_id"],
        trace_id=row["trace_id"],
        metrics=row["metrics"],
        created_at=datetime.strptime(row["created_at"], _DT_FMT),
    )

class EvaluationRepository:
    async def create(self, evaluation: Evaluation) -> Evaluation:
        now = _now_iso()
        async with db_connection() as conn:
            await conn.execute(
                """
                INSERT INTO evaluations (id, workspace_id, trace_id, metrics, created_at)
                VALUES (?, ?, ?, ?, ?)
                """,
                (evaluation.id, evaluation.workspace_id, evaluation.trace_id, evaluation.metrics, now)
            )
            await conn.commit()
        return evaluation

    async def get_by_trace(self, trace_id: str) -> Optional[Evaluation]:
        async with db_connection() as conn:
            cursor = await conn.execute("SELECT * FROM evaluations WHERE trace_id = ?", (trace_id,))
            row = await cursor.fetchone()
        return _row_to_eval(row) if row else None
