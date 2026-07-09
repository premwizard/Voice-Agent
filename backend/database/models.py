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
