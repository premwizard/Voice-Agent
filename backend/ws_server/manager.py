from fastapi import WebSocket, WebSocketDisconnect
from schemas.ws import WSMessage
from providers import get_provider
from memory.session import SessionMemory
from config.settings import settings
import json
import logging
import asyncio

logger = logging.getLogger(__name__)

class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []
        # Store memory per connection/conversation_id
        self.memories: dict[str, SessionMemory] = {}

    async def connect(self, websocket: WebSocket, conversation_id: str):
        await websocket.accept()
        self.active_connections.append(websocket)
        self.memories[conversation_id] = SessionMemory()
        
        # Send CONNECTED status
        await self.send_message(
            websocket,
            WSMessage(type="CONNECTED", conversation_id=conversation_id).model_dump_json()
        )

    def disconnect(self, websocket: WebSocket, conversation_id: str):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
        if conversation_id in self.memories:
            del self.memories[conversation_id]

    async def send_message(self, websocket: WebSocket, message: str):
        await websocket.send_text(message)
        
    async def handle_message(self, websocket: WebSocket, conversation_id: str, text_data: str):
        try:
            data = json.loads(text_data)
            msg = WSMessage(**data)
            logger.info(f"Received WS Message from {conversation_id}: type={msg.type}, content={msg.content}")
            
            if msg.type == "PING":
                await self.send_message(
                    websocket, 
                    WSMessage(type="PONG").model_dump_json()
                )
                
            elif msg.type == "USER_FINAL":
                if msg.content:
                    try:
                        # Initialize provider
                        provider = get_provider()
                        provider.initialize()
                        
                        memory = self.memories.get(conversation_id)
                        if not memory:
                            memory = SessionMemory()
                            self.memories[conversation_id] = memory
                            
                        memory.add_user_message(msg.content)
                        
                        import time
                        import re
                        
                        start_time = time.time()
                        first_token_time = None
                        
                        # Stream AI response
                        full_response = ""
                        current_sentence = ""
                        
                        async for chunk in provider.stream(
                            prompt=msg.content,
                            system_prompt=settings.system_prompt,
                            history=memory.get_history()
                        ):
                            if first_token_time is None:
                                first_token_time = time.time()
                                ttft = first_token_time - start_time
                                logger.info(f"Time to first token: {ttft:.3f}s")
                                
                            full_response += chunk
                            current_sentence += chunk
                            
                            # Stream raw chunk for text UI
                            await self.send_message(
                                websocket,
                                WSMessage(
                                    type="AI_STREAM", 
                                    content=chunk
                                ).model_dump_json()
                            )
                            
                            # Check for sentence boundaries for TTS
                            # We consider '.', '!', '?', or '\n' as boundaries if followed by space or end of chunk
                            if re.search(r'[.!?\n]\s*$', current_sentence) or chunk.endswith('\n'):
                                if current_sentence.strip():
                                    await self.send_message(
                                        websocket,
                                        WSMessage(
                                            type="AI_SENTENCE", 
                                            content=current_sentence.strip(),
                                            metadata={"ttft": ttft if 'ttft' in locals() else 0}
                                        ).model_dump_json()
                                    )
                                    current_sentence = ""
                        
                        # Send remaining sentence if any
                        if current_sentence.strip():
                            await self.send_message(
                                websocket,
                                WSMessage(
                                    type="AI_SENTENCE", 
                                    content=current_sentence.strip()
                                ).model_dump_json()
                            )
                        
                        end_time = time.time()
                        total_time = end_time - start_time
                        logger.info(f"Total response time: {total_time:.3f}s")
                        
                        memory.add_ai_message(full_response)
                        
                        await self.send_message(
                            websocket,
                            WSMessage(
                                type="AI_FINAL",
                                metadata={"total_time": total_time, "ttft": (first_token_time - start_time) if first_token_time else 0}
                            ).model_dump_json()
                        )
                        
                    except Exception as e:
                        import traceback
                        import uuid
                        
                        req_id = str(uuid.uuid4())
                        error_type = type(e).__name__
                        error_msg = str(e)
                        
                        # Detailed backend logging
                        logger.error(f"[{req_id}] Provider Error ({error_type}): {error_msg}")
                        logger.error(f"[{req_id}] Stack trace: {traceback.format_exc()}")
                        
                        # If we failed before producing any tokens, remove the user message
                        # so that the user can retry cleanly.
                        if full_response == "":
                            memory.remove_last_message()
                            
                        # Send structured error to frontend, do NOT append to AI memory
                        await self.send_message(
                            websocket,
                            WSMessage(
                                type="ERROR", 
                                content=error_msg,
                                metadata={
                                    "error_type": error_type,
                                    "request_id": req_id
                                }
                            ).model_dump_json()
                        )
        except Exception as e:
            import traceback
            logger.error(f"WS Handling Error: {e}")
            logger.error(traceback.format_exc())

manager = ConnectionManager()
