from fastapi import APIRouter, HTTPException, Depends
from typing import List, Dict, Any
from middleware.auth import get_current_workspace
from schemas.mcp import MCPServerCreate, MCPServerResponse, MCPToolResponse
from services.mcp_registry import mcp_registry
from services.mcp_connection_manager import mcp_connection_manager

router = APIRouter(prefix="/api/mcp", tags=["mcp"])

@router.get("/servers", response_model=List[MCPServerResponse])
async def list_servers(workspace_id: str = Depends(get_current_workspace)):
    servers = await mcp_registry.list_servers(workspace_id)
    return servers

@router.post("/servers", response_model=MCPServerResponse)
async def register_server(
    server_data: MCPServerCreate,
    workspace_id: str = Depends(get_current_workspace)
):
    server = await mcp_registry.register_server(workspace_id, server_data)
    return server

@router.delete("/servers/{server_id}")
async def delete_server(
    server_id: str,
    workspace_id: str = Depends(get_current_workspace)
):
    server = await mcp_registry.get_server(server_id)
    if not server or server["workspace_id"] != workspace_id:
        raise HTTPException(status_code=404, detail="Server not found")
        
    await mcp_registry.delete_server(server_id)
    return {"status": "success"}

@router.post("/servers/{server_id}/connect")
async def connect_server(
    server_id: str,
    workspace_id: str = Depends(get_current_workspace)
):
    server = await mcp_registry.get_server(server_id)
    if not server or server["workspace_id"] != workspace_id:
        raise HTTPException(status_code=404, detail="Server not found")
        
    try:
        await mcp_connection_manager.get_or_connect(server_id)
        return {"status": "connected"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/servers/{server_id}/tools", response_model=List[MCPToolResponse])
async def list_server_tools(
    server_id: str,
    workspace_id: str = Depends(get_current_workspace)
):
    server = await mcp_registry.get_server(server_id)
    if not server or server["workspace_id"] != workspace_id:
        raise HTTPException(status_code=404, detail="Server not found")
        
    try:
        client = await mcp_connection_manager.get_or_connect(server_id)
        tools = await client.list_tools()
        return tools
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
