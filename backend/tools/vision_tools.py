# ==============================================================================
# FILE: backend/tools/vision_tools.py
# WHAT THIS FILE IS: Screen Analysis & Vision Tool Definitions.
# WHY IT IS USED: Registers screen vision and active window inspection tools onto the ToolRegistry.
# ==============================================================================

from typing import Dict, Any
from tools.vision import screen_vision

def register_vision_tools(registry):
    """Registers vision tool definitions onto the provided ToolRegistry instance."""

    @registry.register(
        "analyze_screen",
        "Captures active screen view and analyzes visible code, text, or applications using AI Vision.",
        parameters={
            "type": "object",
            "properties": {
                "prompt": {"type": "string", "description": "Question or prompt about what is visible on the screen."}
            },
            "required": []
        }
    )
    def tool_analyze_screen(prompt: str = "Describe what is currently visible on the screen.") -> Dict[str, Any]:
        return screen_vision.analyze_screen(prompt)

    @registry.register(
        "get_active_window",
        "Returns title, process ID, and dimensions of the currently focused desktop window.",
        parameters={"type": "object", "properties": {}, "required": []}
    )
    def tool_get_active_window() -> Dict[str, Any]:
        return screen_vision.get_active_window_info()
