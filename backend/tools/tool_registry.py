# ==============================================================================
# FILE: backend/tools/tool_registry.py
# WHAT THIS FILE IS: Extensible Central Tool Calling Registry for Phoenix AI.
# WHY IT IS USED: Focuses exclusively on registering tools, validating permissions,
#                 executing capabilities with timing metrics, logging execution history,
#                 and exporting OpenAI/Gemini function schemas.
# ==============================================================================

import time
from typing import Dict, Any, Callable, List, Optional
from core.permissions import evaluate_permission, get_tool_permission_level
from core.logging_service import tool_logger
from core.context import system_context

class ToolRegistry:
    """Central registry managing tool registrations, permissions, and execution dispatch."""

    def __init__(self):
        self._tools: Dict[str, Callable] = {}
        self._schemas: List[Dict[str, Any]] = []

    def register(self, name: str, description: str, parameters: Optional[Dict[str, Any]] = None):
        """Decorator to register a capability tool with rich metadata and parameters schema."""
        def decorator(func: Callable):
            self._tools[name] = func
            schema = {
                "name": name,
                "description": description,
                "permission_level": get_tool_permission_level(name).value,
                "parameters": parameters or {
                    "type": "object",
                    "properties": {},
                    "required": []
                }
            }
            self._schemas.append(schema)
            return func
        return decorator

    def execute(self, name: str, user_request: str = "", user_confirmed: bool = False, **kwargs) -> Dict[str, Any]:
        """
        Executes a registered tool with permission evaluation, timing measurement, and logging.
        """
        start_time = time.time()
        
        if name not in self._tools:
            duration_ms = (time.time() - start_time) * 1000
            err_msg = f"Tool '{name}' is not registered."
            tool_logger.log_execution(user_request, name, kwargs, "UNKNOWN", duration_ms, False, None, err_msg)
            return {
                "success": False,
                "tool": name,
                "error": err_msg,
                "message": err_msg,
                "execution_time_ms": round(duration_ms, 2)
            }

        # Permission evaluation check
        perm_eval = evaluate_permission(name, kwargs, user_confirmed)
        perm_level = perm_eval.get("permission_level", "SAFE")
        
        if not perm_eval["allowed"]:
            duration_ms = (time.time() - start_time) * 1000
            msg = perm_eval["message"]
            tool_logger.log_execution(user_request, name, kwargs, perm_level, duration_ms, False, None, msg)
            return {
                "success": False,
                "tool": name,
                "requires_confirmation": True,
                "permission_level": perm_level,
                "message": f"Confirmation Required: {msg}",
                "execution_time_ms": round(duration_ms, 2)
            }

        try:
            raw_result = self._tools[name](**kwargs)
            duration_ms = (time.time() - start_time) * 1000

            # Normalize outcome
            success = True
            if isinstance(raw_result, dict):
                success = raw_result.get("success", raw_result.get("status") == "success")

            formatted_result = {
                "success": success,
                "tool": name,
                "permission_level": perm_level,
                "execution_time_ms": round(duration_ms, 2),
                "data": raw_result,
                "message": raw_result.get("message", f"Successfully executed tool '{name}'.") if isinstance(raw_result, dict) else str(raw_result)
            }

            if isinstance(raw_result, dict) and raw_result.get("status") == "ambiguous":
                formatted_result["success"] = False
                formatted_result["ambiguous"] = True
                formatted_result["candidates"] = raw_result.get("candidates", [])

            system_context.update_tool_context(name, user_request)
            system_context.add_log(formatted_result)
            
            tool_logger.log_execution(user_request, name, kwargs, perm_level, duration_ms, success, raw_result)
            return formatted_result

        except Exception as e:
            duration_ms = (time.time() - start_time) * 1000
            err_msg = str(e)
            tool_logger.log_execution(user_request, name, kwargs, perm_level, duration_ms, False, None, err_msg)
            return {
                "success": False,
                "tool": name,
                "permission_level": perm_level,
                "error": err_msg,
                "message": f"Failed to execute tool '{name}': {err_msg}",
                "execution_time_ms": round(duration_ms, 2)
            }

    def get_tools_schema(self) -> List[Dict[str, Any]]:
        """Returns schemas for all registered tools."""
        return self._schemas


# Initialize Global Tool Registry Instance
tool_registry = ToolRegistry()

# Register Domain Tools from Modular Packages
from tools.system_tools import register_system_tools
from tools.application_tools import register_application_tools
from tools.memory_tools import register_memory_tools
from tools.browser_tools import register_browser_tools
from tools.vision_tools import register_vision_tools

register_system_tools(tool_registry)
register_application_tools(tool_registry)
register_memory_tools(tool_registry)
register_browser_tools(tool_registry)
register_vision_tools(tool_registry)
