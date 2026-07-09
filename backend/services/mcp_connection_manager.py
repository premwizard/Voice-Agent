import asyncio
import logging
from typing import Dict
from services.mcp_client import MCPClient
from database.db import db_connection

logger = logging.getLogger(__name__)

class MCPConnectionManager:
    def __init__(self):
        # Maps server_id -> MCPClient
        self.active_clients: Dict[str, MCPClient] = {}

    async def get_or_connect(self, server_id: str) -> MCPClient:
        if server_id in self.active_clients:
            client = self.active_clients[server_id]
            if client.process and client.process.returncode is None:
                return client
            # Reconnect needed
            await client.disconnect()
            del self.active_clients[server_id]
            
        async with db_connection() as conn:
            cursor = await conn.execute("SELECT * FROM mcp_servers WHERE id = ?", (server_id,))
            server = await cursor.fetchone()
            if not server:
                raise ValueError("Server not found")
                
        import json
        if server['transport'] != 'stdio':
            raise NotImplementedError("Only STDIO is supported natively right now.")
            
        args = json.loads(server['args']) if server['args'] else []
        env = json.loads(server['env_vars']) if server['env_vars'] else {}
        
        client = MCPClient(command=server['command'], args=args, env=env)
        await client.connect()
        self.active_clients[server_id] = client
        return client

    async def get_all_tools(self, workspace_id: str):
        # Find all active servers for this workspace
        async with db_connection() as conn:
            cursor = await conn.execute("SELECT id FROM mcp_servers WHERE workspace_id = ?", (workspace_id,))
            servers = await cursor.fetchall()
            
        all_tools = []
        for server in servers:
            try:
                client = await self.get_or_connect(server['id'])
                tools = await client.list_tools()
                for t in tools:
                    t['__server_id'] = server['id'] # Tag the tool so we know where to route it
                    all_tools.append(t)
            except Exception as e:
                logger.error(f"Failed to fetch tools for {server['id']}: {e}")
        return all_tools

    async def disconnect_all(self):
        for client in self.active_clients.values():
            await client.disconnect()
        self.active_clients.clear()

mcp_connection_manager = MCPConnectionManager()
