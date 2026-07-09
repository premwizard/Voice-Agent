"""
REST API for conversation management and memory retrieval.
All endpoints are under /api prefix (registered in main.py).
"""

import json
import logging
from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

from repositories.conversation_repository import ConversationRepository
from repositories.message_repository import MessageRepository
from repositories.summary_repository import SummaryRepository
from repositories.memory_repository import MemoryRepository
from database.models import Conversation, Message, MemoryItem

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["conversations"])

_conv_repo = ConversationRepository()
_msg_repo = MessageRepository()
_sum_repo = SummaryRepository()
_mem_repo = MemoryRepository()


# ------------------------------------------------------------------ #
# Pydantic response / request schemas
# ------------------------------------------------------------------ #

class ConversationResponse(BaseModel):
    id: str
    title: str
    created_at: str
    updated_at: str
    message_count: int
    is_pinned: bool
    mode: str


class MessageResponse(BaseModel):
    id: str
    conversation_id: str
    role: str
    content: str
    timestamp: str
    mode: str
    metadata: Optional[dict] = None


class ConversationDetailResponse(BaseModel):
    conversation: ConversationResponse
    messages: List[MessageResponse]
    summary: Optional[str] = None


class RenameRequest(BaseModel):
    title: str


class PinRequest(BaseModel):
    pinned: bool


class MemoryItemResponse(BaseModel):
    id: str
    key: str
    value: str
    category: str
    confidence: float
    created_at: str
    updated_at: str


class UpsertMemoryRequest(BaseModel):
    key: str
    value: str
    category: str = "fact"
    confidence: float = 1.0


# ------------------------------------------------------------------ #
# Helpers
# ------------------------------------------------------------------ #

def _dt_str(dt: datetime) -> str:
    return dt.strftime("%Y-%m-%dT%H:%M:%S.%f")


def _conv_to_resp(c: Conversation) -> ConversationResponse:
    return ConversationResponse(
        id=c.id,
        title=c.title,
        created_at=_dt_str(c.created_at),
        updated_at=_dt_str(c.updated_at),
        message_count=c.message_count,
        is_pinned=c.is_pinned,
        mode=c.mode,
    )


def _msg_to_resp(m: Message) -> MessageResponse:
    return MessageResponse(
        id=m.id,
        conversation_id=m.conversation_id,
        role=m.role,
        content=m.content,
        timestamp=_dt_str(m.timestamp),
        mode=m.mode,
        metadata=m.metadata,
    )


def _mem_to_resp(item: MemoryItem) -> MemoryItemResponse:
    return MemoryItemResponse(
        id=item.id,
        key=item.key,
        value=item.value,
        category=item.category,
        confidence=item.confidence,
        created_at=_dt_str(item.created_at),
        updated_at=_dt_str(item.updated_at),
    )


# ------------------------------------------------------------------ #
# Conversation endpoints
# ------------------------------------------------------------------ #

@router.get("/conversations", response_model=List[ConversationResponse])
async def list_conversations(limit: int = Query(default=100, le=500)):
    """List all conversations ordered by pinned first, then most recent."""
    convs = await _conv_repo.list_all(limit=limit)
    return [_conv_to_resp(c) for c in convs]


@router.get("/conversations/search", response_model=List[ConversationResponse])
async def search_conversations(
    q: str = Query(..., min_length=1),
    limit: int = Query(default=50, le=200),
):
    """Search conversations by title keyword."""
    convs = await _conv_repo.search(q, limit=limit)
    return [_conv_to_resp(c) for c in convs]


@router.get("/conversations/{conversation_id}", response_model=ConversationDetailResponse)
async def get_conversation(conversation_id: str):
    """Get a full conversation including all messages and latest summary."""
    conv = await _conv_repo.get(conversation_id)
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")

    messages = await _msg_repo.get_all(conversation_id)
    summary = await _sum_repo.get_latest(conversation_id)

    return ConversationDetailResponse(
        conversation=_conv_to_resp(conv),
        messages=[_msg_to_resp(m) for m in messages],
        summary=summary.content if summary else None,
    )


