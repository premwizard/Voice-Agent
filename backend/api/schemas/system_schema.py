# ==============================================================================
# FILE: backend/api/schemas/system_schema.py
# WHAT THIS FILE IS: Pydantic Data Models for Direct System Action Requests.
# WHY IT IS USED: Validates system action requests and parameters.
# ==============================================================================

from typing import Optional, Dict, Any
from pydantic import BaseModel, Field

class SystemActionRequest(BaseModel):
    action: str = Field(..., description="Registered system action name (e.g. set_master_volume, lock_workstation).")
    args: Optional[Dict[str, Any]] = Field(None, description="Action arguments dictionary.")
    user_confirmed: Optional[bool] = Field(False, description="Set to true if user confirmed dangerous action.")

class TTSRequest(BaseModel):
    text: str = Field(..., description="Text content to synthesize into speech.")
    voice: Optional[str] = Field("en-US-ChristopherNeural", description="Edge-TTS voice font model.")
