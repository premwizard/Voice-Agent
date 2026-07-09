import logging
import uuid
from typing import Dict, Optional, List

from repositories.prompt_repository import PromptRepository
from database.models import Prompt
from config.settings import settings

logger = logging.getLogger(__name__)

_prompt_repo = PromptRepository()

class PromptRegistry:
    def __init__(self):
        # In-memory cache to avoid DB hits on every request: { workspace_id: { name: content } }
        self._cache: Dict[str, Dict[str, str]] = {}

    async def get_prompt(self, workspace_id: str, name: str, default_content: str = "") -> str:
        """Get the active prompt content for a given name. Use default_content if none exists."""
        if workspace_id in self._cache and name in self._cache[workspace_id]:
            return self._cache[workspace_id][name]

        prompt = await _prompt_repo.get_active(workspace_id, name)
        if prompt:
            self._cache.setdefault(workspace_id, {})[name] = prompt.content
            return prompt.content
        
        # Auto-initialize with default if provided
        if default_content:
            await self.save_prompt(workspace_id, name, default_content, tags="default")
            return default_content

        return ""

    async def save_prompt(self, workspace_id: str, name: str, content: str, tags: str = "") -> Prompt:
        """Create a new version of a prompt and set it as active."""
        # Find latest version
        versions = await _prompt_repo.list_versions(workspace_id, name)
        next_version = 1
        if versions:
            next_version = versions[0].version + 1

        prompt = Prompt(
            id=str(uuid.uuid4()),
            workspace_id=workspace_id,
            name=name,
            content=content,
            version=next_version,
            is_active=True,
            tags=tags
        )
        await _prompt_repo.create(prompt)
        
        # Update cache
        self._cache.setdefault(workspace_id, {})[name] = content
        logger.info(f"Saved new prompt version v{next_version} for {name} in workspace {workspace_id}")
        return prompt

    def invalidate_cache(self, workspace_id: str, name: str = None):
        """Invalidate cache for a workspace or specific prompt."""
        if workspace_id in self._cache:
            if name and name in self._cache[workspace_id]:
                del self._cache[workspace_id][name]
            elif not name:
                del self._cache[workspace_id]

prompt_registry = PromptRegistry()
