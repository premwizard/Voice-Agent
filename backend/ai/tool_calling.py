# ==============================================================================
# FILE: backend/ai/tool_calling.py
# WHAT THIS FILE IS: AI Tool Calling & Intent Processing Engine.
# WHY IT IS USED: Converts natural user requests into structured tool selections 
#                 and argument payloads using the LLM Brain, executes tools safely via 
#                 the ToolRegistry, handles confirmation/ambiguity, and injects 
#                 tool outcomes into the AI response generator.
# ==============================================================================

import json
import re
from typing import Dict, Any, Optional, Tuple
from tools.tool_registry import tool_registry

class AIToolCaller:
    @staticmethod
    def get_tool_system_instructions() -> str:
        """
        Generates prompt instructions exposing all registered tools and JSON response format.
        """
        schemas = tool_registry.get_tools_schema()
        tools_summary = []
        for s in schemas:
            tools_summary.append(f"- {s['name']}: {s['description']} (Permission: {s['permission_level']})")

        instructions = (
            "\n\n--- CAPABILITIES & TOOL CALLING INSTRUCTIONS ---\n"
            "You have direct control of the user's PC via registered capabilities:\n"
            + "\n".join(tools_summary) +
            "\n\nCRITICAL SYSTEM RULES FOR PHOENIX:\n"
            "1. When a system tool is executed, respond naturally in 1 concise spoken sentence (e.g. 'I've set your volume to 50%.').\n"
            "2. DO NOT output raw JSON code blocks, function call syntax, or internal schema specifications in your final spoken text response.\n"
        )
        return instructions

    @staticmethod
    def parse_volume_level(prompt_text: str) -> Optional[int]:
        """
        Parses target volume level percentage (0 to 100) from user prompt,
        automatically correcting common Speech-To-Text (STT) mishearings.
        For example: 'reduce volume 250' -> STT misheard spoken 'to 50' as '250'.
        """
        p = prompt_text.lower().strip()
        nums = [int(n) for n in re.findall(r'\d+', p)]
        if not nums:
            return None

        val = nums[0]

        # Fix STT mishearing: '250' -> 50, '280' -> 80, '230' -> 30, '260' -> 60, '270' -> 70, '290' -> 90
        # Speech-to-text engines commonly transcribe spoken 'volume to 50' as 'volume 250'.
        if val > 100 and str(val).startswith('2') and len(str(val)) == 3:
            potential_val = int(str(val)[1:])
            if 0 <= potential_val <= 100:
                return potential_val

        return max(0, min(100, val))

    @staticmethod
    def parse_tool_call(llm_output: str) -> Optional[Dict[str, Any]]:
        """Extracts JSON tool call block from LLM output if present."""
        match = re.search(r'```json\s*(\{.*?\})\s*```', llm_output, re.DOTALL)
        if not match:
            match = re.search(r'(\{[\s\n]*"tool"[\s\n]*:[\s\n]*".*?"[\s\n]*,.*?\})', llm_output, re.DOTALL)

        if match:
            try:
                data = json.loads(match.group(1))
                if isinstance(data, dict) and "tool" in data:
                    return data
            except Exception:
                pass
        return None

    @staticmethod
    def process_request(user_prompt: str, user_confirmed: bool = False) -> Tuple[Optional[Dict[str, Any]], Optional[Dict[str, Any]]]:
        """
        Performs high-speed intent routing check using registered tool capabilities.
        Returns tuple of (tool_call_spec, execution_result).
        """
        p = user_prompt.lower().strip()

        # Deterministic fast-path tool selection mapping to prevent model latency where clear
        tool_name = None
        args = {}

        # Application Launch Intent
        if any(kw in p for kw in ["open", "launch", "start", "run"]):
            match = re.search(r'(open|launch|start|run)\s+(the\s+|a\s+|my\s+)?(.+)', p)
            if match:
                app = match.group(3).strip()
                if app not in ["up", "down", "the", "a"]:
                    tool_name = "open_application"
                    args = {"application": app}

        # Volume Controls
        elif any(kw in p for kw in ["volume", "louder", "quieter", "mute", "sound"]):
            if "mute" in p:
                tool_name = "set_master_volume"
                args = {"level_percent": 0}
            elif any(w in p for w in ["up", "raise", "increase", "louder", "higher"]):
                curr = tool_registry.execute("get_master_volume").get("data", {}).get("volume_percent", 50)
                tool_name = "set_master_volume"
                args = {"level_percent": min(100, curr + 20)}
            elif any(w in p for w in ["down", "lower", "decrease", "quieter", "less"]):
                curr = tool_registry.execute("get_master_volume").get("data", {}).get("volume_percent", 50)
                tool_name = "set_master_volume"
                args = {"level_percent": max(0, curr - 20)}
            else:
                target_val = AIToolCaller.parse_volume_level(p)
                if target_val is not None:
                    tool_name = "set_master_volume"
                    args = {"level_percent": target_val}
                else:
                    tool_name = "get_master_volume"
                    args = {}

        # Brightness Controls
        elif "brightness" in p:
            nums = re.findall(r'\d+', p)
            if nums:
                tool_name = "set_screen_brightness"
                args = {"level_percent": int(nums[0])}

        # Vision & Screen Intent
        elif any(kw in p for kw in ["screen", "monitor", "what's on my screen", "what is on my screen", "look at my screen"]):
            tool_name = "analyze_screen"
            args = {"prompt": user_prompt}
        elif any(kw in p for kw in ["active window", "focused window", "what window"]):
            tool_name = "get_active_window"

        # Web Automation & Searching Intent
        elif any(kw in p for kw in ["open website", "open site", "open url", "go to "]):
            match = re.search(r'(open\s+website|open\s+site|open\s+url|go\s+to)\s+(.+)', p)
            if match:
                tool_name = "open_website"
                args = {"url": match.group(2).strip()}
        elif any(kw in p for kw in ["search web", "search google", "search for ", "google "]):
            match = re.search(r'(search\s+web\s+for|search\s+google\s+for|search\s+for|google)\s+(.+)', p)
            if match:
                tool_name = "web_search"
                args = {"query": match.group(2).strip()}

        # Memory Intent
        elif any(kw in p for kw in ["remember that", "save memory", "remember this"]):
            match = re.search(r'remember\s+that\s+(.+)', p)
            if match:
                content = match.group(1).strip()
                key = content.split()[0] if content else "user_fact"
                tool_name = "remember_fact"
                args = {"key": key, "value": content}
        elif any(kw in p for kw in ["list memories", "show memories", "what do you remember"]):
            tool_name = "list_memories"

        # Telemetry & Performance
        elif any(kw in p for kw in ["ram", "memory"]):
            tool_name = "get_memory_usage"
        elif "cpu" in p:
            tool_name = "get_cpu_usage"
        elif "disk" in p or "storage" in p:
            tool_name = "get_disk_usage"
        elif any(kw in p for kw in ["telemetry", "system status", "hardware", "stats"]):
            tool_name = "get_system_telemetry"
        elif any(kw in p for kw in ["process", "processes", "running apps", "what's running"]):
            tool_name = "list_running_processes"

        # Security & Workstation Controls
        elif any(kw in p for kw in ["lock computer", "lock pc", "lock screen", "lock workstation"]):
            tool_name = "lock_workstation"
        elif any(kw in p for kw in ["sleep computer", "sleep pc", "sleep system"]):
            tool_name = "sleep_system"
        elif any(kw in p for kw in ["shutdown computer", "shutdown pc", "turn off computer", "shut down"]):
            tool_name = "shutdown_system"
            args = {"confirmed": user_confirmed}
        elif any(kw in p for kw in ["restart computer", "reboot pc", "restart pc", "reboot computer"]):
            tool_name = "restart_system"
            args = {"confirmed": user_confirmed}

        if tool_name:
            tool_spec = {"tool": tool_name, "arguments": args}
            result = tool_registry.execute(tool_name, user_request=user_prompt, user_confirmed=user_confirmed, **args)
            return tool_spec, result

        return None, None

ai_tool_caller = AIToolCaller()
