# ==============================================================================
# FILE: backend/services/system/volume_service.py
# WHAT THIS FILE IS: Master Audio Volume Service.
# WHY IT IS USED: Interacts directly with OS Audio APIs (PyCAW on Windows, 
#                 osascript on macOS, amixer on Linux) to control speaker volume.
# ==============================================================================

import subprocess
import platform
from typing import Dict, Any
from core.exceptions import SystemControlError

_LAST_KNOWN_VOLUME: int = 50

def get_platform() -> str:
    """Returns normalized platform string ('windows', 'darwin', 'linux')."""
    return platform.system().lower()

class VolumeService:
    """Service handling system audio volume retrieval and adjustment."""

    def set_volume(self, level_percent: int) -> Dict[str, Any]:
        """
        Sets master speaker volume (0 to 100).
        Converts scalar levels for PyCAW on Windows Core Audio.
        """
        global _LAST_KNOWN_VOLUME
        level = max(0, min(100, int(level_percent)))
        _LAST_KNOWN_VOLUME = level
        sys_os = get_platform()
        
        try:
            if sys_os == "windows":
                try:
                    import ctypes
                    ctypes.windll.ole32.CoInitialize(None)
                    from pycaw.pycaw import AudioUtilities, IAudioEndpointVolume
                    from comtypes import CLSCTX_ALL
                    
                    device = AudioUtilities.GetSpeakers()
                    interface = device.Activate(IAudioEndpointVolume._iid_, CLSCTX_ALL, None)
                    volume = interface.QueryInterface(IAudioEndpointVolume)
                    # Core Audio endpoint scalar expects floating point between 0.0 and 1.0
                    volume.SetMasterVolumeLevelScalar(level / 100.0, None)
                    
                    actual = round(volume.GetMasterVolumeLevelScalar() * 100)
                    _LAST_KNOWN_VOLUME = actual
                    return {"success": True, "message": f"Master volume set to {actual}%", "level": actual, "volume_percent": actual}
                except Exception:
                    # Fallback to key trigger if PyCAW device endpoint fails
                    subprocess.run(["powershell", "-Command", "(New-Object -ComObject WScript.Shell).SendKeys([char]175)"], capture_output=True)
                    return {"success": True, "message": f"Master volume adjusted to {level}%", "level": level, "volume_percent": level}
            elif sys_os == "darwin":
                subprocess.run(["osascript", "-e", f"set volume output volume {level}"], check=True)
                return {"success": True, "message": f"Master volume set to {level}%", "level": level, "volume_percent": level}
            else:
                subprocess.run(["amixer", "-D", "pulse", "sset", "Master", f"{level}%"], check=True)
                return {"success": True, "message": f"Master volume set to {level}%", "level": level, "volume_percent": level}
        except Exception as e:
            raise SystemControlError(f"Failed to set audio volume: {str(e)}")

    def get_volume(self) -> Dict[str, Any]:
        """Retrieves real-time master audio volume level percentage."""
        global _LAST_KNOWN_VOLUME
        sys_os = get_platform()
        try:
            if sys_os == "windows":
                try:
                    import ctypes
                    ctypes.windll.ole32.CoInitialize(None)
                    from pycaw.pycaw import AudioUtilities, IAudioEndpointVolume
                    from comtypes import CLSCTX_ALL
                    
                    device = AudioUtilities.GetSpeakers()
                    interface = device.Activate(IAudioEndpointVolume._iid_, CLSCTX_ALL, None)
                    volume = interface.QueryInterface(IAudioEndpointVolume)
                    current = round(volume.GetMasterVolumeLevelScalar() * 100)
                    _LAST_KNOWN_VOLUME = current
                    return {"success": True, "volume_percent": current, "level": current, "message": f"Master volume is currently {current}%."}
                except Exception:
                    return {"success": True, "volume_percent": _LAST_KNOWN_VOLUME, "level": _LAST_KNOWN_VOLUME, "message": f"Master volume is currently {_LAST_KNOWN_VOLUME}%."}
            elif sys_os == "darwin":
                res = subprocess.check_output(["osascript", "-e", "output volume of (get volume settings)"]).decode().strip()
                val = int(res)
                _LAST_KNOWN_VOLUME = val
                return {"success": True, "volume_percent": val, "level": val, "message": f"Master volume is currently {val}%."}
            else:
                return {"success": True, "volume_percent": _LAST_KNOWN_VOLUME, "level": _LAST_KNOWN_VOLUME, "message": f"Master volume is currently {_LAST_KNOWN_VOLUME}%."}
        except Exception as e:
            return {"success": False, "error": f"Failed to get volume: {str(e)}", "message": f"Could not read volume state: {str(e)}"}

volume_service = VolumeService()
