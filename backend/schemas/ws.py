from pydantic import BaseModel
from typing import Literal, Optional, Dict, Any

class WSMessage(BaseModel):
    type: Literal["CONNECT", "CONNECTED", "USER_PARTIAL", "USER_FINAL", "AI_STREAM", "AI_SENTENCE", "AI_FINAL", "ERROR", "PING", "PONG", "STATUS"]
    content: Optional[str] = None
    conversation_id: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None
