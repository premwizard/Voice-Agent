from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from ws_server.manager import manager
from config.settings import settings
import uuid
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title=settings.app_name,
    description="Backend for the real-time AI Voice Agent",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict this
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"status": "ok", "message": "Voice Agent Backend is running."}

@app.get("/health")
def health_check():
    return {"status": "healthy"}

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    # Generate a unique conversation ID for this session
    conversation_id = str(uuid.uuid4())
    await manager.connect(websocket, conversation_id)
    try:
        while True:
            data = await websocket.receive_text()
            await manager.handle_message(websocket, conversation_id, data)
    except WebSocketDisconnect:
        manager.disconnect(websocket, conversation_id)
        logger.info(f"Client disconnected: {conversation_id}")
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        manager.disconnect(websocket, conversation_id)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
