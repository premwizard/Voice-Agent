# ==============================================================================
# FILE: websocket_manager.py
# WHAT THIS FILE IS: WebSocket Connection Manager Module.
# WHY IT IS USED: Manages all active WebSocket connections (clients connected to 
#                 the server), allowing us to handle connecting, disconnecting, 
#                 sending direct messages, and broadcasting messages to all clients.
# ==============================================================================

# Import List type for type hinting arrays of WebSocket connections
from typing import List
# Import WebSocket class from FastAPI to type-hint incoming socket connections
from fastapi import WebSocket

# Define the ConnectionManager class to maintain active socket connections
class ConnectionManager:
    def __init__(self):
        # Initialize an empty list to store all active client WebSocket connections
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        """
        Accepts an incoming WebSocket connection request and saves it to active connections.
        """
        # Accept the handshake from the client to keep the socket connection open
        await websocket.accept()
        # Append the accepted websocket instance to our active connections list
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        """
        Removes a disconnected WebSocket from the active connections list.
        """
        # Check if the connection exists in the list before removing to prevent errors
        if websocket in self.active_connections:
            # Remove the closed websocket instance from our active connections list
            self.active_connections.remove(websocket)

    async def send_personal_message(self, message: str, websocket: WebSocket):
        """
        Sends a text message directly to a single specific client WebSocket.
        """
        # Send text data over the specific client's open WebSocket channel
        await websocket.send_text(message)

    async def broadcast(self, message: str):
        """
        Broadcasts a text message to all currently connected client WebSockets.
        """
        # Iterate over every currently active client connection in our list
        for connection in self.active_connections:
            # Send the text message to each connected client socket
            await connection.send_text(message)

# Create a single global instance of ConnectionManager to be reused across endpoints
manager = ConnectionManager()
