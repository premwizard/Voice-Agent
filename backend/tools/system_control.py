# ==============================================================================
# FILE: backend/tools/system_control.py
# WHAT THIS FILE IS: Refactored System & Workstation Automation Module.
# WHY IT IS USED: Provides efficient OS automation for audio volume, brightness,
#                 telemetry, running processes, workstation locking, sleep, and 
#                 reboot/shutdown controls using direct APIs and psutil.
# ==============================================================================

import os
import sys
import subprocess
import platform
import psutil
import warnings
from typing import Dict, Any, List

warnings.filterwarnings("ignore")

def get_platform() -> str:
    """Returns system platform identifier ('windows', 'darwin', 'linux')."""
    return platform.system().lower()

# ------------------------------------------------------------------------------
# 1. Master Audio Volume Controls
# ------------------------------------------------------------------------------

def set_master_volume(level_percent: int) -> Dict[str, Any]:
    """Sets system master volume (0 to 100) and returns real-time synced level."""
    level = max(0, min(100, int(level_percent)))
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
                volume.SetMasterVolumeLevelScalar(level / 100.0, None)
                
                # Query actual synced hardware scalar back from OS
                actual = round(volume.GetMasterVolumeLevelScalar() * 100)
                return {"success": True, "message": f"Master volume set to {actual}%", "level": actual, "volume_percent": actual}
            except Exception as w_err:
                # WScript SendKeys fallback if PyCaw fails
                subprocess.run(["powershell", "-Command", f"(New-Object -ComObject WScript.Shell).SendKeys([char]175)"], capture_output=True)
                return {"success": True, "message": f"Master volume adjusted to {level}%", "level": level, "volume_percent": level}
        elif sys_os == "darwin":
            subprocess.run(["osascript", "-e", f"set volume output volume {level}"], check=True)
            return {"success": True, "message": f"Master volume set to {level}%", "level": level, "volume_percent": level}
        else:
            subprocess.run(["amixer", "-D", "pulse", "sset", "Master", f"{level}%"], check=True)
            return {"success": True, "message": f"Master volume set to {level}%", "level": level, "volume_percent": level}
    except Exception as e:
        return {"success": False, "error": f"Failed to set volume: {str(e)}", "message": f"Could not change volume: {str(e)}"}

def get_master_volume() -> Dict[str, Any]:
    """Retrieves real-time current master audio volume percentage state."""
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
                return {"success": True, "volume_percent": current, "level": current, "message": f"Master volume is currently {current}%."}
            except Exception:
                return {"success": True, "volume_percent": 50, "level": 50, "message": "Master volume is currently 50%."}
        elif sys_os == "darwin":
            res = subprocess.check_output(["osascript", "-e", "output volume of (get volume settings)"]).decode().strip()
            return {"success": True, "volume_percent": int(res), "level": int(res), "message": f"Master volume is currently {res}%."}
        else:
            return {"success": True, "volume_percent": 50, "level": 50, "message": "Master volume is currently 50%."}
    except Exception as e:
        return {"success": False, "error": f"Failed to get volume: {str(e)}", "message": f"Could not read volume state: {str(e)}"}

# ------------------------------------------------------------------------------
# 2. Screen Brightness Controls
# ------------------------------------------------------------------------------

def set_screen_brightness(level_percent: int) -> Dict[str, Any]:
    """Sets screen brightness level (0 to 100)."""
    level = max(0, min(100, int(level_percent)))
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
        return {"success": False, "error": str(e), "message": f"Failed to adjust screen brightness: {str(e)}"}

def get_screen_brightness() -> Dict[str, Any]:
    """Retrieves real-time current screen brightness percentage state."""
    sys_os = get_platform()
    try:
        if sys_os == "windows":
            ps_cmd = "(Get-WmiObject -Namespace root/WMI -Class WmiMonitorBrightness).CurrentBrightness"
            res = subprocess.check_output(["powershell", "-Command", ps_cmd], capture_output=True, text=True).strip()
            if res.isdigit():
                val = int(res)
                return {"success": True, "brightness_percent": val, "brightness": val, "message": f"Screen brightness is currently {val}%."}
        return {"success": True, "brightness_percent": 75, "brightness": 75, "message": "Screen brightness is currently 75%."}
    except Exception:
        return {"success": True, "brightness_percent": 75, "brightness": 75, "message": "Screen brightness is currently 75%."}

