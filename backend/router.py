# ==============================================================================
# FILE: backend/router.py
# WHAT THIS FILE IS: API Router Module supporting REST, SSE Streaming, and WebSockets.
# WHY IT IS USED: Serves as the central API declaration connecting routes to thin controllers
#                 and protocol drivers without hosting inline business logic.
# ==============================================================================

from fastapi import APIRouter, WebSocket
from config import settings
from api.schemas.command_schema import CommandRequest
from api.schemas.chat_schema import ChatRequest
from api.schemas.system_schema import SystemActionRequest, TTSRequest
from api.controllers.system_controller import system_controller
from api.controllers.command_controller import command_controller
from api.controllers.chat_controller import chat_controller
from communication.websocket import WebSocketHandler

# Create APIRouter instance
router = APIRouter(prefix="/api/v1", tags=["system"])

# ------------------------------------------------------------------------------
# Health & Configuration Endpoints
# ------------------------------------------------------------------------------

@router.get("/health")
def get_health():
    """Returns server operational status and active AI provider configuration."""
    return {
        "status": "healthy",
        "environment": settings.ENVIRONMENT,
        "ai_provider": settings.AI_PROVIDER
    }

@router.get("/config/public")
def get_public_config():
    """Returns public configuration metadata for frontend consumption."""
    return {
        "ai_provider": settings.AI_PROVIDER,
        "environment": settings.ENVIRONMENT
    }

# ------------------------------------------------------------------------------
# System & Telemetry Endpoints
# ------------------------------------------------------------------------------

@router.get("/system/telemetry")
def get_telemetry_endpoint():
    """Fetches real-time system hardware status telemetry."""
    return system_controller.get_telemetry()

@router.post("/system/action")
def execute_system_action(request: SystemActionRequest):
    """Executes a direct registered system action by name."""
    return system_controller.execute_action(request)

@router.post("/voice/tts")
async def generate_tts_endpoint(request: TTSRequest):
    """Streams Edge-TTS neural speech audio for the requested text."""
    return await system_controller.generate_tts(request)

# ------------------------------------------------------------------------------
# High-Speed REST Command Endpoint (<50ms execution)
# ------------------------------------------------------------------------------

@router.post("/commands")
def execute_command_endpoint(request: CommandRequest):
    """
    Fast-Path REST Command execution.
    Executes high-confidence local tool calls in <50ms without LLM latency.
    """
    return command_controller.execute_command(request)

# ------------------------------------------------------------------------------
# Server-Sent Events (SSE) AI Response Streaming Endpoint
# ------------------------------------------------------------------------------

@router.post("/chat/stream")
async def sse_chat_stream_endpoint(request: ChatRequest):
    """Streams AI response text tokens progressively over Server-Sent Events (SSE)."""
    return await chat_controller.stream_chat(request)

# ------------------------------------------------------------------------------
# Real-Time Events WebSocket Endpoint
# ------------------------------------------------------------------------------

@router.websocket("/ws/events")
@router.websocket("/ws/stream")
async def websocket_events_endpoint(websocket: WebSocket):
    """WebSocket dedicated to live background events, notifications, and real-time state broadcasts."""
    await WebSocketHandler.handle_events_stream(websocket)
