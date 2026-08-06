# ==============================================================================
# FILE: llm_service.py
# WHAT THIS FILE IS: Multi-Provider LLM AI Service Module (OpenRouter & Gemini).
# WHY IT IS USED: Handles communication with OpenRouter API (using OpenAI SDK format),
#                 managing streaming token responses token-by-token over WebSockets.
# ==============================================================================

from typing import AsyncGenerator, List, Dict, Union
# Import AsyncOpenAI client to interact non-blocking with OpenRouter's API
from openai import AsyncOpenAI
# Import Google GenAI SDK client
from google import genai
# Import settings object to fetch configured API keys and model options
from config import settings

class LLMService:
    def __init__(self):
        # Store the active AI provider name from settings (e.g. "openrouter")
        self.provider = settings.AI_PROVIDER.lower()
        
        # OpenRouter setup using OpenAI client compatible endpoint
        self.openrouter_key = settings.OPENROUTER_API_KEY
        self.openrouter_model = settings.OPENROUTER_MODEL
        
        # Gemini setup
        self.gemini_key = settings.GEMINI_API_KEY

        # Initialize AsyncOpenAI client if OpenRouter provider selected
        if self.provider == "openrouter" and self.openrouter_key and self.openrouter_key != "your_openrouter_api_key_here":
            self.client = AsyncOpenAI(
                base_url="https://openrouter.ai/api/v1",
                api_key=self.openrouter_key,
            )
        # Initialize Gemini client if Gemini provider selected
        elif self.provider == "gemini" and self.gemini_key and self.gemini_key != "your_gemini_api_key_here":
            self.client = genai.Client(api_key=self.gemini_key)
        else:
            # Set client to None if no valid API key is configured (enables mock fallback testing mode)
            self.client = None

    async def stream_response(
        self, 
        prompt: str, 
        history: List[Dict[str, str]] = None,
        model: str = None,
        system_prompt: str = None
    ) -> AsyncGenerator[str, None]:
        """
        Generates and streams response text chunks token-by-token asynchronously.
        Supports multi-turn conversation memory history and dynamic model/personality selection.
        """
        active_model = model or self.openrouter_model
        active_sys_prompt = system_prompt or "You are a real-time AI Voice Assistant. Keep responses concise, conversational, and natural."

        # Construct messages payload with system prompt, history, and current prompt
        system_msg = {
            "role": "system", 
            "content": active_sys_prompt
        }
        formatted_messages = [system_msg]

        if history:
            for msg in history:
                role = msg.get("role")
                content = msg.get("content")
                if role in ["user", "assistant"] and content:
                    formatted_messages.append({"role": role, "content": content})

        formatted_messages.append({"role": "user", "content": prompt})

        # 1. OpenRouter Provider Branch (Async / Non-blocking)
        if self.provider == "openrouter" and self.client:
            try:
                # Call OpenRouter chat completions with async streaming enabled
                response = await self.client.chat.completions.create(
                    model=active_model,
                    messages=formatted_messages,
                    stream=True
                )
                
                # Iterate asynchronously through incoming streaming chunks from OpenRouter
                async for chunk in response:
                    if chunk.choices and chunk.choices[0].delta.content:
                        # Yield token chunk live over WebSocket stream
                        yield chunk.choices[0].delta.content

            except Exception as e:
                # Yield error chunk if OpenRouter API call encounters an issue
                yield f"[OPENROUTER ERROR]: Failed to generate response - {str(e)}"

        # 2. Gemini Provider Branch
        elif self.provider == "gemini" and self.client:
            try:
                response = self.client.models.generate_content_stream(
                    model="gemini-2.5-flash",
                    contents=prompt,
                )
                for chunk in response:
                    if chunk.text:
                        yield chunk.text
            except Exception as e:
                yield f"[GEMINI ERROR]: Failed to generate response - {str(e)}"

        # 3. Testing Fallback Mode (No API key set in .env)
        else:
            mock_tokens = [
                f"[OpenRouter Fallback Stream (No API key set)]: You said: '{prompt}'. ",
                f"Active provider is '{self.provider.upper()}' using model '{self.openrouter_model}'. ",
                "Once you add your real OPENROUTER_API_KEY in backend/.env, ",
                "I will generate real live responses from OpenRouter!"
            ]
            
            for token in mock_tokens:
                yield token

# Create a single global instance of LLMService to reuse across WebSocket connections
llm_service = LLMService()
