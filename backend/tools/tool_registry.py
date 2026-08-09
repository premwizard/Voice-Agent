# ==============================================================================
# FILE: backend/tools/tool_registry.py
# WHAT THIS FILE IS: Extensible Tool Calling & Automation Registry for Phoenix AI.
# WHY IT IS USED: Centralized registry that registers, validates permissions, 
#                 executes system/application capabilities, logs metrics, and exports 
#                 structured schemas for AI model function calling.
# ==============================================================================

import time
from typing import Dict, Any, Callable, List, Optional
from core.permissions import evaluate_permission, get_tool_permission_level
from core.logging_service import tool_logger
from core.context import system_context
from tools.applications.resolver import app_resolver
from tools.applications.launcher import app_launcher
from tools.applications.discovery import app_discovery_service
from tools.system_control import (
    get_detailed_telemetry,
    set_master_volume,
    get_master_volume,
    set_screen_brightness,
    get_screen_brightness,
    list_running_processes,
    terminate_process,
    lock_workstation,
    sleep_system,
    shutdown_system,
    restart_system
)
from tools.vision import screen_vision
from memory.memory_manager import memory_manager
from tools.browser_automation import browser_engine

class ToolRegistry:
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

# ------------------------------------------------------------------------------
# Tool Registrations
# ------------------------------------------------------------------------------

@tool_registry.register(
    "open_application",
    "Launches a Windows desktop application by natural language name or description (e.g. 'chrome', 'browser', 'code editor', 'notepad', 'vscode').",
    parameters={
        "type": "object",
        "properties": {
            "application": {
                "type": "string",
                "description": "Name, description, or alias of the application to launch."
            }
        },
        "required": ["application"]
    }
)
def tool_open_application(application: str) -> Dict[str, Any]:
    resolved = app_resolver.resolve(application)
    if not resolved["success"]:
        return resolved
    
    best_match = resolved["best_match"]
    launch_res = app_launcher.launch(best_match)
    if launch_res["success"]:
        system_context.update_app_context(best_match["display_name"], best_match["path"])
    return launch_res

@tool_registry.register(
    "list_applications",
    "Returns a list of installed Windows applications discovered on the system.",
    parameters={
        "type": "object",
        "properties": {
            "query": {"type": "string", "description": "Optional search term to filter installed applications."}
        },
        "required": []
    }
)
def tool_list_applications(query: str = "") -> Dict[str, Any]:
    apps = app_discovery_service.get_installed_applications()
    if query:
        q = query.lower()
        apps = [a for a in apps if q in a["display_name"].lower() or any(q in alias for alias in a.get("aliases", []))]
    return {
        "success": True,
        "total": len(apps),
        "applications": [a["display_name"] for a in apps[:20]],
        "message": f"Found {len(apps)} installed applications."
    }

@tool_registry.register(
    "get_system_telemetry",
    "Fetches live system status telemetry (CPU usage %, RAM GB used/%, Disk free GB/%, and Battery level).",
    parameters={"type": "object", "properties": {}, "required": []}
)
def tool_get_system_telemetry() -> Dict[str, Any]:
    return get_detailed_telemetry()

@tool_registry.register(
    "get_cpu_usage",
    "Retrieves current system CPU utilization percentage.",
    parameters={"type": "object", "properties": {}, "required": []}
)
def tool_get_cpu_usage() -> Dict[str, Any]:
    telemetry = get_detailed_telemetry()
    cpu_val = telemetry.get("cpu_usage_percent", 0.0)
    return {"success": True, "cpu_usage_percent": cpu_val, "message": f"CPU usage is currently at {cpu_val}%."}

@tool_registry.register(
    "get_memory_usage",
    "Retrieves current system RAM / Memory usage percentage and used GB.",
    parameters={"type": "object", "properties": {}, "required": []}
)
def tool_get_memory_usage() -> Dict[str, Any]:
    telemetry = get_detailed_telemetry()
    used = telemetry.get("ram_used_gb", 0.0)
    total = telemetry.get("ram_total_gb", 0.0)
    pct = telemetry.get("ram_percent", 0.0)
    return {"success": True, "ram_used_gb": used, "ram_total_gb": total, "ram_percent": pct, "message": f"RAM usage is currently at {pct}% ({used} GB / {total} GB)."}

