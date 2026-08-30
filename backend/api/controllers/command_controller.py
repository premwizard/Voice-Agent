# ==============================================================================
# FILE: backend/api/controllers/command_controller.py
# WHAT THIS FILE IS: Controller for Fast-Path Command REST Execution.
# WHY IT IS USED: Deduplicates requests and dispatches prompts to CommandRouter (<50ms execution).
# ==============================================================================

from typing import Dict, Any
from api.schemas.command_schema import CommandRequest
from core.command_router import command_router

# Deduplication cache for request_id to prevent double submissions
PROCESSED_REQUEST_IDS: set = set()

class CommandController:
    """Controller handling fast-path command classification and execution."""

    def execute_command(self, request: CommandRequest) -> Dict[str, Any]:
        """
        Fast-Path REST Command execution controller.
        Prevents duplicate requests and invokes sub-50ms command router.
        """
        if request.request_id:
            if request.request_id in PROCESSED_REQUEST_IDS:
                return {"status": "ignored", "reason": "Duplicate request_id"}
            PROCESSED_REQUEST_IDS.add(request.request_id)
            if len(PROCESSED_REQUEST_IDS) > 1000:
                PROCESSED_REQUEST_IDS.clear()

        return command_router.classify_and_route(request.prompt, user_confirmed=request.user_confirmed or False)

command_controller = CommandController()
