from pydantic import BaseModel
from typing import Optional, List, Dict, Any

class MCPServerCreate(BaseModel):
    name: str
    description: Optional[str] = None
    transport: str  # 'stdio' or 'sse'
    command: Optional[str] = None
    args: Optional[str] = None
    url: Optional[str] = None
    env_vars: Optional[str] = None

class MCPServerResponse(BaseModel):
    id: str
    workspace_id: str
    name: str
    description: Optional[str] = None
    transport: str
    command: Optional[str] = None
    args: Optional[str] = None
    url: Optional[str] = None
    status: str

class MCPToolResponse(BaseModel):
    name: str
    description: str
    inputSchema: Dict[str, Any]

class MCPResourceResponse(BaseModel):
    uri: str
    name: str
    mimeType: Optional[str] = None
    description: Optional[str] = None

class MCPPromptResponse(BaseModel):
    name: str
    description: Optional[str] = None
    arguments: Optional[List[Dict[str, Any]]] = None