@tool_registry.register(
    "get_disk_usage",
    "Retrieves total and available hard disk storage space in GB.",
    parameters={"type": "object", "properties": {}, "required": []}
)
def tool_get_disk_usage() -> Dict[str, Any]:
    telemetry = get_detailed_telemetry()
    free = telemetry.get("disk_free_gb", 0.0)
    total = telemetry.get("disk_total_gb", 0.0)
    pct = telemetry.get("disk_percent", 0.0)
    return {"success": True, "disk_free_gb": free, "disk_total_gb": total, "disk_percent": pct, "message": f"Disk space: {free} GB free out of {total} GB total ({pct}% used)."}

@tool_registry.register(
    "set_master_volume",
    "Sets system master audio speaker volume level percentage (0 to 100).",
    parameters={
        "type": "object",
        "properties": {
            "level_percent": {"type": "integer", "description": "Target volume percentage (0 to 100)."},
            "level": {"type": "integer", "description": "Target volume percentage (0 to 100)."}
        },
        "required": []
    }
)
def tool_set_master_volume(level_percent: Optional[int] = None, level: Optional[int] = None) -> Dict[str, Any]:
    target = level_percent if level_percent is not None else level
    if target is None:
        return {"success": False, "message": "Volume level must be specified."}
    return set_master_volume(target)

@tool_registry.register(
    "get_master_volume",
    "Retrieves current master audio volume percentage state.",
    parameters={"type": "object", "properties": {}, "required": []}
)
def tool_get_master_volume() -> Dict[str, Any]:
    return get_master_volume()

@tool_registry.register(
    "set_screen_brightness",
    "Sets monitor screen brightness level percentage (0 to 100).",
    parameters={
        "type": "object",
        "properties": {
            "level_percent": {"type": "integer", "description": "Target brightness percentage (0 to 100)."},
            "level": {"type": "integer", "description": "Target brightness percentage (0 to 100)."}
        },
        "required": []
    }
)
def tool_set_screen_brightness(level_percent: Optional[int] = None, level: Optional[int] = None) -> Dict[str, Any]:
    target = level_percent if level_percent is not None else level
    if target is None:
        return {"success": False, "message": "Brightness level must be specified."}
    return set_screen_brightness(target)

@tool_registry.register(
    "get_screen_brightness",
    "Retrieves current monitor screen brightness percentage state.",
    parameters={"type": "object", "properties": {}, "required": []}
)
def tool_get_screen_brightness() -> Dict[str, Any]:
    return get_screen_brightness()

@tool_registry.register(
    "list_running_processes",
    "Lists active running system processes sorted by CPU and RAM utilization.",
    parameters={
        "type": "object",
        "properties": {
            "limit": {"type": "integer", "description": "Max number of processes to return (default: 15)."}
        },
        "required": []
    }
)
def tool_list_running_processes(limit: int = 15) -> Dict[str, Any]:
    return list_running_processes(limit)

@tool_registry.register(
    "terminate_process",
    "Terminates an active running application process by name or PID.",
    parameters={
        "type": "object",
        "properties": {
            "process_name_or_pid": {"type": "string", "description": "Process executable name (e.g. chrome.exe) or Process ID integer."}
        },
        "required": ["process_name_or_pid"]
    }
)
def tool_terminate_process(process_name_or_pid: str) -> Dict[str, Any]:
    return terminate_process(process_name_or_pid)

@tool_registry.register(
    "lock_workstation",
    "Locks the user PC screen immediately.",
    parameters={"type": "object", "properties": {}, "required": []}
)
def tool_lock_workstation() -> Dict[str, Any]:
    return lock_workstation()

@tool_registry.register(
    "sleep_system",
    "Puts the computer into sleep / suspend mode.",
    parameters={"type": "object", "properties": {}, "required": []}
)
def tool_sleep_system() -> Dict[str, Any]:
    return sleep_system()

