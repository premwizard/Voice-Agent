# ==============================================================================
# FILE: backend/api/controllers/system_controller.py
# WHAT THIS FILE IS: Controller for System Control & Telemetry REST Endpoints.
# WHY IT IS USED: Thin controller validating requests and calling system/telemetry services.
# ==============================================================================

import io
from fastapi import HTTPException
from fastapi.responses import StreamingResponse
from api.schemas.system_schema import SystemActionRequest, TTSRequest
from services.system.telemetry_service import telemetry_service
from tools.tool_registry import tool_registry
from tts_service import tts_service

class SystemController:
    """Controller handling system metrics, direct system actions, and neural TTS voice generation."""

    def get_telemetry(self):
        """Fetches live system status metrics."""
        return telemetry_service.get_telemetry()

    def execute_action(self, request: SystemActionRequest):
        """Executes a direct system tool action by name."""
        action_args = request.args or {}
        result = tool_registry.execute(request.action, user_confirmed=request.user_confirmed or False, **action_args)
        return {"action": request.action, "result": result}

    async def generate_tts(self, request: TTSRequest):
        """Generates neural Edge-TTS audio stream from input text."""
        audio_bytes = await tts_service.generate_speech_audio(request.text, request.voice)
        if not audio_bytes:
            raise HTTPException(status_code=500, detail="Failed to generate TTS audio")
        return StreamingResponse(io.BytesIO(audio_bytes), media_type="audio/mpeg")

system_controller = SystemController()