@router.patch("/conversations/{conversation_id}/rename")
async def rename_conversation(conversation_id: str, body: RenameRequest):
    """Rename a conversation."""
    if not body.title.strip():
        raise HTTPException(status_code=422, detail="Title cannot be empty")
    ok = await _conv_repo.rename(conversation_id, body.title.strip())
    if not ok:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return {"status": "ok"}


@router.patch("/conversations/{conversation_id}/pin")
async def pin_conversation(conversation_id: str, body: PinRequest):
    """Pin or unpin a conversation."""
    ok = await _conv_repo.set_pinned(conversation_id, body.pinned)
    if not ok:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return {"status": "ok"}


@router.delete("/conversations/{conversation_id}")
async def delete_conversation(conversation_id: str):
    """Delete a conversation and all its messages/summaries (CASCADE)."""
    ok = await _conv_repo.delete(conversation_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return {"status": "ok"}


@router.get("/conversations/{conversation_id}/export")
async def export_conversation(
    conversation_id: str,
    format: str = Query(default="json", pattern="^(json|markdown|txt)$"),
):
    """Export a conversation in JSON, Markdown, or TXT format."""
    conv = await _conv_repo.get(conversation_id)
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")

    messages = await _msg_repo.get_all(conversation_id)
    summary = await _sum_repo.get_latest(conversation_id)

    if format == "json":
        payload = {
            "conversation": _conv_to_resp(conv).model_dump(),
            "summary": summary.content if summary else None,
            "messages": [_msg_to_resp(m).model_dump() for m in messages],
            "exported_at": datetime.utcnow().isoformat(),
        }
        return payload

    elif format == "markdown":
        lines = [
            f"# {conv.title}",
            f"",
            f"**Created:** {_dt_str(conv.created_at)}  ",
            f"**Messages:** {conv.message_count}  ",
            f"**Mode:** {conv.mode}",
            f"",
        ]
        if summary:
            lines += ["## Summary", "", summary.content, ""]
        lines += ["## Conversation", ""]
        for msg in messages:
            label = "**You:**" if msg.role == "user" else "**Assistant:**"
            ts = _dt_str(msg.timestamp)
            lines += [f"{label} *(at {ts})*", "", msg.content, "", "---", ""]
        return {"content": "\n".join(lines), "filename": f"{conv.title}.md"}

    else:  # txt
        lines = [f"Conversation: {conv.title}", f"Created: {_dt_str(conv.created_at)}", ""]
        for msg in messages:
            label = "You" if msg.role == "user" else "Assistant"
            lines += [f"[{_dt_str(msg.timestamp)}] {label}:", msg.content, ""]
        return {"content": "\n".join(lines), "filename": f"{conv.title}.txt"}


# ------------------------------------------------------------------ #
# Memory endpoints
# ------------------------------------------------------------------ #

@router.get("/memory", response_model=List[MemoryItemResponse])
async def get_memory(category: Optional[str] = None):
    """Get all long-term memory items, optionally filtered by category."""
    items = await _mem_repo.get_all(category=category)
    return [_mem_to_resp(i) for i in items]


@router.post("/memory", response_model=MemoryItemResponse)
async def upsert_memory(body: UpsertMemoryRequest):
    """Create or update a memory item."""
    item = await _mem_repo.upsert(
        key=body.key,
        value=body.value,
        category=body.category,
        confidence=body.confidence,
    )
    return _mem_to_resp(item)


@router.delete("/memory/{key}")
async def delete_memory(key: str):
    """Delete a specific memory item by key."""
    ok = await _mem_repo.delete(key)
    if not ok:
        raise HTTPException(status_code=404, detail="Memory item not found")
    return {"status": "ok"}


@router.delete("/memory")
async def clear_memory():
    """Clear ALL long-term memory items."""
    await _mem_repo.clear_all()
    return {"status": "ok"}
