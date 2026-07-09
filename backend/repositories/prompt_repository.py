import logging
from typing import List, Optional
from datetime import datetime, timezone

from database.db import db_connection
from database.models import Prompt

logger = logging.getLogger(__name__)

_DT_FMT = "%Y-%m-%dT%H:%M:%S.%f"

def _now_iso() -> str:
    return datetime.now(timezone.utc).strftime(_DT_FMT)

def _row_to_prompt(row) -> Prompt:
    return Prompt(
        id=row["id"],
        workspace_id=row["workspace_id"],
        name=row["name"],
        content=row["content"],
        version=row["version"],
        is_active=bool(row["is_active"]),
        tags=row["tags"],
        created_at=datetime.strptime(row["created_at"], _DT_FMT),
    )

class PromptRepository:
    async def create(self, prompt: Prompt) -> Prompt:
        now = _now_iso()
        async with db_connection() as conn:
            # Deactivate previous active prompt for this name
            if prompt.is_active:
                await conn.execute(
                    "UPDATE prompts SET is_active = 0 WHERE workspace_id = ? AND name = ?",
                    (prompt.workspace_id, prompt.name)
                )

            await conn.execute(
                """
                INSERT INTO prompts (id, workspace_id, name, content, version, is_active, tags, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (prompt.id, prompt.workspace_id, prompt.name, prompt.content,
                 prompt.version, int(prompt.is_active), prompt.tags, now)
            )
            await conn.commit()
        return prompt

    async def get_active(self, workspace_id: str, name: str) -> Optional[Prompt]:
        async with db_connection() as conn:
            cursor = await conn.execute(
                "SELECT * FROM prompts WHERE workspace_id = ? AND name = ? AND is_active = 1 ORDER BY version DESC LIMIT 1",
                (workspace_id, name)
            )
            row = await cursor.fetchone()
        return _row_to_prompt(row) if row else None

    async def list_versions(self, workspace_id: str, name: str) -> List[Prompt]:
        async with db_connection() as conn:
            cursor = await conn.execute(
                "SELECT * FROM prompts WHERE workspace_id = ? AND name = ? ORDER BY version DESC",
                (workspace_id, name)
            )
            rows = await cursor.fetchall()
        return [_row_to_prompt(r) for r in rows]

    async def get_all_active(self, workspace_id: str) -> List[Prompt]:
        async with db_connection() as conn:
            cursor = await conn.execute(
                "SELECT * FROM prompts WHERE workspace_id = ? AND is_active = 1 ORDER BY name ASC",
                (workspace_id,)
            )
            rows = await cursor.fetchall()
        return [_row_to_prompt(r) for r in rows]
