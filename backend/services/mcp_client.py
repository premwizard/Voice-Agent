import asyncio
import json
import logging
import uuid
import shlex
from typing import Dict, Any, Optional, List

logger = logging.getLogger(__name__)

class MCPClient:
    """
    A lightweight, asynchronous JSON-RPC 2.0 client for the Model Context Protocol (MCP).
    Supports STDIO transport.
    """
    def __init__(self, command: str, args: List[str] = None, env: Dict[str, str] = None):
        self.command = command
        self.args = args or []
        self.env = env or {}
        self.process: Optional[asyncio.subprocess.Process] = None
        self._pending_requests: Dict[str, asyncio.Future] = {}
        self._reader_task: Optional[asyncio.Task] = None
        self._message_id_counter = 1
        
        # Caches
        self.tools_cache = []
        self.resources_cache = []
        self.prompts_cache = []

    async def connect(self):
        """Starts the subprocess and initializes the MCP session."""
        try:
            self.process = await asyncio.create_subprocess_exec(
                self.command, *self.args,
                stdin=asyncio.subprocess.PIPE,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
                env=self.env
            )
            self._reader_task = asyncio.create_task(self._read_loop())
            
            # Send MCP Initialize Request
            init_res = await self.request("initialize", {
                "protocolVersion": "2024-11-05",
                "capabilities": {},
                "clientInfo": {"name": "voice-agent-mcp", "version": "1.0.0"}
            })
            # Send initialized notification
            await self.notify("notifications/initialized", {})
            logger.info(f"Connected to MCP Server: {self.command}")
            return init_res
        except Exception as e:
            logger.error(f"Failed to connect to MCP Server: {e}")
            raise

    async def _read_loop(self):
        """Reads JSON-RPC messages from STDOUT."""
        while self.process and self.process.returncode is None:
            try:
                line = await self.process.stdout.readline()
                if not line:
                    break
                data = json.loads(line.decode().strip())
                self._handle_message(data)
            except json.JSONDecodeError:
                continue # ignore non-json logs
            except Exception as e:
                logger.error(f"Error reading from MCP: {e}")
                break

    def _handle_message(self, data: Dict[str, Any]):
        if "id" in data and (data.get("result") or "error" in data):
            # Response to a request
            msg_id = str(data["id"])
            if msg_id in self._pending_requests:
                future = self._pending_requests.pop(msg_id)
                if not future.done():
                    if "error" in data:
                        future.set_exception(Exception(data["error"]))
                    else:
                        future.set_result(data.get("result"))
        elif "method" in data:
            # Notification or Server Request (e.g., ping)
            pass

    async def request(self, method: str, params: Dict[str, Any] = None) -> Any:
        if not self.process:
            raise ConnectionError("Not connected")
            
        msg_id = str(self._message_id_counter)
        self._message_id_counter += 1
        
        future = asyncio.Future()
        self._pending_requests[msg_id] = future
        
        payload = {
            "jsonrpc": "2.0",
            "id": msg_id,
            "method": method,
            "params": params or {}
        }
        
        self.process.stdin.write((json.dumps(payload) + "\n").encode())
        await self.process.stdin.drain()
        
        # Timeout after 30s
        return await asyncio.wait_for(future, timeout=30.0)

    async def notify(self, method: str, params: Dict[str, Any] = None):
        if not self.process:
            return
        payload = {
            "jsonrpc": "2.0",
            "method": method,
            "params": params or {}
        }
        self.process.stdin.write((json.dumps(payload) + "\n").encode())
        await self.process.stdin.drain()

    # High-level MCP operations
    async def list_tools(self) -> List[Dict[str, Any]]:
        res = await self.request("tools/list")
        self.tools_cache = res.get("tools", [])
        return self.tools_cache

    async def call_tool(self, name: str, arguments: Dict[str, Any]) -> Any:
        return await self.request("tools/call", {"name": name, "arguments": arguments})
        
    async def list_resources(self) -> List[Dict[str, Any]]:
        res = await self.request("resources/list")
        self.resources_cache = res.get("resources", [])
        return self.resources_cache

    async def read_resource(self, uri: str) -> Any:
        return await self.request("resources/read", {"uri": uri})

    async def list_prompts(self) -> List[Dict[str, Any]]:
        res = await self.request("prompts/list")
        self.prompts_cache = res.get("prompts", [])
        return self.prompts_cache

    async def disconnect(self):
        if self._reader_task:
            self._reader_task.cancel()
        if self.process:
            try:
                self.process.terminate()
            except ProcessLookupError:
                pass
        self.process = None
