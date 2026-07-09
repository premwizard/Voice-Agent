import logging
import json
from datetime import datetime, timezone
from typing import List, Optional

from database.db import db_connection
from database.models import Trace

logger = logging.getLogger(__name__)

_DT_FMT = "%Y-%m-%dT%H:%M:%S.%f"

def _now_iso() -> str:
    return datetime.now(timezone.utc).strftime(_DT_FMT)

def _row_to_trace(row) -> Trace:
    return Trace(
        id=row["id"],
        workspace_id=row["workspace_id"],
        conversation_id=row["conversation_id"],
        request_id=row["request_id"],
        timestamp=datetime.strptime(row["timestamp"], _DT_FMT),
        total_latency_ms=row["total_latency_ms"],
        total_tokens=row["total_tokens"],
        cost=row["cost"],
        status=row["status"],
        trace_data=row["trace_data"],
        created_at=datetime.strptime(row["created_at"], _DT_FMT),
    )

class TraceRepository:
    async def create(self, trace: Trace) -> Trace:
        now = _now_iso()
        timestamp_str = trace.timestamp.strftime(_DT_FMT)
        async with db_connection() as conn:
            await conn.execute(
                """
                INSERT INTO traces (
                    id, workspace_id, conversation_id, request_id, timestamp,
                    total_latency_ms, total_tokens, cost, status, trace_data, created_at
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    trace.id, trace.workspace_id, trace.conversation_id, trace.request_id,
                    timestamp_str, trace.total_latency_ms, trace.total_tokens,
                    trace.cost, trace.status, trace.trace_data, now
                )
            )
            await conn.commit()
        return trace

    async def get(self, trace_id: str) -> Optional[Trace]:
        async with db_connection() as conn:
            cursor = await conn.execute("SELECT * FROM traces WHERE id = ?", (trace_id,))
            row = await cursor.fetchone()
        return _row_to_trace(row) if row else None

    async def get_by_conversation(self, conversation_id: str, limit: int = 50) -> List[Trace]:
        async with db_connection() as conn:
            cursor = await conn.execute(
                "SELECT * FROM traces WHERE conversation_id = ? ORDER BY timestamp DESC LIMIT ?",
                (conversation_id, limit)
            )
            rows = await cursor.fetchall()
        return [_row_to_trace(r) for r in rows]

    async def list_recent(self, workspace_id: str, limit: int = 100) -> List[Trace]:
        async with db_connection() as conn:
            cursor = await conn.execute(
                "SELECT * FROM traces WHERE workspace_id = ? ORDER BY timestamp DESC LIMIT ?",
                (workspace_id, limit)
            )
            rows = await cursor.fetchall()
        return [_row_to_trace(r) for r in rows]
