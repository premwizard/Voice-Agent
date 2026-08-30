# ==============================================================================
# FILE: backend/tools/system_control.py
# WHAT THIS FILE IS: System Control Facade / Backward-Compatibility Wrapper.
# WHY IT IS USED: Delegates requests to specialized system services 
#                 (volume_service, brightness_service, power_service, process_service, telemetry_service)
#                 so existing callers and test suites continue working seamlessly.
# ==============================================================================

from typing import Dict, Any
from services.system.volume_service import volume_service
from services.system.brightness_service import brightness_service
from services.system.power_service import power_service
from services.system.process_service import process_service
from services.system.telemetry_service import telemetry_service

def set_master_volume(level_percent: int) -> Dict[str, Any]:
    return volume_service.set_volume(level_percent)

def get_master_volume() -> Dict[str, Any]:
    return volume_service.get_volume()

def set_screen_brightness(level_percent: int) -> Dict[str, Any]:
    return brightness_service.set_brightness(level_percent)

def get_screen_brightness() -> Dict[str, Any]:
    return brightness_service.get_brightness()

def list_running_processes(limit: int = 15) -> Dict[str, Any]:
    return process_service.list_running_processes(limit)

def terminate_process(process_name_or_pid: str) -> Dict[str, Any]:
    return process_service.terminate_process(process_name_or_pid)

def lock_workstation() -> Dict[str, Any]:
    return power_service.lock_workstation()

def sleep_system() -> Dict[str, Any]:
    return power_service.sleep_system()

def shutdown_system(confirmed: bool = False) -> Dict[str, Any]:
    return power_service.shutdown_system(confirmed)

def restart_system(confirmed: bool = False) -> Dict[str, Any]:
    return power_service.restart_system(confirmed)

def get_detailed_telemetry() -> Dict[str, Any]:
    return telemetry_service.get_telemetry()
