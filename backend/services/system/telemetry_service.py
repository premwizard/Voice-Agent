# ==============================================================================
# FILE: backend/services/system/telemetry_service.py
# WHAT THIS FILE IS: System Telemetry Service.
# WHY IT IS USED: Fetches live hardware metrics (CPU, RAM, Disk, Battery) and 
#                 combines audio volume and screen brightness states into a telemetry report.
# ==============================================================================

import platform
import psutil
from typing import Dict, Any
from services.system.volume_service import volume_service
from services.system.brightness_service import brightness_service

class TelemetryService:
    """Service handling real-time workstation status monitoring and telemetry collection."""

    def get_telemetry(self) -> Dict[str, Any]:
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

        vol_data = volume_service.get_volume()
        bright_data = brightness_service.get_brightness()

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

telemetry_service = TelemetryService()
