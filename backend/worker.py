import os
import asyncio
from celery import Celery
import logging

logger = logging.getLogger(__name__)

redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/0")

celery_app = Celery(
    "ai_platform_worker",
    broker=redis_url,
    backend=redis_url
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
)

@celery_app.task(name="evaluate_trace_task")
def evaluate_trace_task(trace_id: str, workspace_id: str, user_input: str, assistant_response: str):
    """
    Background task to run LLM-as-a-judge evaluation.
    We run this synchronously in the Celery worker, wrapping the async service call.
    """
    logger.info(f"Running evaluation task for trace {trace_id}")
    
    # Lazy import to avoid circular dependencies and ensure DB initializes correctly
    from services.evaluation_service import evaluation_service
    
    loop = asyncio.get_event_loop()
    if loop.is_closed():
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        
    loop.run_until_complete(
        evaluation_service.evaluate_trace(trace_id, workspace_id, user_input, assistant_response)
    )
    return True
