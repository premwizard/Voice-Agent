import uuid
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel

from middleware.auth import get_current_workspace
from repositories.trace_repository import TraceRepository
from repositories.analytics_repository import AnalyticsRepository
from repositories.feedback_repository import FeedbackRepository
from database.models import Feedback

router = APIRouter(prefix="/api/observability", tags=["observability"])

_trace_repo = TraceRepository()
_analytics_repo = AnalyticsRepository()
_feedback_repo = FeedbackRepository()

class FeedbackRequest(BaseModel):
    trace_id: str
    rating: int
    comment: Optional[str] = None

class FeedbackResponse(BaseModel):
    id: str
    trace_id: str
    rating: int
    status: str

@router.get("/traces")
async def list_traces(limit: int = 100, workspace_id: str = Depends(get_current_workspace)):
    traces = await _trace_repo.list_recent(workspace_id, limit)
    return [
        {
            "id": t.id,
            "conversation_id": t.conversation_id,
            "request_id": t.request_id,
            "timestamp": t.timestamp.isoformat(),
            "total_latency_ms": t.total_latency_ms,
            "total_tokens": t.total_tokens,
            "cost": t.cost,
            "status": t.status,
            "created_at": t.created_at.isoformat()
        }
        for t in traces
    ]

@router.get("/traces/{trace_id}")
async def get_trace(trace_id: str, workspace_id: str = Depends(get_current_workspace)):
    trace = await _trace_repo.get(trace_id)
    if not trace or trace.workspace_id != workspace_id:
        raise HTTPException(status_code=404, detail="Trace not found")
    
    import json
    return {
        "id": trace.id,
        "conversation_id": trace.conversation_id,
        "request_id": trace.request_id,
        "timestamp": trace.timestamp.isoformat(),
        "total_latency_ms": trace.total_latency_ms,
        "total_tokens": trace.total_tokens,
        "cost": trace.cost,
        "status": trace.status,
        "spans": json.loads(trace.trace_data),
        "created_at": trace.created_at.isoformat()
    }

@router.get("/analytics")
async def get_analytics(days: int = Query(7, le=30), workspace_id: str = Depends(get_current_workspace)):
    from services.analytics_service import analytics_service
    return await analytics_service.get_dashboard_metrics(workspace_id, days)

@router.post("/feedback", response_model=FeedbackResponse)
async def submit_feedback(req: FeedbackRequest, workspace_id: str = Depends(get_current_workspace)):
    feedback = Feedback(
        id=str(uuid.uuid4()),
        workspace_id=workspace_id,
        trace_id=req.trace_id,
        rating=req.rating,
        comment=req.comment
    )
    await _feedback_repo.create(feedback)
    return FeedbackResponse(id=feedback.id, trace_id=feedback.trace_id, rating=feedback.rating, status="success")
