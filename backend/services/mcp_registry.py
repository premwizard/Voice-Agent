import uuid
import json
from datetime import datetime
from database.db import db_connection
from schemas.mcp import MCPServerCreate

class MCPRegistry:
    async def register_server(self, workspace_id: str, server_data: MCPServerCreate) -> dict:
        server_id = str(uuid.uuid4())
        now = datetime.utcnow().isoformat()
        
        async with db_connection() as conn:
            await conn.execute(
                """
                INSERT INTO mcp_servers 
                (id, workspace_id, name, description, transport, command, args, url, env_vars, status, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    server_id, workspace_id, server_data.name, server_data.description,
                    server_data.transport, server_data.command, 
                    server_data.args, server_data.url, 
                    server_data.env_vars, "disconnected", now, now
                )
            )
            await conn.commit()
            
        return await self.get_server(server_id)

    async def get_server(self, server_id: str) -> dict:
        async with db_connection() as conn:
            cursor = await conn.execute("SELECT * FROM mcp_servers WHERE id = ?", (server_id,))
            server = await cursor.fetchone()
            return dict(server) if server else None

    async def list_servers(self, workspace_id: str) -> list[dict]:
        async with db_connection() as conn:
            cursor = await conn.execute("SELECT * FROM mcp_servers WHERE workspace_id = ?", (workspace_id,))
            servers = await cursor.fetchall()
            return [dict(server) for server in servers]

    async def delete_server(self, server_id: str):
        async with db_connection() as conn:
            await conn.execute("DELETE FROM mcp_servers WHERE id = ?", (server_id,))
            await conn.commit()

mcp_registry = MCPRegistry()
