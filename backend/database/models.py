from dataclasses import dataclass, field
from typing import Optional
from datetime import datetime


@dataclass
class User:
    id: str
    email: str
    password_hash: str
    role: str = "user"
    name: Optional[str] = None
    created_at: datetime = field(default_factory=datetime.utcnow)
    updated_at: datetime = field(default_factory=datetime.utcnow)
    profile_data: Optional[dict] = None

@dataclass
class Workspace:
    id: str
    user_id: str
    name: str
    created_at: datetime = field(default_factory=datetime.utcnow)

@dataclass
class APIKey:
    id: str
    workspace_id: str
    provider: str
    encrypted_key: str
    created_at: datetime = field(default_factory=datetime.utcnow)

@dataclass
class ActivityLog:
    id: str
    workspace_id: str
    action: str
    metadata: Optional[dict] = None
    created_at: datetime = field(default_factory=datetime.utcnow)

@dataclass
class MCPServer:
    id: str
    workspace_id: str
    name: str
    description: str
    transport: str  # 'stdio' | 'sse'
    command: Optional[str] = None
    args: Optional[str] = None      # JSON array string
    url: Optional[str] = None
    env_vars: Optional[str] = None  # JSON dict string
    status: str = "disconnected"
    created_at: datetime = field(default_factory=datetime.utcnow)
    updated_at: datetime = field(default_factory=datetime.utcnow)

@dataclass
class Conversation:
    id: str
    workspace_id: str
    title: str
    created_at: datetime
    updated_at: datetime
    message_count: int = 0
    is_pinned: bool = False
    mode: str = "chat"  # 'voice' | 'chat' | 'mixed'


@dataclass
class Message:
    id: str
    conversation_id: str
    role: str  # 'user' | 'assistant'
    content: str
    timestamp: datetime
    mode: str = "chat"  # 'voice' | 'chat'
    media_ids: Optional[list[str]] = field(default_factory=list)
    metadata: Optional[dict] = None


@dataclass
class Summary:
    id: str
    conversation_id: str
    content: str
    message_count_at_summary: int
    created_at: datetime


@dataclass
class MemoryItem:
    id: str
    key: str
    value: str
    category: str  # 'preference' | 'fact' | 'goal' | 'style'
    confidence: float = 1.0
    created_at: datetime = field(default_factory=datetime.utcnow)
    updated_at: datetime = field(default_factory=datetime.utcnow)


@dataclass
class MediaItem:
    id: str
    workspace_id: str
    conversation_id: str
    file_name: str
    file_path: str
    mime_type: str
    size_bytes: int
    status: str  # 'uploaded' | 'processing' | 'processed' | 'error'
    created_at: datetime = field(default_factory=datetime.utcnow)
    updated_at: datetime = field(default_factory=datetime.utcnow)
    metadata: Optional[dict] = None


@dataclass
class SessionMetadata:
    id: str
    conversation_id: str
    start_time: datetime
    end_time: Optional[datetime]
    duration_seconds: Optional[float]
    message_count: int
    provider: str
    model: str
    total_tokens_estimated: int = 0
    voice_seconds: float = 0.0

@dataclass
class Trace:
    id: str
    workspace_id: str
    conversation_id: str
    request_id: str
    timestamp: datetime
    total_latency_ms: float
    total_tokens: int
    cost: float
    status: str  # 'success', 'error'
    trace_data: str  # JSON string of spans and metadata
    created_at: datetime = field(default_factory=datetime.utcnow)

@dataclass
class Prompt:
    id: str
    workspace_id: str
    name: str
    content: str
    version: int
    is_active: bool
    tags: str  # comma separated
    created_at: datetime = field(default_factory=datetime.utcnow)

@dataclass
class Evaluation:
    id: str
    workspace_id: str
    trace_id: str
    metrics: str  # JSON string of scores (e.g. {"correctness": 0.9, "hallucination": 0.1})
    created_at: datetime = field(default_factory=datetime.utcnow)

@dataclass
class Feedback:
    id: str
    workspace_id: str
    trace_id: str
    rating: int  # 1 for positive, -1 for negative
    comment: Optional[str] = None
    created_at: datetime = field(default_factory=datetime.utcnow)
