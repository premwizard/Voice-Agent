"""
ContextBuilder — assembles the full prompt context in a deterministic order.

Order:
  1. System Prompt
  2. Long-Term Memory (if any items exist)
  3. Conversation Summary (if a rolling summary exists)
  4. Recent Messages (Layer 1 active context)
  5. Current User Message

This module is the single place where prompts are built. No other service
should manually construct message arrays for the LLM.
"""

import logging
from typing import List, Dict, Optional

from database.models import Message, MemoryItem, Summary
from config.settings import settings

logger = logging.getLogger(__name__)


class ContextBuilder:

    def build(
        self,
        system_prompt: str,
        recent_messages: List[Message],
        current_user_message: str,
        summary: Optional[Summary] = None,
        memory_items: Optional[List[MemoryItem]] = None,
        rag_context: Optional[str] = None,
    ) -> tuple[str, List[Dict[str, str]]]:
        """
        Returns (enriched_system_prompt, history_list) ready to pass to a provider.
        """
        system_parts = [system_prompt.strip()]
        
        # Layer 4 — RAG Context
        if rag_context and rag_context.strip():
            system_parts.append(rag_context.strip())

        # Layer 3 — Long-Term Memory
        if memory_items:
            memory_block = self._format_memory(memory_items)
            if memory_block:
                system_parts.append(memory_block)

        # Layer 2 — Rolling Summary
        if summary and summary.content.strip():
            summary_block = (
                "\n## Previous Conversation Summary\n"
                f"{summary.content.strip()}"
            )
            system_parts.append(summary_block)

        enriched_system = "\n\n".join(system_parts)

        # Layer 1 — Recent messages as history list
        history = [
            {"role": msg.role, "content": msg.content}
            for msg in recent_messages
        ]

        logger.debug(
            f"Context built: system={len(enriched_system)} chars, "
            f"history={len(history)} messages, "
            f"memory={len(memory_items) if memory_items else 0} items, "
            f"has_summary={summary is not None}"
        )

        return enriched_system, history

    def _format_memory(self, items: List[MemoryItem]) -> str:
        if not items:
            return ""

        # Group by category
        by_category: Dict[str, List[MemoryItem]] = {}
        for item in items:
            by_category.setdefault(item.category, []).append(item)

        lines = ["\n## What I Know About You"]
        category_labels = {
            "preference": "Preferences",
            "fact": "Facts",
            "goal": "Goals & Projects",
            "style": "Style & Conventions",
        }

        for cat, label in category_labels.items():
            cat_items = by_category.get(cat, [])
            if cat_items:
                lines.append(f"\n**{label}:**")
                for item in cat_items:
                    lines.append(f"- {item.key.replace('_', ' ').title()}: {item.value}")

        return "\n".join(lines)


# Singleton instance
context_builder = ContextBuilder()
