# ==============================================================================
# FILE: backend/tools/tool_registry.py
# WHAT THIS FILE IS: Extensible Tool Calling & Automation Registry for Phoenix AI.
# WHY IT IS USED: Registers and executes Python system tools (computer control, 
#                 app launching, file operations, system stats) called by Phoenix.
# ==============================================================================

import os
import sys
import platform
import psutil
from typing import Dict, Any, Callable, List

class ToolRegistry:
    def __init__(self):
        self._tools: Dict[str, Callable] = {}
        self._schemas: List[Dict[str, Any]] = []

    def register(self, name: str, description: str):
        """Decorator to register a function as an executable tool for Phoenix AI."""
        def decorator(func: Callable):
            self._tools[name] = func
            self._schemas.append({
                "name": name,
                "description": description,
            })
            return func
        return decorator

    def execute(self, name: str, **kwargs) -> Any:
        """Executes a registered tool by name with arguments."""
        if name not in self._tools:
            return {"error": f"Tool '{name}' not found."}
        try:
            return self._tools[name](**kwargs)
        except Exception as e:
            return {"error": f"Failed to execute tool '{name}': {str(e)}"}

    def get_tools_schema(self) -> List[Dict[str, Any]]:
        """Returns schemas for registered tools."""
        return self._schemas


# Global tool registry instance for Phoenix AI
tool_registry = ToolRegistry()

# ------------------------------------------------------------------------------
# Core Phase 1 & Phase 2 Registered System Tools
# ------------------------------------------------------------------------------

@tool_registry.register("get_system_telemetry", "Fetches live CPU, RAM, Disk usage, and system OS metrics.")
def get_system_telemetry() -> Dict[str, Any]:
    """Returns live CPU %, RAM %, Disk %, and OS telemetry data."""
    from backend.tools.system_control import get_detailed_telemetry
    return get_detailed_telemetry()

@tool_registry.register("open_application", "Launches a desktop application by name (e.g. notepad, chrome, calc, code).")
def open_application(app_name: str) -> Dict[str, Any]:
    """Launches an application by name or executable command."""
    clean_name = app_name.lower().strip()
    apps = {
        "notepad": "notepad.exe",
        "calculator": "calc.exe",
        "calc": "calc.exe",
        "cmd": "cmd.exe",
        "terminal": "cmd.exe",
        "chrome": "start chrome",
        "vscode": "code",
        "code": "code",
        "spotify": "start spotify",
        "explorer": "explorer.exe",
    }
    cmd = apps.get(clean_name, clean_name)
    try:
        os.system(cmd)
        return {"status": "success", "message": f"Opened '{app_name}' successfully."}
    except Exception as e:
        return {"status": "error", "message": f"Failed to open '{app_name}': {str(e)}"}

# --- Phase 2: System Control Registrations ---

@tool_registry.register("set_master_volume", "Sets master audio volume percentage (0 to 100).")
def tool_set_master_volume(level_percent: int) -> Dict[str, Any]:
    from backend.tools.system_control import set_master_volume
    return set_master_volume(level_percent)

@tool_registry.register("get_master_volume", "Gets current master audio volume state.")
def tool_get_master_volume() -> Dict[str, Any]:
    from backend.tools.system_control import get_master_volume
    return get_master_volume()

@tool_registry.register("set_screen_brightness", "Sets screen brightness level (0 to 100).")
def tool_set_screen_brightness(level_percent: int) -> Dict[str, Any]:
    from backend.tools.system_control import set_screen_brightness
    return set_screen_brightness(level_percent)

@tool_registry.register("list_running_processes", "Lists top running system processes by CPU and memory usage.")
def tool_list_running_processes(limit: int = 15) -> Dict[str, Any]:
    from backend.tools.system_control import list_running_processes
    return list_running_processes(limit)

@tool_registry.register("terminate_process", "Terminates a active running process by process name or PID.")
def tool_terminate_process(process_name_or_pid: str) -> Dict[str, Any]:
    from backend.tools.system_control import terminate_process
    return terminate_process(process_name_or_pid)

@tool_registry.register("lock_workstation", "Locks the user's PC screen immediately.")
def tool_lock_workstation() -> Dict[str, Any]:
    from backend.tools.system_control import lock_workstation
    return lock_workstation()

@tool_registry.register("sleep_system", "Puts the computer into sleep / suspend mode.")
def tool_sleep_system() -> Dict[str, Any]:
    from backend.tools.system_control import sleep_system
    return sleep_system()

@tool_registry.register("shutdown_system", "Initiates system shutdown (requires user confirmation).")
def tool_shutdown_system(confirmed: bool = False) -> Dict[str, Any]:
    from backend.tools.system_control import shutdown_system
    return shutdown_system(confirmed)

@tool_registry.register("restart_system", "Initiates system reboot (requires user confirmation).")
def tool_restart_system(confirmed: bool = False) -> Dict[str, Any]:
    from backend.tools.system_control import restart_system
    return restart_system(confirmed)
