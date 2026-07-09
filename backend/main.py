from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Query
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from ws_server.manager import manager
from config.settings import settings
from database.db import init_db
from api.conversations import router as conversations_router
from api.documents import router as documents_router
from api.auth import router as auth_router
from api.mcp import router as mcp_router

import uuid
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize the database on startup."""
    await init_db()
    yield


app = FastAPI(
    title=settings.app_name,
    description="Backend for the real-time AI Voice Agent with persistent memory",
    version="2.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],  # In production, restrict to your domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register REST API router
app.include_router(auth_router)
app.include_router(mcp_router)
app.include_router(conversations_router)
app.include_router(documents_router)

@app.get("/")
def read_root():
    return {"status": "ok", "message": "Voice Agent Backend is running.", "version": "2.0.0"}


@app.get("/health")
def health_check():
    return {"status": "healthy"}


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket, token: str = Query(None)):
    if not token:
        await websocket.close(code=1008, reason="Missing token")
        return
        
    try:
        import jwt
        payload = jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
        user_id = payload.get("sub")
        if not user_id:
            raise ValueError("Invalid token payload")
    except Exception as e:
        await websocket.close(code=1008, reason="Invalid token")
        return

    # Get default workspace for the user
    try:
        from database.db import get_db
        async with get_db() as conn:
            cursor = await conn.execute("SELECT id FROM workspaces WHERE user_id = ? LIMIT 1", (user_id,))
            workspace = await cursor.fetchone()
            if not workspace:
                await websocket.close(code=1008, reason="Workspace not found")
                return
            workspace_id = workspace["id"]
    except Exception as e:
        logger.error(f"Error fetching workspace: {e}")
        await websocket.close(code=1008, reason="Internal error")
        return

    # Accept an optional conversation_id query param for session resumption.
    # If not provided, generate a new unique ID (preserves existing behavior).
    conversation_id = websocket.query_params.get("conversation_id") or str(uuid.uuid4())
    mode = websocket.query_params.get("mode", "chat")

    await manager.connect(websocket, conversation_id, workspace_id, mode=mode)
    try:
        while True:
            data = await websocket.receive_text()
            await manager.handle_message(websocket, conversation_id, data)
    except WebSocketDisconnect:
        manager.disconnect(websocket, conversation_id)
        logger.info(f"Client disconnected: {conversation_id}")
    except Exception as e:
        logger.error(f"WebSocket error for {conversation_id}: {e}")
        manager.disconnect(websocket, conversation_id)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
