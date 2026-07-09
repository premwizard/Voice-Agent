"""
SummaryService — uses the configured LLM provider to compress older
conversation messages into a concise summary.

The summary preserves:
- Key facts and decisions
- Unresolved tasks / open questions
- User intent and preferences
- Important context for future messages
"""

import logging
from typing import List

from database.models import Message
from config.settings import settings

logger = logging.getLogger(__name__)

SUMMARIZE_SYSTEM_PROMPT = """You are a conversation memory assistant.
Your task is to create a concise, structured summary of the conversation history provided.

The summary must preserve:
- Key facts and information established
- User preferences and coding style mentioned
- Important decisions made
- Unresolved tasks or questions
- Project goals and context
- Any technical details that would be needed to continue this conversation

Format as structured bullet points.
Be concise. Maximum {max_length} characters.
Focus on information that is useful for continuing the conversation."""

EXTRACT_MEMORY_SYSTEM_PROMPT = """You are a memory extraction assistant.
Analyze the conversation and extract reusable facts about the user.

Only extract MEANINGFUL, PERSISTENT facts such as:
- Preferred programming language
- Preferred AI provider or model
- Project goals or ongoing tasks
- Coding style preferences
- Frameworks or tools they use regularly
- Name or personal preferences

Do NOT extract:
- Temporary facts specific to one message
- Things already obvious from context

Return a JSON array. Each item must have:
- "key": a short snake_case identifier (e.g., "preferred_language")
- "value": the fact as a clear string
- "category": one of "preference", "fact", "goal", "style"
- "confidence": a float between 0.5 and 1.0

If no meaningful facts exist, return an empty array: []

Respond ONLY with the JSON array, no explanation."""


class SummaryService:

    def __init__(self):
        # Lazy import to avoid circular deps; provider is initialized on demand
        self._provider = None

    def _get_provider(self):
        if self._provider is None:
            from providers import get_provider
            self._provider = get_provider()
            self._provider.initialize()
        return self._provider

    async def summarize(self, messages: List[Message]) -> str:
        """Compress a list of messages into a summary string."""
        if not messages:
            return ""

        max_len = settings.max_summary_length
        system = SUMMARIZE_SYSTEM_PROMPT.format(max_length=max_len)

        # Build a readable transcript for the LLM to summarize
        transcript_lines = []
        for msg in messages:
            role_label = "User" if msg.role == "user" else "Assistant"
            # Truncate very long individual messages to avoid token explosion
            content = msg.content[:2000] if len(msg.content) > 2000 else msg.content
            transcript_lines.append(f"{role_label}: {content}")

        transcript = "\n\n".join(transcript_lines)
        prompt = (
            f"Please summarize the following conversation:\n\n{transcript}"
        )

        try:
            provider = self._get_provider()
            summary = await provider.generate(
                prompt=prompt,
                system_prompt=system,
                history=[],
            )
            logger.info(f"Generated summary ({len(summary)} chars) for {len(messages)} messages")
            return summary.strip()
        except Exception as e:
            logger.error(f"Summarization failed: {e}")
            # Fallback: basic truncated transcript
            fallback = transcript[:max_len]
            logger.warning("Using fallback summary (truncated transcript)")
            return fallback

    async def extract_memories(self, messages: List[Message]) -> List[dict]:
        """Extract long-term memory facts from a set of messages.

        Returns a list of dicts: [{key, value, category, confidence}, ...]
        """
        if not messages:
            return []

        transcript_lines = []
        for msg in messages:
            role_label = "User" if msg.role == "user" else "Assistant"
            content = msg.content[:1000] if len(msg.content) > 1000 else msg.content
            transcript_lines.append(f"{role_label}: {content}")

        transcript = "\n\n".join(transcript_lines)
        prompt = f"Extract memory facts from this conversation:\n\n{transcript}"

        try:
            provider = self._get_provider()
            raw = await provider.generate(
                prompt=prompt,
                system_prompt=EXTRACT_MEMORY_SYSTEM_PROMPT,
                history=[],
            )
            # Parse JSON — strip markdown code fences if present
            import json, re
            clean = re.sub(r"```(?:json)?", "", raw).strip().rstrip("`").strip()
            facts = json.loads(clean)
            if not isinstance(facts, list):
                return []
            # Validate each item minimally
            valid = []
            for item in facts:
                if all(k in item for k in ("key", "value", "category")):
                    valid.append(item)
            logger.info(f"Extracted {len(valid)} memory facts")
            return valid
        except Exception as e:
            logger.warning(f"Memory extraction failed (non-critical): {e}")
            return []


# Singleton instance
summary_service = SummaryService()
