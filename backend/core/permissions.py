# ==============================================================================
# FILE: backend/core/permissions.py
# WHAT THIS FILE IS: Security & Permission Level Classification Layer for Phoenix AI.
# WHY IT IS USED: Prevents unauthorized or accidental execution of high-risk 
#                 system commands by enforcing permission levels and requiring explicit 
#                 confirmation for dangerous actions.
# ==============================================================================

from enum import Enum
from typing import Dict, Any

class PermissionLevel(str, Enum):
    SAFE = "SAFE"            # Read-only operations, opening apps, stats (auto-execute)
    SENSITIVE = "SENSITIVE"  # Terminating apps, changing settings (log & warn)
    DANGEROUS = "DANGEROUS"  # Workstation reboot, shutdown, bulk deletion (requires user confirmation)

# Mapping of registered tool names to permission levels
TOOL_PERMISSIONS: Dict[str, PermissionLevel] = {
    # Safe Operations
    "open_application": PermissionLevel.SAFE,
    "list_applications": PermissionLevel.SAFE,
    "get_system_telemetry": PermissionLevel.SAFE,
    "get_cpu_usage": PermissionLevel.SAFE,
    "get_memory_usage": PermissionLevel.SAFE,
    "get_disk_usage": PermissionLevel.SAFE,
    "get_master_volume": PermissionLevel.SAFE,
    "set_master_volume": PermissionLevel.SAFE,
    "set_screen_brightness": PermissionLevel.SAFE,
    "list_running_processes": PermissionLevel.SAFE,
    "lock_workstation": PermissionLevel.SAFE,
    "sleep_system": PermissionLevel.SAFE,
    
    # Sensitive Operations
    "terminate_process": PermissionLevel.SENSITIVE,
    "close_application": PermissionLevel.SENSITIVE,
    
    # Dangerous Operations
    "shutdown_system": PermissionLevel.DANGEROUS,
    "restart_system": PermissionLevel.DANGEROUS,
}

def get_tool_permission_level(tool_name: str) -> PermissionLevel:
    """Returns the permission level for a given tool name."""
    return TOOL_PERMISSIONS.get(tool_name, PermissionLevel.SAFE)

def evaluate_permission(tool_name: str, arguments: Dict[str, Any], user_confirmed: bool = False) -> Dict[str, Any]:
    """
    Evaluates whether a tool can be executed automatically or if explicit confirmation is required.
    
    Returns dict with:
      - allowed: bool
      - requires_confirmation: bool
      - message: str
    """
    level = get_tool_permission_level(tool_name)
    
    if level == PermissionLevel.DANGEROUS and not user_confirmed:
        return {
            "allowed": False,
            "requires_confirmation": True,
            "permission_level": level.value,
            "message": f"Action '{tool_name}' is classified as DANGEROUS and requires explicit user confirmation before executing."
        }
        
    return {
        "allowed": True,
        "requires_confirmation": False,
        "permission_level": level.value,
        "message": f"Action '{tool_name}' authorized under permission level {level.value}."
    }
