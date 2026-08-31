# ==============================================================================
# FILE: test_websocket.py
# WHAT THIS FILE IS: Asynchronous Python Test Script for AI WebSockets.
# WHY IT IS USED: Allows us to test our real-time AI token streaming endpoint (/api/v1/ws/stream) 
#                 directly from the terminal without needing a frontend UI yet.
# ==============================================================================

# Import asyncio for managing asynchronous event loops
import asyncio
import pytest
# Import websockets library to create a client WebSocket connection
import websockets

@pytest.mark.asyncio
@pytest.mark.skip(reason="Manual integration test requiring a running backend server on ws://localhost:8000")
async def test_ai_websocket():
    # WebSocket URL pointing to our local FastAPI WebSocket endpoint
    uri = "ws://localhost:8000/api/v1/ws/stream"
    
    print(f"Connecting to AI WebSocket endpoint: {uri}...")
    
    # Establish WebSocket connection asynchronously
    async with websockets.connect(uri) as websocket:
        # Receive and print initial welcome message from server
        welcome_msg = await websocket.recv()
        print(f"\n[SERVER -> CLIENT WELCOME]: {welcome_msg}")
        
        # Send a sample prompt message to the AI
        test_prompt = "What is a voice agent?"
        print(f"\n[CLIENT -> SERVER PROMPT]: '{test_prompt}'")
        await websocket.send(test_prompt)
        
        print("\n[AI STREAMING RESPONSE]: ", end="", flush=True)
        
        # Loop to receive streaming AI token chunks asynchronously
        try:
            while True:
                # Receive next token chunk with 3-second timeout for stream end
                chunk = await asyncio.wait_for(websocket.recv(), timeout=3.0)
                if chunk == "[END_OF_STREAM]":
                    print("\n\n[STREAM COMPLETED]")
                    break
                # Print token chunk continuously on the same line to simulate real-time typing
                print(chunk, end="", flush=True)
        except asyncio.TimeoutError:
            print("\n\n[STREAM COMPLETED]")

# Run the async test script using asyncio event loop
if __name__ == "__main__":
    asyncio.run(test_ai_websocket())
