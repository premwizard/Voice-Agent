from dataclasses import dataclass, field
from typing import Optional
from datetime import datetime


@dataclass
class Conversation:
    id: str
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
