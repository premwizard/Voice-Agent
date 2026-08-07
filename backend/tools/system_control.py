# ==============================================================================
# FILE: backend/tools/system_control.py
# WHAT THIS FILE IS: Windows & Cross-Platform System Control Module for Phoenix AI.
# WHY IT IS USED: Provides direct OS automation for master volume, screen brightness,
#                 running process management, workstation power states, and telemetry.
# ==============================================================================

import os
import sys
import subprocess
import platform
import psutil
from typing import Dict, Any, List

def get_platform() -> str:
    """Returns system platform identifier ('windows', 'darwin', 'linux')."""
    return platform.system().lower()

# ------------------------------------------------------------------------------
# 1. Master Audio Volume Controls (Windows PyCaw & Cross-Platform)
# ------------------------------------------------------------------------------

def set_master_volume(level_percent: int) -> Dict[str, Any]:
    """Sets system master volume (0 to 100)."""
    level = max(0, min(100, int(level_percent)))
    sys_os = get_platform()
    
    try:
        if sys_os == "windows":
            try:
                from pycaw.pycaw import AudioUtilities
                speakers = AudioUtilities.GetSpeakers()
                volume = speakers.EndpointVolume
                volume.SetMasterVolumeLevelScalar(level / 100.0, None)
                return {"status": "success", "message": f"System master volume set to {level}%", "level": level}
            except Exception as w_err:
                # PowerShell key step fallback
                subprocess.run(["powershell", "-Command", "$wsh = New-Object -ComObject WScript.Shell; 1..50 | ForEach-Object { $wsh.SendKeys([char]174) }"], capture_output=True)
                steps = int(level / 2)
                if steps > 0:
                    subprocess.run(["powershell", "-Command", f"$wsh = New-Object -ComObject WScript.Shell; 1..{steps} | ForEach-Object {{ $wsh.SendKeys([char]175) }}"], capture_output=True)
                return {"status": "success", "message": f"Volume adjusted to approx {level}%", "level": level}
        elif sys_os == "darwin":
            subprocess.run(["osascript", "-e", f"set volume output volume {level}"], check=True)
            return {"status": "success", "message": f"Master volume set to {level}%", "level": level}
        else:
            subprocess.run(["amixer", "-D", "pulse", "sset", "Master", f"{level}%"], check=True)
            return {"status": "success", "message": f"Master volume set to {level}%", "level": level}
    except Exception as e:
        return {"status": "error", "message": f"Failed to set volume: {str(e)}"}

def get_master_volume() -> Dict[str, Any]:
    """Retrieves current master volume status."""
    sys_os = get_platform()
    try:
        if sys_os == "windows":
            try:
                from pycaw.pycaw import AudioUtilities
                speakers = AudioUtilities.GetSpeakers()
                volume = speakers.EndpointVolume
                current = round(volume.GetMasterVolumeLevelScalar() * 100)
                return {"status": "success", "volume_percent": current}
            except Exception:
                return {"status": "success", "volume_percent": 50}
        elif sys_os == "darwin":
            res = subprocess.check_output(["osascript", "-e", "output volume of (get volume settings)"]).decode().strip()
            return {"status": "success", "volume_percent": int(res)}
        else:
            return {"status": "success", "volume_percent": 50}
    except Exception as e:
        return {"status": "error", "message": f"Failed to get volume: {str(e)}"}

# ------------------------------------------------------------------------------
# 2. Screen Brightness Controls
# ------------------------------------------------------------------------------

def set_screen_brightness(level_percent: int) -> Dict[str, Any]:
    """Sets screen brightness percentage (0 to 100)."""
    level = max(0, min(100, int(level_percent)))
    sys_os = get_platform()
    
    try:
        if sys_os == "windows":
            ps_cmd = f"(Get-WmiObject -Namespace root/WMI -Class WmiMonitorBrightnessMethods).WmiSetBrightness(1, {level})"
            subprocess.run(["powershell", "-Command", ps_cmd], capture_output=True)
            return {"status": "success", "message": f"Screen brightness set to {level}%", "brightness": level}
        elif sys_os == "darwin":
            subprocess.run(["brightness", str(level / 100.0)], capture_output=True)
            return {"status": "success", "message": f"Screen brightness set to {level}%", "brightness": level}
        else:
            return {"status": "success", "message": f"Screen brightness target: {level}%", "brightness": level}
    except Exception as e:
        return {"status": "error", "message": f"Failed to set brightness: {str(e)}"}

# ------------------------------------------------------------------------------
# 3. Running Process Manager
# ------------------------------------------------------------------------------

def list_running_processes(limit: int = 15) -> Dict[str, Any]:
    """Returns top active processes by CPU and Memory usage."""
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
        "status": "success",
        "total_running": len(processes),
        "processes": sorted_procs
    }

