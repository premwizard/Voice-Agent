# ==============================================================================
# FILE: router.py
# WHAT THIS FILE IS: API Router Module for HTTP Endpoints and WebSockets.
# WHY IT IS USED: Contains all endpoint definitions (health check, config, 
#                 REST AI chat, and real-time AI WebSocket streaming chat) 
#                 grouped cleanly under an APIRouter.
# ==============================================================================

# Import APIRouter for grouping endpoints and WebSocketDisconnect for catching closed sockets
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
# Import BaseModel for JSON request body validation
from pydantic import BaseModel
# Import settings object to access configuration variables like ENVIRONMENT and AI_PROVIDER
from config import settings
# Import global websocket manager instance to manage socket connections
from websocket_manager import manager
# Import global LLM service instance for AI streaming
from llm_service import llm_service

# Create an APIRouter instance with a prefix '/api/v1' for API routes
router = APIRouter(prefix="/api/v1", tags=["system"])

# Define a Pydantic model for REST chat requests
class ChatRequest(BaseModel):
    prompt: str

# Define a GET route for checking server health status
@router.get("/health")
def get_health():
    # Return a JSON response containing server status and active AI provider info
    return {
        "status": "healthy",
        "environment": settings.ENVIRONMENT,
        "ai_provider": settings.AI_PROVIDER
    }

# Define a GET route for exposing public system configurations
@router.get("/config/public")
def get_public_config():
    # Return JSON containing non-sensitive configuration settings
    return {
        "ai_provider": settings.AI_PROVIDER,
        "environment": settings.ENVIRONMENT
    }

# Define a POST REST endpoint for testing AI response via standard HTTP curl
@router.post("/chat")
async def rest_chat(request: ChatRequest):
    """
    HTTP POST REST endpoint to test AI response directly using standard curl requests.
    """
    response_tokens = []
    # Collect streamed tokens from LLM service into a complete response string
    async for token_chunk in llm_service.stream_response(request.prompt):
        response_tokens.append(token_chunk)
    
    full_response = "".join(response_tokens)
    return {
        "prompt": request.prompt,
        "ai_provider": settings.AI_PROVIDER,
        "model": settings.OPENROUTER_MODEL,
        "response": full_response
    }

import json

# Define a WebSocket endpoint for real-time bi-directional streaming communication with AI
@router.websocket("/ws/stream")
async def websocket_chat_endpoint(websocket: WebSocket):
    """
    Real-time WebSocket endpoint that accepts client connections, listens for 
    incoming text prompts or JSON payloads, and streams AI generated text tokens back in real time.
    """
    # Step 1: Accept incoming socket connection and register with connection manager
    await manager.connect(websocket)
    
    try:
        # Step 2: Send welcome message confirming socket connection is open
        await manager.send_personal_message("Connected to Voice Agent AI WebSocket server!", websocket)
        
        # Step 3: Enter an infinite loop to receive and process incoming prompts
        while True:
            # Wait asynchronously for the client to send a text prompt or JSON string
            raw_data = await websocket.receive_text()
            prompt = raw_data
            history = None

            # Parse JSON if payload contains structured prompt and conversation history
            try:
                data = json.loads(raw_data)
                if isinstance(data, dict):
                    prompt = data.get("prompt", raw_data)
                    history = data.get("history", None)
            except Exception:
                pass
            
            # Step 4: Stream response tokens directly from LLM service token-by-token with history
            async for token_chunk in llm_service.stream_response(prompt, history):
                # Transmit each AI token chunk over the WebSocket to the client instantly
                await manager.send_personal_message(token_chunk, websocket)
            
            # Step 5: Send end marker to signal stream completion
            await manager.send_personal_message("[END_OF_STREAM]", websocket)
    except WebSocketDisconnect:
        # Step 5: Clean up and unregister socket connection when client disconnects
        manager.disconnect(websocket)
