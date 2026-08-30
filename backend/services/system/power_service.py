# ==============================================================================
# FILE: backend/services/system/power_service.py
# WHAT THIS FILE IS: System Power & Workstation Security Service.
# WHY IT IS USED: Handles workstation locking, sleep state, system shutdown, 
#                 and reboot controls safely with confirmation checks.
# ==============================================================================

import subprocess
import platform
from typing import Dict, Any
from core.exceptions import SystemControlError

def get_platform() -> str:
    return platform.system().lower()

class PowerService:
    """Service handling workstation locking, suspend mode, and power lifecycle controls."""

    def lock_workstation(self) -> Dict[str, Any]:
        """Locks the active workstation screen immediately."""
        sys_os = get_platform()
        try:
            if sys_os == "windows":
                subprocess.run(["rundll32.exe", "user32.dll,LockWorkStation"])
            elif sys_os == "darwin":
                subprocess.run(["pmset", "displaysleepnow"])
            else:
                subprocess.run(["xdg-screensaver", "lock"])
            return {"success": True, "message": "Workstation screen locked successfully."}
        except Exception as e:
            raise SystemControlError(f"Failed to lock workstation: {str(e)}")

    def sleep_system(self) -> Dict[str, Any]:
        """Puts computer into sleep / suspend mode."""
        sys_os = get_platform()
        try:
            if sys_os == "windows":
                subprocess.run(["powershell", "-Command", "Add-Type -Assembly System.Windows.Forms; [System.Windows.Forms.Application]::SetSuspendState('Suspend', $false, $false)"])
            elif sys_os == "darwin":
                subprocess.run(["pmset", "sleepnow"])
            else:
                subprocess.run(["systemctl", "suspend"])
            return {"success": True, "message": "System is entering sleep mode."}
        except Exception as e:
            raise SystemControlError(f"Failed to put system to sleep: {str(e)}")

    def shutdown_system(self, confirmed: bool = False) -> Dict[str, Any]:
        """Initiates system shutdown (Protected: requires explicit confirmation)."""
        if not confirmed:
            return {
                "success": False,
                "requires_confirmation": True,
                "message": "Shutdown action is DANGEROUS and requires explicit user confirmation."
            }
        
        sys_os = get_platform()
        try:
            if sys_os == "windows":
                subprocess.run(["shutdown", "/s", "/t", "10"])
            else:
                subprocess.run(["shutdown", "-h", "+1"])
            return {"success": True, "message": "System shutdown initiated in 10 seconds."}
        except Exception as e:
            raise SystemControlError(f"Failed to initiate shutdown: {str(e)}")

    def restart_system(self, confirmed: bool = False) -> Dict[str, Any]:
        """Initiates computer reboot (Protected: requires explicit confirmation)."""
        if not confirmed:
            return {
                "success": False,
                "requires_confirmation": True,
                "message": "Reboot action is DANGEROUS and requires explicit user confirmation."
            }
        
        sys_os = get_platform()
        try:
            if sys_os == "windows":
                subprocess.run(["shutdown", "/r", "/t", "10"])
            else:
                subprocess.run(["shutdown", "-r", "+1"])
            return {"success": True, "message": "System restart initiated in 10 seconds."}
        except Exception as e:
            raise SystemControlError(f"Failed to initiate restart: {str(e)}")

power_service = PowerService()
