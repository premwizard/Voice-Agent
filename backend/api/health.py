from fastapi import APIRouter
from pydantic import BaseModel
import psutil
import os

from services.redis_service import redis_service
from database.db import get_db, db_connection

router = APIRouter(prefix="/api/health", tags=["health"])

class HealthResponse(BaseModel):
    status: str
    database: str
    redis: str
    celery: str
    cpu_usage: float
    memory_usage: float

@router.get("/", response_model=HealthResponse)
async def system_health():
    db_status = "ok"
    try:
        async with db_connection() as conn:
            await conn.execute("SELECT 1")
    except Exception as e:
        db_status = f"error: {str(e)}"
        
    redis_status = "ok" if redis_service.client else "disconnected"
    
    # Check celery (just check if redis broker is up for now)
    celery_status = "ok" if redis_service.client else "broker_down"

    return HealthResponse(
        status="ok" if db_status == "ok" and redis_status == "ok" else "degraded",
        database=db_status,
        redis=redis_status,
        celery=celery_status,
        cpu_usage=psutil.cpu_percent(),
        memory_usage=psutil.virtual_memory().percent
    )
