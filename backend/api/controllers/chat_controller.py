# ==============================================================================
# FILE: backend/api/controllers/chat_controller.py
# WHAT THIS FILE IS: Controller for Server-Sent Events (SSE) AI Streaming.
# WHY IT IS USED: Thin controller invoking SSEGenerator to produce progressive token responses.
# ==============================================================================

from fastapi.responses import StreamingResponse
from api.schemas.chat_schema import ChatRequest
from communication.sse import SSEGenerator

class ChatController:
    """Controller handling SSE streaming AI conversations."""

    async def stream_chat(self, request: ChatRequest) -> StreamingResponse:
        """Streams AI response tokens progressively over Server-Sent Events."""
        generator = SSEGenerator.generate_chat_stream(
            prompt=request.prompt,
            history=request.history,
            model=request.model,
            system_prompt=request.system_prompt,
            user_confirmed=request.user_confirmed or False
        )
        return StreamingResponse(generator, media_type="text/event-stream")

chat_controller = ChatController()
