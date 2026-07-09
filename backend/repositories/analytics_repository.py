import logging
from typing import Dict, Any, List
from datetime import datetime, timedelta, timezone

from database.db import db_connection

logger = logging.getLogger(__name__)

class AnalyticsRepository:
    async def get_overview_metrics(self, workspace_id: str, days: int = 7) -> Dict[str, Any]:
        """Aggregate high-level metrics over a time period."""
        cutoff_date = (datetime.now(timezone.utc) - timedelta(days=days)).isoformat()
        
        async with db_connection() as conn:
            cursor = await conn.execute(
                """
                SELECT 
                    COUNT(id) as total_requests,
                    SUM(total_tokens) as total_tokens,
                    SUM(cost) as total_cost,
                    AVG(total_latency_ms) as avg_latency
                FROM traces 
                WHERE workspace_id = ? AND timestamp >= ?
                """,
                (workspace_id, cutoff_date)
            )
            row = await cursor.fetchone()
            
            # Error rate
            cursor_errors = await conn.execute(
                """
                SELECT COUNT(id) as error_count
                FROM traces
                WHERE workspace_id = ? AND timestamp >= ? AND status = 'error'
                """,
                (workspace_id, cutoff_date)
            )
            error_row = await cursor_errors.fetchone()
            
        total_requests = row["total_requests"] or 0
        error_count = error_row["error_count"] or 0
        success_rate = ((total_requests - error_count) / total_requests * 100) if total_requests > 0 else 100.0

        return {
            "total_requests": total_requests,
            "total_tokens": row["total_tokens"] or 0,
            "total_cost": round(row["total_cost"] or 0.0, 4),
            "avg_latency_ms": round(row["avg_latency"] or 0.0, 2),
            "success_rate_percent": round(success_rate, 2)
        }

    async def get_daily_trends(self, workspace_id: str, days: int = 7) -> List[Dict[str, Any]]:
        """Get daily aggregation for charting."""
        cutoff_date = (datetime.now(timezone.utc) - timedelta(days=days)).isoformat()
        
        async with db_connection() as conn:
            cursor = await conn.execute(
                """
                SELECT 
                    substr(timestamp, 1, 10) as date,
                    COUNT(id) as requests,
                    SUM(total_tokens) as tokens,
                    SUM(cost) as cost
                FROM traces
                WHERE workspace_id = ? AND timestamp >= ?
                GROUP BY date
                ORDER BY date ASC
                """,
                (workspace_id, cutoff_date)
            )
            rows = await cursor.fetchall()
            
        return [dict(r) for r in rows]
