# ==============================================================================
# FILE: backend/communication/sse.py
# WHAT THIS FILE IS: Server-Sent Events (SSE) Stream Generator Driver.
# WHY IT IS USED: Encapsulates SSE formatting logic (token chunks, errors, [DONE] markers).
# ==============================================================================

import json
from typing import AsyncGenerator
from llm_service import llm_service

class SSEGenerator:
    """Helper class generating compliant text/event-stream payloads from LLM response streams."""

    @staticmethod
    async def generate_chat_stream(
        prompt: str,
        history: list = None,
        model: str = None,
        system_prompt: str = None,
        user_confirmed: bool = False
    ) -> AsyncGenerator[str, None]:
        """Streams text tokens asynchronously formatted as SSE data blocks."""
        try:
            async for token_chunk in llm_service.stream_response(
                prompt,
                history=history,
                model=model,
                system_prompt=system_prompt,
                user_confirmed=user_confirmed
            ):
                payload = json.dumps({"token": token_chunk})
                yield f"data: {payload}\n\n"
            
            yield "data: [DONE]\n\n"
        except Exception as e:
            err_payload = json.dumps({"error": str(e)})
            yield f"data: {err_payload}\n\n"
