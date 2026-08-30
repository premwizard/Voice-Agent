# ==============================================================================
# FILE: backend/core/exceptions.py
# WHAT THIS FILE IS: Domain-specific Exception Classes for Phoenix AI.
# WHY IT IS USED: Provides explicit, typed error hierarchy so controllers, 
#                 services, and tools can handle failures cleanly without relying 
#                 on broad 'except Exception' catches.
# ==============================================================================

class PhoenixBaseException(Exception):
    """Base exception class for all Phoenix AI domain errors."""
    def __init__(self, message: str, details: str = None):
        super().__init__(message)
        self.message = message
        self.details = details

class ApplicationNotFoundError(PhoenixBaseException):
    """Raised when an application query fails to match any installed executable."""
    pass

class AmbiguousApplicationError(PhoenixBaseException):
    """Raised when multiple matching applications are found for a fuzzy request."""
    def __init__(self, message: str, candidates: list):
        super().__init__(message)
        self.candidates = candidates

class ToolExecutionError(PhoenixBaseException):
    """Raised when a registered capability tool fails during execution."""
    def __init__(self, tool_name: str, message: str, original_error: str = None):
        super().__init__(f"Tool '{tool_name}' failed: {message}")
        self.tool_name = tool_name
        self.original_error = original_error

class PermissionDeniedError(PhoenixBaseException):
    """Raised when an action requires confirmation or exceeds caller permissions."""
    def __init__(self, tool_name: str, permission_level: str, message: str):
        super().__init__(message)
        self.tool_name = tool_name
        self.permission_level = permission_level

class AIServiceError(PhoenixBaseException):
    """Raised when an upstream LLM provider (OpenRouter / Gemini) returns an error."""
    pass

class SystemControlError(PhoenixBaseException):
    """Raised when a Windows / macOS system API call (volume, brightness, power) fails."""
    pass

class MemoryError(PhoenixBaseException):
    """Raised when SQLite long-term memory operations fail."""
    pass
