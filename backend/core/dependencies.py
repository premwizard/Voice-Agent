# ==============================================================================
# FILE: backend/core/dependencies.py
# WHAT THIS FILE IS: Centralized Dependency Injection Container for Phoenix AI.
# WHY IT IS USED: Exports service singletons and providers so controllers, services, 
#                 and test suites can inject dependencies without hardcoded imports.
# ==============================================================================

from services.system.volume_service import volume_service, VolumeService
from services.system.brightness_service import brightness_service, BrightnessService
from services.system.power_service import power_service, PowerService
from services.system.process_service import process_service, ProcessService
from services.system.telemetry_service import telemetry_service, TelemetryService
from tools.tool_registry import tool_registry, ToolRegistry
from memory.memory_manager import memory_manager, MemoryManager

class Container:
    """Dependency injection container holding default singleton references."""
    def __init__(self):
        self.volume_service: VolumeService = volume_service
        self.brightness_service: BrightnessService = brightness_service
        self.power_service: PowerService = power_service
        self.process_service: ProcessService = process_service
        self.telemetry_service: TelemetryService = telemetry_service
        self.tool_registry: ToolRegistry = tool_registry
        self.memory_manager: MemoryManager = memory_manager

# Global container instance
container = Container()

def get_volume_service() -> VolumeService:
    return container.volume_service

def get_brightness_service() -> BrightnessService:
    return container.brightness_service

def get_power_service() -> PowerService:
    return container.power_service

def get_process_service() -> ProcessService:
    return container.process_service

def get_telemetry_service() -> TelemetryService:
    return container.telemetry_service

def get_tool_registry() -> ToolRegistry:
    return container.tool_registry

def get_memory_manager() -> MemoryManager:
    return container.memory_manager
