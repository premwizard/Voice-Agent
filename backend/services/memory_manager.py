"""
MemoryManager — centralized coordinator for all memory operations.

This is the ONLY class that should be called by external services (ws_server,
API routes) for memory-related work. It orchestrates:

  - Storing messages to the DB
  - Loading context (summary + recent messages + long-term memory)
  - Triggering summarization when threshold is exceeded
  - Extracting long-term memory facts
  - Building the full prompt context via ContextBuilder

No other module should directly access repositories or the summary service.
"""

import asyncio
import logging
from typing import List, Optional, Dict, Any, Tuple

from database.models import Message, Summary, MemoryItem
from database.db import db_connection
from repositories.conversation_repository import ConversationRepository
from repositories.message_repository import MessageRepository
from repositories.summary_repository import SummaryRepository
from repositories.memory_repository import MemoryRepository
from services.summary_service import summary_service
from services.context_builder import context_builder
from config.settings import settings

logger = logging.getLogger(__name__)

_conv_repo = ConversationRepository()
_msg_repo = MessageRepository()
_sum_repo = SummaryRepository()
_mem_repo = MemoryRepository()


class MemoryManager:
    """
    Stateless service — all state is in the database.
    Safe to use as a module-level singleton.
    """

    # ------------------------------------------------------------------ #
    # Conversation lifecycle
    # ------------------------------------------------------------------ #

    async def ensure_conversation(
        self,
        conversation_id: str,
        mode: str = "chat",
    ) -> None:
        """Create the conversation record if it doesn't already exist."""
        if not await _conv_repo.exists(conversation_id):
            await _conv_repo.create(conversation_id, mode=mode)

    # ------------------------------------------------------------------ #
    # Message persistence
    # ------------------------------------------------------------------ #

    async def save_user_message(
        self,
        conversation_id: str,
        content: str,
        mode: str = "chat",
    ) -> Message:
        msg = await _msg_repo.save(
            conversation_id=conversation_id,
            role="user",
            content=content,
            mode=mode,
        )
        await _conv_repo.increment_message_count(conversation_id)
        logger.debug(f"[{conversation_id}] Saved user message ({len(content)} chars)")
        return msg

    async def save_assistant_message(
        self,
        conversation_id: str,
        content: str,
        mode: str = "chat",
        metadata: Optional[Dict[str, Any]] = None,
    ) -> Message:
        msg = await _msg_repo.save(
            conversation_id=conversation_id,
            role="assistant",
            content=content,
            mode=mode,
            metadata=metadata,
        )
        await _conv_repo.increment_message_count(conversation_id)
        logger.debug(f"[{conversation_id}] Saved assistant message ({len(content)} chars)")
        return msg

    async def remove_last_message(self, conversation_id: str) -> None:
        """Roll back the last message on cancelled / failed generation."""
        removed = await _msg_repo.remove_last(conversation_id)
        if removed:
            logger.debug(f"[{conversation_id}] Rolled back last message")

    async def edit_message_and_truncate(
        self, conversation_id: str, message_id: str, new_content: str
    ) -> None:
        """Update an existing message and delete any messages that came after it."""
        await _msg_repo.update_content(message_id, new_content)
        deleted_count = await _msg_repo.truncate_after(conversation_id, message_id)
        # Recalculate message count if we deleted rows
        if deleted_count > 0:
            count = await _msg_repo.count(conversation_id)
            async with db_connection() as conn:
                await conn.execute(
                    "UPDATE conversations SET message_count = ? WHERE id = ?",
                    (count, conversation_id)
                )
                await conn.commit()
            logger.debug(f"[{conversation_id}] Edited message {message_id} and truncated {deleted_count} subsequent messages")

    # ------------------------------------------------------------------ #
    # Context assembly
    # ------------------------------------------------------------------ #

    async def build_context(
        self,
        conversation_id: str,
        current_user_message: str,
        system_prompt: str,
    ) -> Tuple[str, List[Dict[str, str]]]:
        """
        Assemble the full 4-layer prompt context.
        Returns (enriched_system_prompt, history_list).
        """
        recent_msgs = await _msg_repo.get_recent(
            conversation_id, settings.max_active_messages
        )
        latest_summary = await _sum_repo.get_latest(conversation_id)
        memory_items = await _mem_repo.get_all()
        
        # Build RAG Context
        from services.rag_context_builder import RAGContextBuilder
        rag_builder = RAGContextBuilder()
        rag_context = await rag_builder.build_context(current_user_message)

        enriched_system, history = context_builder.build(
            system_prompt=system_prompt,
            recent_messages=recent_msgs,
            current_user_message=current_user_message,
            summary=latest_summary,
            memory_items=memory_items,
            rag_context=rag_context,
        )
        return enriched_system, history

    async def load_recent_messages(
        self, conversation_id: str
    ) -> List[Message]:
        """Load recent messages for display in the frontend (HISTORY_LOAD)."""
        return await _msg_repo.get_recent(
            conversation_id, settings.max_active_messages
        )

    # ------------------------------------------------------------------ #
    # Automatic summarization
    # ------------------------------------------------------------------ #

    async def maybe_summarize(self, conversation_id: str) -> None:
        """
        Check if message count exceeds SUMMARY_THRESHOLD.
        If so, summarize older messages and prune them from the DB.
        Runs asynchronously and does not block the response.
        """
        total = await _msg_repo.count(conversation_id)
        if total <= settings.summary_threshold:
            return

        keep = settings.max_active_messages
        older_messages = await _msg_repo.get_older_than(conversation_id, keep)

        if not older_messages:
            return

        logger.info(
            f"[{conversation_id}] Summarizing {len(older_messages)} messages "
            f"(total={total}, keep={keep})"
        )

        # Generate summary
        summary_content = await summary_service.summarize(older_messages)
        if not summary_content:
            logger.warning(f"[{conversation_id}] Empty summary returned — skipping prune")
            return

        # Persist summary
        await _sum_repo.save(
            conversation_id=conversation_id,
            content=summary_content,
            message_count_at_summary=len(older_messages),
        )

        # Prune old messages from DB
        await _msg_repo.delete_older_than(conversation_id, keep)
        logger.info(f"[{conversation_id}] Summarization complete")

    # ------------------------------------------------------------------ #
    # Long-term memory extraction
    # ------------------------------------------------------------------ #

    async def extract_and_store_memories(self, conversation_id: str) -> None:
        """
        Extract long-term memory facts from the latest messages.
        Called asynchronously after AI response — non-blocking.
        Respects MAX_MEMORY_ITEMS limit.
        """
        current_count = await _mem_repo.count()
        if current_count >= settings.max_memory_items:
            logger.debug("Memory limit reached — skipping extraction")
            return

        recent = await _msg_repo.get_recent(conversation_id, 10)
        facts = await summary_service.extract_memories(recent)

        for fact in facts:
            try:
                await _mem_repo.upsert(
                    key=fact["key"],
                    value=fact["value"],
                    category=fact.get("category", "fact"),
                    confidence=float(fact.get("confidence", 1.0)),
                )
            except Exception as e:
                logger.warning(f"Failed to store memory item {fact.get('key')}: {e}")

    # ------------------------------------------------------------------ #
    # Post-response pipeline (called after each AI response)
    # ------------------------------------------------------------------ #

    async def post_response_pipeline(
        self,
        conversation_id: str,
        user_content: str,
        assistant_content: str,
    ) -> None:
        """
        Fire-and-forget pipeline that runs after every AI response.
        Runs in background to avoid blocking the WebSocket.
        """
        try:
            # Auto-title the conversation from the first user message
            conv = await _conv_repo.get(conversation_id)
            if conv and conv.title == "New Conversation" and user_content:
                title = user_content[:60].strip()
                if len(user_content) > 60:
                    title += "..."
                await _conv_repo.rename(conversation_id, title)

            # Summarize if needed
            await self.maybe_summarize(conversation_id)

            # Extract long-term memory (every 5th message to reduce cost)
            total = await _msg_repo.count(conversation_id)
            if total % 5 == 0:
                await self.extract_and_store_memories(conversation_id)

        except Exception as e:
            logger.error(f"[{conversation_id}] Post-response pipeline error: {e}")


# Module-level singleton
memory_manager = MemoryManager()
