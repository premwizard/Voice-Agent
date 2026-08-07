# ==============================================================================
# FILE: router.py
# WHAT THIS FILE IS: API Router Module for HTTP Endpoints and WebSockets.
# WHY IT IS USED: Contains all endpoint definitions (health check, config, 
#                 REST AI chat, system control, telemetry, and WebSocket streaming) 
#                 grouped cleanly under an APIRouter.
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

# Create an APIRouter instance with a prefix '/api/v1' for API routes
router = APIRouter(prefix="/api/v1", tags=["system"])

# Define Pydantic models for API request bodies
class ChatRequest(BaseModel):
    prompt: str

class SystemActionRequest(BaseModel):
    action: str
    args: Optional[Dict[str, Any]] = None

# Define a GET route for checking server health status
@router.get("/health")
def get_health():
    return {
        "status": "healthy",
        "environment": settings.ENVIRONMENT,
        "ai_provider": settings.AI_PROVIDER
    }

# Define a GET route for exposing public system configurations
@router.get("/config/public")
def get_public_config():
    return {
        "ai_provider": settings.AI_PROVIDER,
        "environment": settings.ENVIRONMENT
    }

# GET endpoint to fetch live system telemetry metrics
@router.get("/system/telemetry")
def get_telemetry_endpoint():
    """Returns detailed real-time system metrics (CPU, RAM, Disk, Battery, Network)."""
    return get_detailed_telemetry()

# POST endpoint to execute direct system control actions from dashboard
@router.post("/system/action")
def execute_system_action(request: SystemActionRequest):
    """Executes a system control tool by action name."""
    action_args = request.args or {}
    result = tool_registry.execute(request.action, **action_args)
    return {"action": request.action, "result": result}

# Define a POST REST endpoint for testing AI response via standard HTTP curl
@router.post("/chat")
async def rest_chat(request: ChatRequest):
    """
    HTTP POST REST endpoint to test AI response directly using standard curl requests.
    """
    response_tokens = []
    async for token_chunk in llm_service.stream_response(request.prompt):
        response_tokens.append(token_chunk)
    
    full_response = "".join(response_tokens)
    return {
        "prompt": request.prompt,
        "ai_provider": settings.AI_PROVIDER,
        "model": settings.OPENROUTER_MODEL,
        "response": full_response
    }

# Define a WebSocket endpoint for real-time bi-directional streaming communication with AI
@router.websocket("/ws/stream")
async def websocket_chat_endpoint(websocket: WebSocket):
    """
    Real-time WebSocket endpoint that accepts client connections, listens for 
    incoming text prompts or JSON payloads, and streams AI generated text tokens back in real time.
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
            try:
                data = json.loads(raw_data)
                if isinstance(data, dict):
                    prompt = data.get("prompt", raw_data)
                    history = data.get("history", None)
                    model = data.get("model", None)
                    system_prompt = data.get("system_prompt", None)
            except Exception:
                pass
            
            async for token_chunk in llm_service.stream_response(prompt, history, model, system_prompt):
                await manager.send_personal_message(token_chunk, websocket)
            
            await manager.send_personal_message("[END_OF_STREAM]", websocket)
    except WebSocketDisconnect:
        manager.disconnect(websocket)