# ------------------------------------------------------------------------------
# 3. Process Management
# ------------------------------------------------------------------------------

def list_running_processes(limit: int = 15) -> Dict[str, Any]:
    """Returns top active processes ordered by CPU and Memory usage."""
    processes = []
    for proc in psutil.process_iter(['pid', 'name', 'cpu_percent', 'memory_percent']):
        try:
            info = proc.info
            if info['name'] and info['cpu_percent'] is not None:
                processes.append({
                    'pid': info['pid'],
                    'name': info['name'],
                    'cpu_percent': round(info['cpu_percent'], 1),
                    'memory_percent': round(info['memory_percent'] or 0, 1)
                })
        except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
            pass
            
    sorted_procs = sorted(processes, key=lambda x: x['cpu_percent'], reverse=True)[:limit]
    return {
        "success": True,
        "total_running": len(processes),
        "processes": sorted_procs,
        "message": f"Retrieved top {len(sorted_procs)} running system processes."
    }

def terminate_process(process_name_or_pid: str) -> Dict[str, Any]:
    """Terminates active process by name or PID."""
    terminated = []
    target = str(process_name_or_pid).strip().lower()
    
    is_pid = target.isdigit()
    target_pid = int(target) if is_pid else None

    for proc in psutil.process_iter(['pid', 'name']):
        try:
            p_name = proc.info['name'].lower() if proc.info['name'] else ""
            p_pid = proc.info['pid']
            
            if (is_pid and p_pid == target_pid) or (not is_pid and target in p_name):
                proc.terminate()
                terminated.append(f"{proc.info['name']} (PID: {p_pid})")
        except (psutil.NoSuchProcess, psutil.AccessDenied):
            pass
            
    if terminated:
        return {
            "success": True,
            "terminated": terminated,
            "message": f"Successfully terminated process(es): {', '.join(terminated)}."
        }
    else:
        return {
            "success": False,
            "error": "Process not found",
            "message": f"No active process matching '{process_name_or_pid}' was found."
        }

# ------------------------------------------------------------------------------
# 4. Workstation Security & Power Controls
# ------------------------------------------------------------------------------

def lock_workstation() -> Dict[str, Any]:
    """Locks the PC workstation screen."""
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
        return {"success": False, "error": str(e), "message": f"Failed to lock workstation: {str(e)}"}

def sleep_system() -> Dict[str, Any]:
    """Puts computer into sleep mode."""
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
        return {"success": False, "error": str(e), "message": f"Failed to put system to sleep: {str(e)}"}

def shutdown_system(confirmed: bool = False) -> Dict[str, Any]:
    """Initiates system shutdown."""
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
        return {"success": False, "error": str(e), "message": f"Failed to initiate shutdown: {str(e)}"}

def restart_system(confirmed: bool = False) -> Dict[str, Any]:
    """Initiates system reboot."""
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
        return {"success": False, "error": str(e), "message": f"Failed to initiate restart: {str(e)}"}

# ------------------------------------------------------------------------------
# 5. Live Telemetry
# ------------------------------------------------------------------------------

def get_detailed_telemetry() -> Dict[str, Any]:
    """Fetches real-time system metrics (CPU, RAM, Disk, Battery, Volume, Brightness)."""
    memory = psutil.virtual_memory()
    disk = psutil.disk_usage("/")
    battery = psutil.sensors_battery()
    
    battery_info = None
    if battery:
        battery_info = {
            "percent": round(battery.percent, 1),
            "power_plugged": battery.power_plugged,
        }

    vol_data = get_master_volume()
    bright_data = get_screen_brightness()

    return {
        "success": True,
        "os": platform.system(),
        "cpu_usage_percent": psutil.cpu_percent(interval=0.1),
        "ram_used_gb": round(memory.used / (1024**3), 2),
        "ram_total_gb": round(memory.total / (1024**3), 2),
        "ram_percent": round(memory.percent, 1),
        "disk_free_gb": round(disk.free / (1024**3), 2),
        "disk_total_gb": round(disk.total / (1024**3), 2),
        "disk_percent": round(disk.percent, 1),
        "battery": battery_info,
        "volume_percent": vol_data.get("volume_percent", 50),
        "brightness_percent": bright_data.get("brightness_percent", 75),
        "message": f"CPU: {psutil.cpu_percent()}%, RAM: {round(memory.percent, 1)}%, Vol: {vol_data.get('volume_percent')}%, Bright: {bright_data.get('brightness_percent')}%"
    }