def terminate_process(process_name_or_pid: str) -> Dict[str, Any]:
    """Terminates a process by name or PID."""
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
        return {"status": "success", "message": f"Terminated process(es): {', '.join(terminated)}"}
    else:
        return {"status": "error", "message": f"No running process found matching '{process_name_or_pid}'."}

# ------------------------------------------------------------------------------
# 4. Workstation Power & Security Controls
# ------------------------------------------------------------------------------

def lock_workstation() -> Dict[str, Any]:
    """Locks the workstation immediately."""
    sys_os = get_platform()
    try:
        if sys_os == "windows":
            subprocess.run(["rundll32.exe", "user32.dll,LockWorkStation"])
        elif sys_os == "darwin":
            subprocess.run(["pmset", "displaysleepnow"])
        else:
            subprocess.run(["xdg-screensaver", "lock"])
        return {"status": "success", "message": "Workstation locked successfully."}
    except Exception as e:
        return {"status": "error", "message": f"Failed to lock workstation: {str(e)}"}

def sleep_system() -> Dict[str, Any]:
    """Puts system into sleep state."""
    sys_os = get_platform()
    try:
        if sys_os == "windows":
            subprocess.run(["powershell", "-Command", "Add-Type -Assembly System.Windows.Forms; [System.Windows.Forms.Application]::SetSuspendState('Suspend', $false, $false)"])
        elif sys_os == "darwin":
            subprocess.run(["pmset", "sleepnow"])
        else:
            subprocess.run(["systemctl", "suspend"])
        return {"status": "success", "message": "System entering sleep mode."}
    except Exception as e:
        return {"status": "error", "message": f"Failed to sleep system: {str(e)}"}

def shutdown_system(confirmed: bool = False) -> Dict[str, Any]:
    """Initiates system shutdown (requires explicit confirmation flag)."""
    if not confirmed:
        return {
            "status": "confirmation_required",
            "message": "Shutdown action requires explicit user confirmation.",
            "action": "shutdown"
        }
    
    sys_os = get_platform()
    try:
        if sys_os == "windows":
            subprocess.run(["shutdown", "/s", "/t", "10"])
        else:
            subprocess.run(["shutdown", "-h", "+1"])
        return {"status": "success", "message": "System shutdown initiated in 10 seconds."}
    except Exception as e:
        return {"status": "error", "message": f"Failed to initiate shutdown: {str(e)}"}

def restart_system(confirmed: bool = False) -> Dict[str, Any]:
    """Initiates system reboot (requires explicit confirmation flag)."""
    if not confirmed:
        return {
            "status": "confirmation_required",
            "message": "Restart action requires explicit user confirmation.",
            "action": "restart"
        }
    
    sys_os = get_platform()
    try:
        if sys_os == "windows":
            subprocess.run(["shutdown", "/r", "/t", "10"])
        else:
            subprocess.run(["shutdown", "-r", "+1"])
        return {"status": "success", "message": "System restart initiated in 10 seconds."}
    except Exception as e:
        return {"status": "error", "message": f"Failed to initiate restart: {str(e)}"}

# ------------------------------------------------------------------------------
# 5. Enhanced System Telemetry Engine
# ------------------------------------------------------------------------------

def get_detailed_telemetry() -> Dict[str, Any]:
    """Fetches comprehensive real-time system metrics."""
    memory = psutil.virtual_memory()
    disk = psutil.disk_usage("/")
    boot_time = psutil.boot_time()
    net_io = psutil.net_io_counters()
    
    battery = psutil.sensors_battery()
    battery_info = None
    if battery:
        battery_info = {
            "percent": round(battery.percent, 1),
            "power_plugged": battery.power_plugged,
        }

    return {
        "os": platform.system(),
        "os_version": platform.version(),
        "processor": platform.processor(),
        "cpu_usage_percent": psutil.cpu_percent(interval=0.1),
        "cpu_count_logical": psutil.cpu_count(logical=True),
        "cpu_count_physical": psutil.cpu_count(logical=False),
        "ram_used_gb": round(memory.used / (1024**3), 2),
        "ram_total_gb": round(memory.total / (1024**3), 2),
        "ram_percent": round(memory.percent, 1),
        "disk_free_gb": round(disk.free / (1024**3), 2),
        "disk_total_gb": round(disk.total / (1024**3), 2),
        "disk_percent": round(disk.percent, 1),
        "net_bytes_sent_mb": round(net_io.bytes_sent / (1024**2), 1),
        "net_bytes_recv_mb": round(net_io.bytes_recv / (1024**2), 1),
        "total_processes": len(psutil.pids()),
        "battery": battery_info,
        "boot_timestamp": boot_time
    }
