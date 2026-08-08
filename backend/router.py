# ==============================================================================
# FILE: backend/router.py
# WHAT THIS FILE IS: API Router Module supporting REST, SSE Streaming, and WebSockets.
# WHY IT IS USED: Provides a multi-channel hybrid architecture:
#                 - REST (/commands, /system/action) for fast local tool calls (<50ms)
#                 - SSE (/chat/stream) for token-by-token AI response streaming
#                 - WebSocket (/ws/events) for real-time background task events & notifications.
# ==============================================================================

import io
import json
import asyncio
from typing import Dict, Any, Optional, List
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from config import settings
from websocket_manager import manager
from llm_service import llm_service
from tools.tool_registry import tool_registry
from tools.system_control import get_detailed_telemetry
from core.command_router import command_router

# Create APIRouter instance
router = APIRouter(prefix="/api/v1", tags=["system"])

# Request models
class CommandRequest(BaseModel):
    prompt: str
    request_id: Optional[str] = None
    user_confirmed: Optional[bool] = False

class ChatRequest(BaseModel):
    prompt: str
    history: Optional[List[Dict[str, str]]] = None
    model: Optional[str] = None
    system_prompt: Optional[str] = None
    user_confirmed: Optional[bool] = False

class SystemActionRequest(BaseModel):
    action: str
    args: Optional[Dict[str, Any]] = None
    user_confirmed: Optional[bool] = False

# Deduplication cache for request_id to prevent double submissions
PROCESSED_REQUEST_IDS: set = set()

# Health check
@router.get("/health")
def get_health():
    return {
        "status": "healthy",
        "environment": settings.ENVIRONMENT,
        "ai_provider": settings.AI_PROVIDER
    }

# Public config
@router.get("/config/public")
def get_public_config():
    return {
        "ai_provider": settings.AI_PROVIDER,
        "environment": settings.ENVIRONMENT
    }

# System telemetry
@router.get("/system/telemetry")
def get_telemetry_endpoint():
    return get_detailed_telemetry()

# Direct System Action
@router.post("/system/action")
def execute_system_action(request: SystemActionRequest):
    action_args = request.args or {}
    result = tool_registry.execute(request.action, user_confirmed=request.user_confirmed or False, **action_args)
    return {"action": request.action, "result": result}

# Neural TTS Voice Endpoint (Edge-TTS MP3 Audio Streaming)
class TTSRequest(BaseModel):
    text: str
    voice: Optional[str] = "en-US-ChristopherNeural"

@router.post("/voice/tts")
async def generate_tts_endpoint(request: TTSRequest):
    from tts_service import tts_service
    audio_bytes = await tts_service.generate_speech_audio(request.text, request.voice)
    if not audio_bytes:
        return {"error": "Failed to generate TTS audio"}
    return StreamingResponse(io.BytesIO(audio_bytes), media_type="audio/mpeg")

# 1. High-Speed REST Command Endpoint (<50ms execution for local commands)
@router.post("/commands")
def execute_command_endpoint(request: CommandRequest):
    """
    Fast-Path REST Command execution.
    If intent is local (volume, brightness, launch app, stats), executes immediately
    and returns in <50ms without waiting for LLM network latency.
    """
    # Deduplicate request_id
    if request.request_id:
        if request.request_id in PROCESSED_REQUEST_IDS:
            return {"status": "ignored", "reason": "Duplicate request_id"}
        PROCESSED_REQUEST_IDS.add(request.request_id)
        if len(PROCESSED_REQUEST_IDS) > 1000:
            PROCESSED_REQUEST_IDS.clear()

    routed_res = command_router.classify_and_route(request.prompt, user_confirmed=request.user_confirmed or False)
    return routed_res

# 2. Server-Sent Events (SSE) AI Response Streaming Endpoint
@router.post("/chat/stream")
async def sse_chat_stream_endpoint(request: ChatRequest):
    """
    Streams AI response text tokens progressively over Server-Sent Events (SSE).
    """
    async def sse_generator():
        try:
            async for token_chunk in llm_service.stream_response(
                request.prompt, 
                history=request.history, 
                model=request.model, 
                system_prompt=request.system_prompt, 
                user_confirmed=request.user_confirmed or False
            ):
                payload = json.dumps({"token": token_chunk})
                yield f"data: {payload}\n\n"
            
            yield "data: [DONE]\n\n"
        except Exception as e:
            err_payload = json.dumps({"error": str(e)})
            yield f"data: {err_payload}\n\n"

    return StreamingResponse(sse_generator(), media_type="text/event-stream")

# 3. Real-Time Events WebSocket Endpoint (Task Progress, Notifications, Live State)
@router.websocket("/ws/events")
@router.websocket("/ws/stream")
async def websocket_events_endpoint(websocket: WebSocket):
    """
    WebSocket dedicated to live background events, notifications, and real-time state broadcasts.
    """
    await manager.connect(websocket)
    try:
        await manager.send_personal_message(json.dumps({
            "event": "connected",
            "message": "Connected to Phoenix AI Events WebSocket stream."
        }), websocket)
        
        while True:
            raw_data = await websocket.receive_text()
            prompt = raw_data
            history = None
            model = None
            system_prompt = None
            user_confirmed = False

            try:
                data = json.loads(raw_data)
                if isinstance(data, dict):
                    prompt = data.get("prompt", raw_data)
                    history = data.get("history", None)
                    model = data.get("model", None)
                    system_prompt = data.get("system_prompt", None)
                    user_confirmed = data.get("user_confirmed", False)
            except Exception:
                pass
            
            async for token_chunk in llm_service.stream_response(
                prompt, history=history, model=model, system_prompt=system_prompt, user_confirmed=user_confirmed
            ):
                await manager.send_personal_message(token_chunk, websocket)
            
            await manager.send_personal_message("[END_OF_STREAM]", websocket)

    except WebSocketDisconnect:
        manager.disconnect(websocket)
