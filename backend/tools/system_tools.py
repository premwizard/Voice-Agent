# ==============================================================================
# FILE: backend/tools/system_tools.py
# WHAT THIS FILE IS: System Automation Tool Definitions.
# WHY IT IS USED: Registers system capability functions (volume, brightness, power, 
#                 processes, telemetry) onto the tool registry cleanly.
# ==============================================================================

from typing import Dict, Any, Optional
from services.system.volume_service import volume_service
from services.system.brightness_service import brightness_service
from services.system.power_service import power_service
from services.system.process_service import process_service
from services.system.telemetry_service import telemetry_service

def register_system_tools(registry):
    """Registers system control tool definitions onto the provided ToolRegistry instance."""

    @registry.register(
        "get_system_telemetry",
        "Fetches live system status telemetry (CPU usage %, RAM GB used/%, Disk free GB/%, and Battery level).",
        parameters={"type": "object", "properties": {}, "required": []}
    )
    def tool_get_system_telemetry() -> Dict[str, Any]:
        return telemetry_service.get_telemetry()

    @registry.register(
        "get_cpu_usage",
        "Retrieves current system CPU utilization percentage.",
        parameters={"type": "object", "properties": {}, "required": []}
    )
    def tool_get_cpu_usage() -> Dict[str, Any]:
        telemetry = telemetry_service.get_telemetry()
        cpu_val = telemetry.get("cpu_usage_percent", 0.0)
        return {"success": True, "cpu_usage_percent": cpu_val, "message": f"CPU usage is currently at {cpu_val}%."}

    @registry.register(
        "get_memory_usage",
        "Retrieves current system RAM / Memory usage percentage and used GB.",
        parameters={"type": "object", "properties": {}, "required": []}
    )
    def tool_get_memory_usage() -> Dict[str, Any]:
        telemetry = telemetry_service.get_telemetry()
        used = telemetry.get("ram_used_gb", 0.0)
        total = telemetry.get("ram_total_gb", 0.0)
        pct = telemetry.get("ram_percent", 0.0)
        return {"success": True, "ram_used_gb": used, "ram_total_gb": total, "ram_percent": pct, "message": f"RAM usage is currently at {pct}% ({used} GB / {total} GB)."}

    @registry.register(
        "get_disk_usage",
        "Retrieves total and available hard disk storage space in GB.",
        parameters={"type": "object", "properties": {}, "required": []}
    )
    def tool_get_disk_usage() -> Dict[str, Any]:
        telemetry = telemetry_service.get_telemetry()
        free = telemetry.get("disk_free_gb", 0.0)
        total = telemetry.get("disk_total_gb", 0.0)
        pct = telemetry.get("disk_percent", 0.0)
        return {"success": True, "disk_free_gb": free, "disk_total_gb": total, "disk_percent": pct, "message": f"Disk space: {free} GB free out of {total} GB total ({pct}% used)."}

    @registry.register(
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
        return volume_service.set_volume(target)

    @registry.register(
        "get_master_volume",
        "Retrieves current master audio volume percentage state.",
        parameters={"type": "object", "properties": {}, "required": []}
    )
    def tool_get_master_volume() -> Dict[str, Any]:
        return volume_service.get_volume()

    @registry.register(
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
        return brightness_service.set_brightness(target)

    @registry.register(
        "get_screen_brightness",
        "Retrieves current monitor screen brightness percentage state.",
        parameters={"type": "object", "properties": {}, "required": []}
    )
    def tool_get_screen_brightness() -> Dict[str, Any]:
        return brightness_service.get_brightness()

    @registry.register(
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
        return process_service.list_running_processes(limit)

    @registry.register(
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
        return process_service.terminate_process(process_name_or_pid)

    @registry.register(
        "lock_workstation",
        "Locks the user PC screen immediately.",
        parameters={"type": "object", "properties": {}, "required": []}
    )
    def tool_lock_workstation() -> Dict[str, Any]:
        return power_service.lock_workstation()

    @registry.register(
        "sleep_system",
        "Puts the computer into sleep / suspend mode.",
        parameters={"type": "object", "properties": {}, "required": []}
    )
    def tool_sleep_system() -> Dict[str, Any]:
        return power_service.sleep_system()

    @registry.register(
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
        return power_service.shutdown_system(confirmed)

    @registry.register(
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
        return power_service.restart_system(confirmed)
