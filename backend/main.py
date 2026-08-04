# ==============================================================================
# FILE: main.py
# WHAT THIS FILE IS: Main Application Entrypoint for FastAPI.
# WHY IT IS USED: Initializes the FastAPI app instance, configures CORS middleware 
#                 for frontend cross-origin requests, includes API routes, and 
#                 defines root endpoints.
# ==============================================================================

# Import main FastAPI class to instantiate web app
from fastapi import FastAPI
# Import CORS Middleware to allow web browsers (Next.js frontend) to connect safely
from fastapi.middleware.cors import CORSMiddleware
# Import settings object containing loaded configuration variables
from config import settings
# Import api_router containing all REST endpoints and WebSocket endpoints
from router import router as api_router

# Initialize the FastAPI application with title, description, and version
app = FastAPI(
    title="Voice Agent API",
    description="Real-time Voice Agent backend using FastAPI",
    version="0.1.0"
)

# Configure CORS Middleware to allow all origins safely for local dev
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register/include the API router into the main FastAPI application
app.include_router(api_router)

# Define the root HTTP GET endpoint ("/")
@app.get("/")
def read_root():
    """
    Root endpoint returning server operational status and docs link.
    """
    return {
        "status": "online",
        "message": "Voice Agent API is running",
        "docs_url": "/docs"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
