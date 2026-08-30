# ==============================================================================
# FILE: backend/tests/test_websocket_endpoint.py
# WHAT THIS FILE IS: Unit Test for WebSocket Stream Endpoint using FastAPI TestClient.
# WHY IT IS USED: Verifies WebSocket connection, initial payload, and streaming response
#                 without requiring an externally running server instance.
# ==============================================================================

from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_websocket_stream():
    """Test connecting to /api/v1/ws/events endpoint and receiving stream messages."""
    with client.websocket_connect("/api/v1/ws/events") as websocket:
        data = websocket.receive_text()
        assert "connected" in data
        assert "Phoenix AI Events WebSocket stream" in data
