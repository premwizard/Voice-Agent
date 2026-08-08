# ==============================================================================
# FILE: router.py
# WHAT THIS FILE IS: API Router Module for HTTP Endpoints and WebSockets.
# WHY IT IS USED: Exposes system endpoints, telemetry metrics, system tool execution,
#                 and real-time WebSocket streaming with tool calling support.
# ==============================================================================

import json
from typing import Dict, Any, Optional
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from pydantic import BaseModel
from config import settings
from websocket_manager import manager
from llm_service import llm_service
from tools.tool_registry import tool_registry
from tools.system_control import get_detailed_telemetry

# Create APIRouter instance with prefix '/api/v1'
router = APIRouter(prefix="/api/v1", tags=["system"])

# Define Pydantic models for API request bodies
class ChatRequest(BaseModel):
    prompt: str
    user_confirmed: Optional[bool] = False

class SystemActionRequest(BaseModel):
    action: str
    args: Optional[Dict[str, Any]] = None
    user_confirmed: Optional[bool] = False

# GET route for health check
@router.get("/health")
def get_health():
    return {
        "status": "healthy",
        "environment": settings.ENVIRONMENT,
        "ai_provider": settings.AI_PROVIDER
    }

# GET route for public config
@router.get("/config/public")
def get_public_config():
    return {
        "ai_provider": settings.AI_PROVIDER,
        "environment": settings.ENVIRONMENT
    }

# GET endpoint for real-time telemetry
@router.get("/system/telemetry")
def get_telemetry_endpoint():
    """Returns real-time system metrics (CPU, RAM, Disk, Battery)."""
    return get_detailed_telemetry()

# POST endpoint to execute direct system control actions
@router.post("/system/action")
def execute_system_action(request: SystemActionRequest):
    """Executes a system control tool by action name with permission checks."""
    action_args = request.args or {}
    result = tool_registry.execute(request.action, user_confirmed=request.user_confirmed or False, **action_args)
    return {"action": request.action, "result": result}

# POST REST endpoint for testing AI response
@router.post("/chat")
async def rest_chat(request: ChatRequest):
    """
    HTTP POST REST endpoint to test AI response directly.
    """
    response_tokens = []
    async for token_chunk in llm_service.stream_response(request.prompt, user_confirmed=request.user_confirmed or False):
        response_tokens.append(token_chunk)
    
    full_response = "".join(response_tokens)
    return {
        "prompt": request.prompt,
        "ai_provider": settings.AI_PROVIDER,
        "model": settings.OPENROUTER_MODEL,
        "response": full_response
    }

# WebSocket endpoint for real-time bi-directional streaming
@router.websocket("/ws/stream")
async def websocket_chat_endpoint(websocket: WebSocket):
    """
    Real-time WebSocket endpoint that accepts client connections and streams AI text tokens.
    """
    await manager.connect(websocket)
    
    try:
        await manager.send_personal_message("Connected to Voice Agent AI WebSocket server!", websocket)
        
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
