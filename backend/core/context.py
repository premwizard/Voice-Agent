# ==============================================================================
# FILE: backend/core/context.py
# WHAT THIS FILE IS: System Task & Conversation Context Manager.
# WHY IT IS USED: Maintains active application context, active task memory, 
#                 and conversation state across multi-turn interactions.
# ==============================================================================

from typing import Dict, Any, Optional, List

class SystemContext:
    def __init__(self):
        self._last_launched_app: Optional[str] = None
        self._last_active_tool: Optional[str] = None
        self._active_task_description: Optional[str] = None
        self._recent_logs: List[Dict[str, Any]] = []

    def update_app_context(self, app_name: str, exe_path: str):
        """Updates the active application context."""
        self._last_launched_app = app_name

    def update_tool_context(self, tool_name: str, task_description: Optional[str] = None):
        """Updates the active tool and task context."""
        self._last_active_tool = tool_name
        if task_description:
            self._active_task_description = task_description

    def add_log(self, log_entry: Dict[str, Any]):
        """Appends a structured tool execution log entry."""
        self._recent_logs.append(log_entry)
        if len(self._recent_logs) > 50:
            self._recent_logs.pop(0)

    def get_summary(self) -> Dict[str, Any]:
        """Returns a snapshot summary of current context for LLM prompt enhancement."""
        return {
            "last_launched_app": self._last_launched_app,
            "last_active_tool": self._last_active_tool,
            "active_task": self._active_task_description,
            "recent_log_count": len(self._recent_logs)
        }

# Global context instance
system_context = SystemContext()
