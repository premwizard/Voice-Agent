# ==============================================================================
# FILE: llm_service.py
# WHAT THIS FILE IS: Multi-Provider Intelligent LLM AI Service (OpenRouter & Gemini).
# WHY IT IS USED: Intercepts natural language prompts, coordinates with AIToolCaller 
#                 to execute tools dynamically, formats context, and streams text responses.
# ==============================================================================

import json
import re
from typing import AsyncGenerator, List, Dict, Union, Optional
from openai import AsyncOpenAI
from google import genai
from config import settings
from ai.tool_calling import ai_tool_caller

class LLMService:
    def __init__(self):
        self.provider = settings.AI_PROVIDER.lower()
        self.openrouter_key = settings.OPENROUTER_API_KEY
        self.openrouter_model = settings.OPENROUTER_MODEL
        self.gemini_key = settings.GEMINI_API_KEY

        if self.provider == "openrouter" and self.openrouter_key and self.openrouter_key != "your_openrouter_api_key_here":
            self.client = AsyncOpenAI(
                base_url="https://openrouter.ai/api/v1",
                api_key=self.openrouter_key,
            )
        elif self.provider == "gemini" and self.gemini_key and self.gemini_key != "your_gemini_api_key_here":
            self.client = genai.Client(api_key=self.gemini_key)
        else:
            self.client = None

    async def stream_response(
        self, 
        prompt: str, 
        history: List[Dict[str, str]] = None,
        model: str = None,
        system_prompt: str = None,
        user_confirmed: bool = False
    ) -> AsyncGenerator[str, None]:
        """
        Processes tool execution via AIToolCaller and streams response tokens asynchronously.
        """
        active_model = model or self.openrouter_model
        base_sys_prompt = system_prompt or (
            "Your name is Phoenix. You are a real-time, highly intelligent AI personal assistant inspired by Jarvis. "
            "You assist the user with tasks, computer control, system telemetry, and workflow automation. "
            "Keep responses direct, concise, helpful, and natural."
        )
        from memory.memory_manager import memory_manager
        memory_context = memory_manager.get_active_memories_prompt()
        active_sys_prompt = base_sys_prompt + memory_context + ai_tool_caller.get_tool_system_instructions()

        tool_spec, tool_result = ai_tool_caller.process_request(prompt, user_confirmed=user_confirmed)

        # Handle specific execution states directly
        if tool_result:
            if tool_result.get("requires_confirmation"):
                yield tool_result.get("message", "This action requires explicit user confirmation. Would you like me to proceed?")
                return
            elif tool_result.get("ambiguous"):
                yield tool_result.get("message", "I found multiple matching applications. Which one should I open?")
                return

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

        if tool_result:
            outcome_msg = tool_result.get("message", "Action completed successfully.")
            tool_context_str = (
                f"[SYSTEM NOTIFICATION: Tool Action Executed Successfully. Outcome: '{outcome_msg}'].\n"
                "INSTRUCTION: State this confirmation directly and naturally to the user in 1 concise sentence. "
                "DO NOT output raw JSON code blocks or internal function parameter schemas."
            )
            formatted_messages.append({"role": "system", "content": tool_context_str})

        if self.provider == "openrouter" and self.client:
            try:
                response = await self.client.chat.completions.create(
                    model=active_model,
                    messages=formatted_messages,
                    stream=True
                )
                
                async for chunk in response:
                    if chunk.choices and chunk.choices[0].delta.content:
                        text_chunk = chunk.choices[0].delta.content
                        yield text_chunk

            except Exception as e:
                if tool_result:
                    yield tool_result.get("message", f"Executed tool action successfully.")
                else:
                    yield f"[OPENROUTER ERROR]: Failed to generate response - {str(e)}"

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
                if tool_result:
                    yield tool_result.get("message", f"Executed tool action successfully.")
                else:
                    yield f"[GEMINI ERROR]: Failed to generate response - {str(e)}"

        else:
            # Standalone local execution mode without external API key
            if tool_result:
                msg = tool_result.get("message", "Executed system control tool.")
                yield msg
            else:
                mock_tokens = [
                    f"[Phoenix AI Stream]: Received: '{prompt}'. ",
                    "Ready to assist with computer automation!"
                ]
                for token in mock_tokens:
                    yield token

llm_service = LLMService()
