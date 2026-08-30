# ==============================================================================
# FILE: backend/communication/websocket.py
# WHAT THIS FILE IS: Real-Time Event & Stream WebSocket Protocol Driver.
# WHY IT IS USED: Separates WebSocket client lifecycle, connection handling, 
#                 message parsing, and token streaming from API router business logic.
# ==============================================================================

import json
from fastapi import WebSocket, WebSocketDisconnect
from websocket_manager import manager
from llm_service import llm_service

class WebSocketHandler:
    """Handles WebSocket connection lifecycles and real-time streaming sessions."""

    @staticmethod
    async def handle_events_stream(websocket: WebSocket):
        """Dedicated WebSocket handler for live events, notifications, and real-time AI streaming."""
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
