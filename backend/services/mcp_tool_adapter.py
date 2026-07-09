import logging
from typing import List, Dict, Any
from services.mcp_connection_manager import mcp_connection_manager

logger = logging.getLogger(__name__)

class MCPToolAdapter:
    async def get_tools_for_llm(self, workspace_id: str) -> List[Dict[str, Any]]:
        """
        Fetches tools from all active MCP servers for the workspace and formats them
        for standard LLM function calling (OpenAI format).
        """
        raw_tools = await mcp_connection_manager.get_all_tools(workspace_id)
        llm_tools = []
        for tool in raw_tools:
            llm_tools.append({
                "type": "function",
                "function": {
                    "name": tool["name"],
                    "description": tool["description"],
                    "parameters": tool["inputSchema"]
                }
            })
            # Stash the server routing in the description or keep a mapping in memory
            # For simplicity, we assume the tool name is unique across the workspace,
            # but ideally we prefix it like `mcp__serverId__toolName`
        return llm_tools

    async def execute_tool(self, workspace_id: str, tool_name: str, arguments: Dict[str, Any]) -> str:
        """
        Finds which server owns the tool and executes it.
        """
        raw_tools = await mcp_connection_manager.get_all_tools(workspace_id)
        target_tool = next((t for t in raw_tools if t["name"] == tool_name), None)
        
        if not target_tool:
            raise ValueError(f"Tool {tool_name} not found in workspace {workspace_id}")
            
        server_id = target_tool.get('__server_id')
        client = await mcp_connection_manager.get_or_connect(server_id)
        
        result = await client.call_tool(tool_name, arguments)
        return str(result)

mcp_tool_adapter = MCPToolAdapter()
