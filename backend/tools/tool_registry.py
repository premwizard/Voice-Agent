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
# Core Phase 1 Registered System Tools
# ------------------------------------------------------------------------------

@tool_registry.register("get_system_telemetry", "Fetches live CPU, RAM, Disk usage, and system OS metrics.")
def get_system_telemetry() -> Dict[str, Any]:
    """Returns live CPU %, RAM %, Disk %, and OS telemetry data."""
    memory = psutil.virtual_memory()
    disk = psutil.disk_usage("/")
    return {
        "os": platform.system(),
        "os_release": platform.release(),
        "cpu_usage_percent": psutil.cpu_percent(interval=0.1),
        "ram_used_gb": round(memory.used / (1024**3), 2),
        "ram_total_gb": round(memory.total / (1024**3), 2),
        "ram_percent": memory.percent,
        "disk_free_gb": round(disk.free / (1024**3), 2),
        "disk_percent": disk.percent,
    }

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
    }
    cmd = apps.get(clean_name, clean_name)
    try:
        os.system(cmd)
        return {"status": "success", "message": f"Opened '{app_name}' successfully."}
    except Exception as e:
        return {"status": "error", "message": f"Failed to open '{app_name}': {str(e)}"}
