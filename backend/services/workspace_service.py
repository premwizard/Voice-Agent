from database.db import db_connection
import uuid
from datetime import datetime

class WorkspaceService:
    async def get_user_workspaces(self, user_id: str) -> list[dict]:
        async with db_connection() as conn:
            cursor = await conn.execute("SELECT id, name, created_at FROM workspaces WHERE user_id = ?", (user_id,))
            rows = await cursor.fetchall()
            return [dict(row) for row in rows]
            
    async def create_workspace(self, user_id: str, name: str) -> dict:
        workspace_id = str(uuid.uuid4())
        now = datetime.utcnow().isoformat()
        async with db_connection() as conn:
            await conn.execute(
                "INSERT INTO workspaces (id, user_id, name, created_at) VALUES (?, ?, ?, ?)",
                (workspace_id, user_id, name, now)
            )
            await conn.commit()
        return {"id": workspace_id, "user_id": user_id, "name": name, "created_at": now}

workspace_service = WorkspaceService()
