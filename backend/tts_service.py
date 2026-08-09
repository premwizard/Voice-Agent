# ==============================================================================
# FILE: backend/tts_service.py
# WHAT THIS FILE IS: High-Quality Neural Voice Synthesis Service (Edge-TTS).
# WHY IT IS USED: Generates ultra-realistic, natural JARVIS voice audio (MP3 format)
#                 using Microsoft Neural Voices (en-US-ChristopherNeural).
# ==============================================================================

import io
from typing import Optional

class TTSService:
    def __init__(self, voice: str = "en-US-ChristopherNeural"):
        self.default_voice = voice

    async def generate_speech_audio(self, text: str, voice: Optional[str] = None) -> bytes:
        """
        Generates MP3 audio byte stream for the given text using Edge-TTS.
        """
        selected_voice = voice or self.default_voice
        clean_text = text.strip()

        if not clean_text:
            return b""

        try:
            import edge_tts
            communicate = edge_tts.Communicate(clean_text, selected_voice)
            audio_buffer = io.BytesIO()

            async for chunk in communicate.stream():
                if chunk["type"] == "audio":
                    audio_buffer.write(chunk["data"])

            return audio_buffer.getvalue()
        except Exception as e:
            print(f"Edge-TTS Generation Error: {e}")
            return b""

tts_service = TTSService()
