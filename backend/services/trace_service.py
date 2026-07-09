import asyncio
import time
import uuid
import json
import logging
from contextvars import ContextVar
from typing import Dict, List, Any, Optional
from datetime import datetime, timezone

from repositories.trace_repository import TraceRepository
from database.models import Trace

logger = logging.getLogger(__name__)

# Context variables for distributed tracing within the same async process
_current_trace: ContextVar[Optional[Dict[str, Any]]] = ContextVar("_current_trace", default=None)
_current_span: ContextVar[Optional[Dict[str, Any]]] = ContextVar("_current_span", default=None)

_trace_repo = TraceRepository()

class TraceService:
    def __init__(self):
        pass

    def start_trace(self, workspace_id: str, conversation_id: str, request_id: str = None) -> None:
        """Starts a new trace context for the current request lifecycle."""
        if not request_id:
            request_id = str(uuid.uuid4())
        
        trace_data = {
            "id": str(uuid.uuid4()),
            "workspace_id": workspace_id,
            "conversation_id": conversation_id,
            "request_id": request_id,
            "timestamp": datetime.now(timezone.utc),
            "start_time": time.time(),
            "spans": [],
            "total_tokens": 0,
            "cost": 0.0,
            "status": "running"
        }
        _current_trace.set(trace_data)
        _current_span.set(None)
        logger.debug(f"Started trace {trace_data['id']} for request {request_id}")

    async def end_trace(self, status: str = "success") -> Optional[Trace]:
        """Ends the current trace and persists it to the database."""
        trace_data = _current_trace.get()
        if not trace_data:
            return None

        total_latency_ms = (time.time() - trace_data["start_time"]) * 1000
        
        trace = Trace(
            id=trace_data["id"],
            workspace_id=trace_data["workspace_id"],
            conversation_id=trace_data["conversation_id"],
            request_id=trace_data["request_id"],
            timestamp=trace_data["timestamp"],
            total_latency_ms=total_latency_ms,
            total_tokens=trace_data["total_tokens"],
            cost=trace_data["cost"],
            status=status,
            trace_data=json.dumps(trace_data["spans"])
        )
        
        try:
            await _trace_repo.create(trace)
            logger.info(f"Persisted trace {trace.id} with latency {total_latency_ms:.2f}ms")
        except Exception as e:
            logger.error(f"Failed to persist trace {trace.id}: {e}")

        # Clear context
        _current_trace.set(None)
        _current_span.set(None)
        return trace

    class Span:
        """Context manager for tracing individual operations (e.g. LLM calls, Agent execution)."""
        def __init__(self, name: str, metadata: dict = None):
            self.name = name
            self.metadata = metadata or {}
            self.start_time = None
            self.parent_span = _current_span.get()
            self.span_data = None

        def __enter__(self):
            trace_data = _current_trace.get()
            if not trace_data:
                return self # No active trace

            self.start_time = time.time()
            self.span_data = {
                "id": str(uuid.uuid4()),
                "name": self.name,
                "parent_id": self.parent_span["id"] if self.parent_span else None,
                "start_time": self.start_time,
                "end_time": None,
                "latency_ms": None,
                "metadata": self.metadata,
                "error": None
            }
            trace_data["spans"].append(self.span_data)
            _current_span.set(self.span_data)
            return self

        def __exit__(self, exc_type, exc_val, exc_tb):
            if not self.span_data:
                return

            end_time = time.time()
            self.span_data["end_time"] = end_time
            self.span_data["latency_ms"] = (end_time - self.start_time) * 1000

            if exc_type:
                self.span_data["error"] = str(exc_val)
                trace_data = _current_trace.get()
                if trace_data:
                    trace_data["status"] = "error"

            _current_span.set(self.parent_span)

    def add_token_usage(self, tokens: int, cost: float):
        trace_data = _current_trace.get()
        if trace_data:
            trace_data["total_tokens"] += tokens
            trace_data["cost"] += cost

trace_service = TraceService()
