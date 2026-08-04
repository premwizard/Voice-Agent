// ==============================================================================
// FILE: src/hooks/useWebSocket.ts
// WHAT THIS FILE IS: Custom React Hook for Managing WebSocket Client Lifecycle.
// WHY IT IS USED: Handles connecting to the FastAPI WebSocket endpoint, receiving 
//                 real-time AI token streams, sending prompts, reconnecting automatically, 
//                 and handling React StrictMode / Fast Refresh without console warnings.
// ==============================================================================

"use client";

// Import hooks from React
import { useState, useEffect, useRef, useCallback } from "react";

// Read WebSocket URI from environment variables with fallback
const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000/api/v1/ws/stream";

export function useWebSocket() {
  // State tracking boolean connection status
  const [isConnected, setIsConnected] = useState<boolean>(false);
  // State storing all incoming streaming messages/chunks
  const [messages, setMessages] = useState<string[]>([]);
  // State storing the currently active/typing AI streaming response
  const [currentStream, setCurrentStream] = useState<string>("");
  // State tracking whether the AI is currently streaming a response
  const [isStreaming, setIsStreaming] = useState<boolean>(false);

  // Ref storing active WebSocket instance across re-renders
  const socketRef = useRef<WebSocket | null>(null);
  // Ref tracking reconnect timer
  const reconnectTimerRef = useRef<NodeJS.Timeout | null>(null);
  // Ref tracking unmount status
  const isMountedRef = useRef<boolean>(true);

  // Function to establish WebSocket connection
  const connect = useCallback(() => {
    if (!isMountedRef.current) return;
    
    // Check if socket is already open or opening to prevent duplicate sockets
    if (socketRef.current) {
      if (socketRef.current.readyState === WebSocket.OPEN) {
        setIsConnected(true);
        return;
      }
      if (socketRef.current.readyState === WebSocket.CONNECTING) {
        return;
      }
    }

    try {
      // Instantiate native browser WebSocket client
      const socket = new WebSocket(WS_URL);
      socketRef.current = socket;

      // Event listener when WebSocket handshake completes successfully
      socket.onopen = () => {
        if (!isMountedRef.current) return;
        console.log("WebSocket connected successfully to:", WS_URL);
        setIsConnected(true);
        if (reconnectTimerRef.current) {
          clearTimeout(reconnectTimerRef.current);
          reconnectTimerRef.current = null;
        }
      };

      // Event listener when a message frame arrives from FastAPI server
      socket.onmessage = (event: MessageEvent) => {
        if (!isMountedRef.current) return;
        const incomingText: string = event.data;

        // Update current streaming response accumulator
        setCurrentStream((prev) => prev + incomingText);
        setIsStreaming(true);
      };

      // Event listener when WebSocket closes
      socket.onclose = () => {
        if (!isMountedRef.current) return;
        setIsConnected(false);
        setIsStreaming(false);

        // Auto-reconnect after 3 seconds if disconnected unexpectedly
        if (!reconnectTimerRef.current) {
          reconnectTimerRef.current = setTimeout(() => {
            if (isMountedRef.current) {
              connect();
            }
          }, 3000);
        }
      };

      // Event listener when WebSocket encounters an error
      socket.onerror = () => {
        if (!isMountedRef.current) return;
        setIsConnected(false);
        setIsStreaming(false);
      };
    } catch (err) {
      console.warn("Failed to instantiate WebSocket connection:", err);
    }
  }, []);

  // Function to disconnect WebSocket safely during true component unmount
  const disconnect = useCallback(() => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    if (socketRef.current) {
      // Unbind event listeners before closing to prevent StrictMode warning noise
      socketRef.current.onopen = null;
      socketRef.current.onmessage = null;
      socketRef.current.onclose = null;
      socketRef.current.onerror = null;
      
      if (socketRef.current.readyState === WebSocket.OPEN || socketRef.current.readyState === WebSocket.CONNECTING) {
        socketRef.current.close();
      }
      socketRef.current = null;
    }
  }, []);

  // Function to send a text prompt to FastAPI WebSocket server
  const sendMessage = useCallback((prompt: string) => {
    const activeSocket = socketRef.current;
    
    if (activeSocket && activeSocket.readyState === WebSocket.OPEN) {
      // Clear previous stream accumulator before starting new prompt stream
      setCurrentStream("");
      setIsStreaming(true);
      // Push client prompt into messages history
      setMessages((prev) => [...prev, `User: ${prompt}`]);
      // Transmit prompt text over active WebSocket connection
      activeSocket.send(prompt);
    } else {
      console.log("WebSocket connecting... Queuing prompt send.");
      // Retry sending in 400ms once socket transitions to OPEN state
      setTimeout(() => {
        if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
          setCurrentStream("");
          setIsStreaming(true);
          setMessages((prev) => [...prev, `User: ${prompt}`]);
          socketRef.current.send(prompt);
        }
      }, 400);
    }
  }, []);

  // Connect automatically on hook mount and disconnect on unmount
  useEffect(() => {
    isMountedRef.current = true;
    connect();
    return () => {
      isMountedRef.current = false;
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    isConnected,
    messages,
    currentStream,
    isStreaming,
    sendMessage,
    connect,
    disconnect,
  };
}
