"""
WebSocket Connection Manager — upgraded with persistent 4-layer memory.

Changes from Phase 1:
- Replaces in-memory SessionMemory with MemoryManager (persistent SQLite)
- On connect: loads history from DB and sends HISTORY_LOAD to frontend
- On USER_FINAL: saves user message before streaming
- On AI_FINAL: saves assistant message, fires post-response pipeline in background
- Accepts optional conversation_id query param for session resumption
- All context assembly delegated to MemoryManager / ContextBuilder
"""

import asyncio
import json
import logging
import re
import time

from fastapi import WebSocket

from schemas.ws import WSMessage
from providers import get_provider
from services.memory_manager import memory_manager
from config.settings import settings

logger = logging.getLogger(__name__)


class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []
        self.generation_tasks: dict[str, asyncio.Task] = {}
        # Track current mode per connection for message tagging
        self._modes: dict[str, str] = {}

    async def connect(
        self,
        websocket: WebSocket,
        conversation_id: str,
        mode: str = "chat",
    ) -> None:
        await websocket.accept()
        self.active_connections.append(websocket)
        self._modes[conversation_id] = mode

        # Ensure conversation record exists in DB
        await memory_manager.ensure_conversation(conversation_id, mode=mode)

        # Send CONNECTED with the conversation_id
        await self._send(
            websocket,
            WSMessage(
                type="CONNECTED",
                conversation_id=conversation_id,
            ).model_dump_json(),
        )

        # Load and send persisted history to frontend
        await self._send_history(websocket, conversation_id)

    async def _send_history(
        self, websocket: WebSocket, conversation_id: str
    ) -> None:
        """Load persisted messages and send HISTORY_LOAD to the frontend."""
        try:
            messages = await memory_manager.load_recent_messages(conversation_id)
            if messages:
                history_payload = [
                    {
                        "id": m.id,
                        "role": m.role,
                        "content": m.content,
                        "timestamp": m.timestamp.isoformat(),
                        "mode": m.mode,
                    }
                    for m in messages
                ]
                await self._send(
                    websocket,
                    WSMessage(
                        type="HISTORY_LOAD",
                        conversation_id=conversation_id,
                        metadata={"messages": history_payload},
                    ).model_dump_json(),
                )
                logger.info(
                    f"[{conversation_id}] Sent {len(messages)} historical messages"
                )
        except Exception as e:
            logger.error(f"[{conversation_id}] Failed to load history: {e}")

    def disconnect(self, websocket: WebSocket, conversation_id: str) -> None:
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
        self._modes.pop(conversation_id, None)
        if conversation_id in self.generation_tasks:
            task = self.generation_tasks[conversation_id]
            if not task.done():
                task.cancel()
            del self.generation_tasks[conversation_id]

    async def _send(self, websocket: WebSocket, message: str) -> None:
        await websocket.send_text(message)

    # ------------------------------------------------------------------ #
    # Core response generation — integrates MemoryManager
    # ------------------------------------------------------------------ #

    async def _generate_response(
        self,
        websocket: WebSocket,
        conversation_id: str,
        content: str,
    ) -> None:
        full_response = ""
        mode = self._modes.get(conversation_id, "chat")

        try:
            provider = get_provider()
            provider.initialize()

            # Save user message to DB
            await memory_manager.save_user_message(
                conversation_id=conversation_id,
                content=content,
                mode=mode,
            )

            # Build 4-layer context
            enriched_system, history = await memory_manager.build_context(
                conversation_id=conversation_id,
                current_user_message=content,
                system_prompt=settings.system_prompt,
            )

            start_time = time.time()
            first_token_time = None
            current_sentence = ""
            ttft = 0.0

            # Stream AI response
            async for chunk in provider.stream(
                prompt=content,
                system_prompt=enriched_system,
                history=history,
            ):
                if first_token_time is None:
                    first_token_time = time.time()
                    ttft = first_token_time - start_time
                    logger.info(f"[{conversation_id}] TTFT: {ttft:.3f}s")

                full_response += chunk
                current_sentence += chunk

                # Stream raw chunk for text UI
                await self._send(
                    websocket,
                    WSMessage(type="AI_STREAM", content=chunk).model_dump_json(),
                )

                # Sentence boundary detection for TTS
                if re.search(r"[.!?\n]\s*$", current_sentence) or chunk.endswith("\n"):
                    if current_sentence.strip():
                        await self._send(
                            websocket,
                            WSMessage(
                                type="AI_SENTENCE",
                                content=current_sentence.strip(),
                                metadata={"ttft": ttft},
                            ).model_dump_json(),
                        )
                        current_sentence = ""

            # Flush any remaining sentence
            if current_sentence.strip():
                await self._send(
                    websocket,
                    WSMessage(
                        type="AI_SENTENCE",
                        content=current_sentence.strip(),
                    ).model_dump_json(),
                )

            total_time = time.time() - start_time
            logger.info(f"[{conversation_id}] Total response time: {total_time:.3f}s")

            # Persist assistant message
            await memory_manager.save_assistant_message(
                conversation_id=conversation_id,
                content=full_response,
                mode=mode,
                metadata={"total_time": total_time, "ttft": ttft},
            )

            # Fire-and-forget: summarization + auto-title + memory extraction
            asyncio.create_task(
                memory_manager.post_response_pipeline(
                    conversation_id=conversation_id,
                    user_content=content,
                    assistant_content=full_response,
                )
            )

            await self._send(
                websocket,
                WSMessage(
                    type="AI_FINAL",
                    metadata={"total_time": total_time, "ttft": ttft},
                ).model_dump_json(),
            )

        except asyncio.CancelledError:
            logger.warning(f"[{conversation_id}] Generation cancelled (INTERRUPT)")
            if full_response.strip():
                await memory_manager.save_assistant_message(
                    conversation_id, full_response.strip(), mode=mode
                )
            else:
                await memory_manager.remove_last_message(conversation_id)
            raise

        except Exception as e:
            import traceback, uuid as _uuid

            req_id = str(_uuid.uuid4())
            error_type = type(e).__name__
            logger.error(f"[{req_id}] Provider Error ({error_type}): {e}")
            logger.error(traceback.format_exc())

            if not full_response:
                await memory_manager.remove_last_message(conversation_id)

            await self._send(
                websocket,
                WSMessage(
                    type="ERROR",
                    content=str(e),
                    metadata={"error_type": error_type, "request_id": req_id},
                ).model_dump_json(),
            )

        finally:
            if conversation_id in self.generation_tasks:
                if self.generation_tasks[conversation_id] == asyncio.current_task():
                    del self.generation_tasks[conversation_id]

    # ------------------------------------------------------------------ #
    # Message dispatcher
    # ------------------------------------------------------------------ #

    async def handle_message(
        self,
        websocket: WebSocket,
        conversation_id: str,
        text_data: str,
    ) -> None:
        try:
            data = json.loads(text_data)
            msg = WSMessage(**data)
            logger.info(f"[{conversation_id}] WS recv: type={msg.type}")

            if msg.type == "PING":
                rtt_meta = {}
                if msg.content:
                    try:
                        rtt_ms = int((time.time() - float(msg.content)) * 1000)
                        rtt_meta = {"rtt": rtt_ms}
                    except (ValueError, TypeError):
                        pass
                await self._send(
                    websocket,
                    WSMessage(type="PONG", metadata=rtt_meta).model_dump_json(),
                )

            elif msg.type == "USER_FINAL":
                if msg.content:
                    # Update mode tag if provided
                    if msg.metadata and "mode" in msg.metadata:
                        self._modes[conversation_id] = msg.metadata["mode"]

                    # Cancel existing generation if running
                    if conversation_id in self.generation_tasks:
                        existing = self.generation_tasks[conversation_id]
                        if not existing.done():
                            existing.cancel()

                    task = asyncio.create_task(
                        self._generate_response(websocket, conversation_id, msg.content)
                    )
                    self.generation_tasks[conversation_id] = task

            elif msg.type == "USER_EDIT":
                if msg.content and msg.metadata and "message_id" in msg.metadata:
                    if msg.metadata and "mode" in msg.metadata:
                        self._modes[conversation_id] = msg.metadata["mode"]

                    if conversation_id in self.generation_tasks:
                        existing = self.generation_tasks[conversation_id]
                        if not existing.done():
                            existing.cancel()

                    message_id = msg.metadata["message_id"]
                    # Update message and truncate newer ones
                    await memory_manager.edit_message_and_truncate(conversation_id, message_id, msg.content)
                    
                    # Generate new response
                    task = asyncio.create_task(
                        self._generate_response(websocket, conversation_id, msg.content)
                    )
                    self.generation_tasks[conversation_id] = task

            elif msg.type == "INTERRUPT":
                if conversation_id in self.generation_tasks:
                    task = self.generation_tasks[conversation_id]
                    if not task.done():
                        logger.info(f"[{conversation_id}] Interrupting generation")
                        task.cancel()

        except Exception as e:
            import traceback

            logger.error(f"WS handling error: {e}")
            logger.error(traceback.format_exc())


manager = ConnectionManager()
