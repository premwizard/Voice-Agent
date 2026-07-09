from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

class AgentMessage(BaseModel):
    id: str
    sender: str
    receiver: str
    task_id: str
    context: Dict[str, Any] = Field(default_factory=dict)
    payload: Any
    metadata: Dict[str, Any] = Field(default_factory=dict)
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class AgentStatusUpdate(BaseModel):
    agent_name: str
    task_id: str
    status: str  # 'pending', 'running', 'completed', 'failed', 'retrying'
    detail: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class AgentCapability(BaseModel):
    name: str
    description: str
    supported_tools: List[str] = Field(default_factory=list)
    version: str = "1.0.0"
