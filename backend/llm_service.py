# ==============================================================================
# FILE: llm_service.py
# WHAT THIS FILE IS: Multi-Provider LLM AI Service Module (OpenRouter & Gemini).
# WHY IT IS USED: Handles communication with OpenRouter API (using OpenAI SDK format),
#                 executing registered system tools, and streaming token responses.
# ==============================================================================

import re
from typing import AsyncGenerator, List, Dict, Union, Optional
from openai import AsyncOpenAI
from google import genai
from config import settings
from tools.tool_registry import tool_registry

def process_system_tools(prompt: str) -> Optional[str]:
    """
    Parses user prompt for system control intents, executes registered tools,
    and returns tool execution output context string.
    """
    p = prompt.lower().strip()
    
    # 1. Volume Controls
    if "volume" in p or "sound" in p or "louder" in p or "quieter" in p or "mute" in p:
        if "mute" in p:
            tool_registry.execute("set_master_volume", level_percent=0)
            return "[System Tool Action Executed: Master volume muted to 0%]"
        elif any(w in p for w in ["increase", "up", "raise", "louder", "higher", "more", "add"]):
            current_res = tool_registry.execute("get_master_volume")
            curr = current_res.get("volume_percent", 50)
            target = min(100, curr + 20)
            tool_registry.execute("set_master_volume", level_percent=target)
            return f"[System Tool Action Executed: Physical Windows master volume increased from {curr}% to {target}%]"
        elif any(w in p for w in ["decrease", "down", "lower", "quieter", "reduce", "less"]):
            current_res = tool_registry.execute("get_master_volume")
            curr = current_res.get("volume_percent", 50)
            target = max(0, curr - 20)
            tool_registry.execute("set_master_volume", level_percent=target)
            return f"[System Tool Action Executed: Physical Windows master volume decreased from {curr}% to {target}%]"
        else:
            nums = re.findall(r'\d+', p)
            if nums:
                val = int(nums[0])
                tool_registry.execute("set_master_volume", level_percent=val)
                return f"[System Tool Action Executed: Physical Windows master volume set to {val}%]"

    # 2. Application Launcher
    if any(kw in p for kw in ["open ", "launch ", "start "]):
        match = re.search(r'(open|launch|start)\s+(.+)', p)
        if match:
            app_target = match.group(2).strip()
            app_target = re.sub(r'[^\w\s-]', '', app_target)
            if app_target not in ["the", "a", "my", "this"]:
                res = tool_registry.execute("open_application", app_name=app_target)
                return f"[System Tool Action Executed: Opened application '{app_target}']"

    # 3. System Telemetry
    if "telemetry" in p or "cpu" in p or "ram" in p or "system status" in p:
        res = tool_registry.execute("get_system_telemetry")
        return f"[System Tool Action Executed: CPU: {res.get('cpu_usage_percent')}%, RAM: {res.get('ram_percent')}%, Disk Free: {res.get('disk_free_gb')}GB]"

    # 4. Lock Workstation
    if "lock pc" in p or "lock workstation" in p or "lock computer" in p:
        res = tool_registry.execute("lock_workstation")
        return "[System Tool Action Executed: Workstation screen locked]"

    return None


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
        system_prompt: str = None
    ) -> AsyncGenerator[str, None]:
        """
        Generates and streams response text chunks token-by-token asynchronously.
        Automatically processes and executes system automation tools.
        """
        active_model = model or self.openrouter_model
        active_sys_prompt = system_prompt or (
            "Your name is Phoenix. You are a real-time, highly intelligent AI personal assistant inspired by Jarvis. "
            "You assist the user with tasks, computer control, memory management, and workflow automation. "
            "Keep voice responses direct, concise, helpful, and natural."
        )

        tool_result = process_system_tools(prompt)

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
            formatted_messages.append({"role": "system", "content": tool_result})

        if self.provider == "openrouter" and self.client:
            try:
                response = await self.client.chat.completions.create(
                    model=active_model,
                    messages=formatted_messages,
                    stream=True
                )
                
                async for chunk in response:
                    if chunk.choices and chunk.choices[0].delta.content:
                        yield chunk.choices[0].delta.content

            except Exception as e:
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
                yield f"[GEMINI ERROR]: Failed to generate response - {str(e)}"

        else:
            mock_tokens = [
                f"[Phoenix AI Stream]: Received: '{prompt}'. ",
                f"{tool_result if tool_result else 'Ready for voice commands!'}"
            ]
            for token in mock_tokens:
                yield token

llm_service = LLMService()
