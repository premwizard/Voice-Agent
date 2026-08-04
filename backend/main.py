from fastapi import FastAPI

app = FastAPI(
    title="Voice Agent API",
    description="Real-time Voice Agent backend using FastAPI",
    version="0.1.0"
)

@app.get("/")
def read_root():
    return {"status": "online", "message": "Voice Agent API is running"}
