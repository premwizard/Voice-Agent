# ==============================================================================
# FILE: backend/core/logging_service.py
# WHAT THIS FILE IS: Structured Tool Execution Logger.
# WHY IT IS USED: Logs timestamps, user prompts, selected tools, arguments, 
#                 permission levels, execution times (ms), and success/failure results.
# ==============================================================================

import logging
from datetime import datetime, timezone
from typing import Dict, Any

# Configure standard Python logging format
logging.basicConfig(
    level=logging.INFO,
    format='[%(asctime)s] [%(levelname)s] [PhoenixToolEngine] %(message)s'
)
logger = logging.getLogger("PhoenixToolEngine")

class ToolExecutionLogger:
    @staticmethod
    def log_execution(
        user_request: str,
        tool_name: str,
        arguments: Dict[str, Any],
        permission_level: str,
        duration_ms: float,
        success: bool,
        result_data: Any,
        error_message: str = None
    ) -> Dict[str, Any]:
        """Formats and logs a structured tool execution record."""
        entry = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "user_request": user_request,
            "tool": tool_name,
            "arguments": arguments,
            "permission_level": permission_level,
            "duration_ms": round(duration_ms, 2),
            "success": success,
            "data": result_data,
            "error": error_message
        }
        
        status_str = "SUCCESS" if success else "FAILED"
        msg = f"User: '{user_request}' -> Tool: '{tool_name}' ({status_str}) | Exec Time: {entry['duration_ms']}ms | Perm: {permission_level}"
        
        if success:
            logger.info(msg)
        else:
            logger.error(f"{msg} | Error: {error_message}")

        return entry

tool_logger = ToolExecutionLogger()
