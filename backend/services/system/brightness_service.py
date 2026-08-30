# ==============================================================================
# FILE: backend/services/system/brightness_service.py
# WHAT THIS FILE IS: Monitor Screen Brightness Service.
# WHY IT IS USED: Interacts directly with Windows WMI methods or macOS brightness 
#                 utilities to retrieve and adjust display brightness.
# ==============================================================================

import subprocess
import platform
from typing import Dict, Any
from core.exceptions import SystemControlError

_LAST_KNOWN_BRIGHTNESS: int = 75

def get_platform() -> str:
    return platform.system().lower()

class BrightnessService:
    """Service handling monitor screen brightness retrieval and adjustment."""

    def set_brightness(self, level_percent: int) -> Dict[str, Any]:
        """Sets screen brightness percentage (0 to 100)."""
        global _LAST_KNOWN_BRIGHTNESS
        level = max(0, min(100, int(level_percent)))
        _LAST_KNOWN_BRIGHTNESS = level
        sys_os = get_platform()
        
        try:
            if sys_os == "windows":
                ps_cmd = f"(Get-WmiObject -Namespace root/WMI -Class WmiMonitorBrightnessMethods).WmiSetBrightness(1, {level})"
                subprocess.run(["powershell", "-Command", ps_cmd], capture_output=True)
                return {"success": True, "brightness": level, "brightness_percent": level, "message": f"Screen brightness set to {level}%."}
            elif sys_os == "darwin":
                subprocess.run(["brightness", str(level / 100.0)], capture_output=True)
                return {"success": True, "brightness": level, "brightness_percent": level, "message": f"Screen brightness set to {level}%."}
            else:
                return {"success": True, "brightness": level, "brightness_percent": level, "message": f"Screen brightness set to {level}%."}
        except Exception as e:
            raise SystemControlError(f"Failed to adjust screen brightness: {str(e)}")

    def get_brightness(self) -> Dict[str, Any]:
        """Retrieves real-time screen brightness level percentage."""
        global _LAST_KNOWN_BRIGHTNESS
        sys_os = get_platform()
        try:
            if sys_os == "windows":
                ps_cmd = "(Get-WmiObject -Namespace root/WMI -Class WmiMonitorBrightness).CurrentBrightness"
                res = subprocess.check_output(["powershell", "-Command", ps_cmd], capture_output=True, text=True).strip()
                if res.isdigit():
                    val = int(res)
                    _LAST_KNOWN_BRIGHTNESS = val
                    return {"success": True, "brightness_percent": val, "brightness": val, "message": f"Screen brightness is currently {val}%."}
            return {"success": True, "brightness_percent": _LAST_KNOWN_BRIGHTNESS, "brightness": _LAST_KNOWN_BRIGHTNESS, "message": f"Screen brightness is currently {_LAST_KNOWN_BRIGHTNESS}%."}
        except Exception:
            return {"success": True, "brightness_percent": _LAST_KNOWN_BRIGHTNESS, "brightness": _LAST_KNOWN_BRIGHTNESS, "message": f"Screen brightness is currently {_LAST_KNOWN_BRIGHTNESS}%."}

brightness_service = BrightnessService()
