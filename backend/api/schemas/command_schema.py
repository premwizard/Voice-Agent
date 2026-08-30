# ==============================================================================
# FILE: backend/api/schemas/command_schema.py
# WHAT THIS FILE IS: Pydantic Data Models for Fast-Path Command Requests/Responses.
# WHY IT IS USED: Validates input payloads and structures responses for REST command execution.
# ==============================================================================

from typing import Optional, Dict, Any
from pydantic import BaseModel, Field

class CommandRequest(BaseModel):
    prompt: str = Field(..., description="Natural language prompt or voice command.")
    request_id: Optional[str] = Field(None, description="Unique client request ID for deduplication.")
    user_confirmed: Optional[bool] = Field(False, description="Set to true if user confirmed dangerous action.")

class CommandResponse(BaseModel):
    route: str = Field(..., description="Target execution route (FAST_PATH, CHAT, COMPLEX_TASK).")
    confidence: str = Field(..., description="Classification confidence level.")
    executed: bool = Field(..., description="Whether a tool was executed immediately.")
    tool: Optional[str] = Field(None, description="Executed tool name.")
    result: Optional[Dict[str, Any]] = Field(None, description="Tool execution outcome payload.")
    message: str = Field(..., description="Human-readable status summary.")