@tool_registry.register(
    "shutdown_system",
    "Initiates system shutdown (DANGEROUS: requires user confirmation).",
    parameters={
        "type": "object",
        "properties": {
            "confirmed": {"type": "boolean", "description": "Set to true only if user explicitly confirmed shutdown."}
        },
        "required": []
    }
)
def tool_shutdown_system(confirmed: bool = False) -> Dict[str, Any]:
    return shutdown_system(confirmed)

@tool_registry.register(
    "restart_system",
    "Initiates computer reboot (DANGEROUS: requires user confirmation).",
    parameters={
        "type": "object",
        "properties": {
            "confirmed": {"type": "boolean", "description": "Set to true only if user explicitly confirmed restart."}
        },
        "required": []
    }
)
def tool_restart_system(confirmed: bool = False) -> Dict[str, Any]:
    return restart_system(confirmed)

# ------------------------------------------------------------------------------
# Vision & Screen Tools
# ------------------------------------------------------------------------------

@tool_registry.register(
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

@tool_registry.register(
    "get_active_window",
    "Returns title, process ID, and dimensions of the currently focused desktop window.",
    parameters={"type": "object", "properties": {}, "required": []}
)
def tool_get_active_window() -> Dict[str, Any]:
    return screen_vision.get_active_window_info()

# ------------------------------------------------------------------------------
# Persistent Memory Tools
# ------------------------------------------------------------------------------

@tool_registry.register(
    "remember_fact",
    "Saves a user preference, project folder path, or personal fact into long-term SQLite memory.",
    parameters={
        "type": "object",
        "properties": {
            "key": {"type": "string", "description": "Identifier key for the memory (e.g. main_project_path, preferred_browser)."},
            "value": {"type": "string", "description": "Content value of the memory to save."},
            "category": {"type": "string", "description": "Optional category (e.g. preferences, paths, notes)."}
        },
        "required": ["key", "value"]
    }
)
def tool_remember_fact(key: str, value: str, category: str = "general") -> Dict[str, Any]:
    return memory_manager.remember_fact(key, value, category)

@tool_registry.register(
    "recall_fact",
    "Retrieves a saved user preference or fact from long-term SQLite memory by key.",
    parameters={
        "type": "object",
        "properties": {
            "key": {"type": "string", "description": "Memory key identifier to search."}
        },
        "required": ["key"]
    }
)
def tool_recall_fact(key: str) -> Dict[str, Any]:
    return memory_manager.recall_fact(key)

@tool_registry.register(
    "list_memories",
    "Lists all saved long-term user memories and preferences stored in SQLite.",
    parameters={
        "type": "object",
        "properties": {
            "category": {"type": "string", "description": "Optional memory category filter."}
        },
        "required": []
    }
)
def tool_list_memories(category: Optional[str] = None) -> Dict[str, Any]:
    return memory_manager.list_memories(category)

@tool_registry.register(
    "forget_memory",
    "Deletes a saved long-term memory entry from SQLite by key.",
    parameters={
        "type": "object",
        "properties": {
            "key": {"type": "string", "description": "Memory key identifier to delete."}
        },
        "required": ["key"]
    }
)
def tool_forget_memory(key: str) -> Dict[str, Any]:
    return memory_manager.forget_memory(key)

# ------------------------------------------------------------------------------
# Web Automation & Browsing Tools
# ------------------------------------------------------------------------------

@tool_registry.register(
    "open_website",
    "Opens a web URL or domain (e.g. youtube.com, github.com) in the default web browser.",
    parameters={
        "type": "object",
        "properties": {
            "url": {"type": "string", "description": "Web URL or domain name to open."}
        },
        "required": ["url"]
    }
)
def tool_open_website(url: str) -> Dict[str, Any]:
    return browser_engine.open_website(url)

@tool_registry.register(
    "web_search",
    "Searches Google/web for a query string in the default web browser.",
    parameters={
        "type": "object",
        "properties": {
            "query": {"type": "string", "description": "Web search query."}
        },
        "required": ["query"]
    }
)
def tool_web_search(query: str) -> Dict[str, Any]:
    return browser_engine.web_search(query)
