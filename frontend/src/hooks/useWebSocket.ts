// ==============================================================================
// FILE: src/hooks/useWebSocket.ts
// WHAT THIS FILE IS: Custom React Hook for Managing WebSocket Client Lifecycle.
// WHY IT IS USED: Handles connecting to the FastAPI WebSocket endpoint, receiving 
//                 real-time AI token streams, sending prompts, reconnecting automatically, 
//                 queueing pending messages, and handling React StrictMode / Fast Refresh.
// ==============================================================================

"use client";

import { useState, useEffect, useRef, useCallback } from "react";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://127.0.0.1:8000/api/v1/ws/stream";

export interface HistoryMessage {
  role: "user" | "assistant";
  content: string;
}

export interface SendOptions {
  model?: string;
  systemPrompt?: string;
}

export function useWebSocket() {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [messages, setMessages] = useState<string[]>([]);
  const [currentStream, setCurrentStream] = useState<string>("");
  const [isStreaming, setIsStreaming] = useState<boolean>(false);

  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<NodeJS.Timeout | null>(null);
  const streamTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef<boolean>(true);
  
  // Pending message queue for instant send on connection open
  const pendingPayloadsRef = useRef<string[]>([]);

  // Function to establish WebSocket connection
  const connect = useCallback(() => {
    if (!isMountedRef.current) return;
    
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
      const socket = new WebSocket(WS_URL);
      socketRef.current = socket;

      socket.onopen = () => {
        if (!isMountedRef.current) return;
        console.log("WebSocket connected to:", WS_URL);
        setIsConnected(true);
        if (reconnectTimerRef.current) {
          clearTimeout(reconnectTimerRef.current);
          reconnectTimerRef.current = null;
        }

        // Drain pending send queue immediately upon connection open
        while (pendingPayloadsRef.current.length > 0) {
          const queuedPayload = pendingPayloadsRef.current.shift();
          if (queuedPayload && socket.readyState === WebSocket.OPEN) {
            console.log("Flushing queued prompt over newly opened WebSocket");
            setCurrentStream("");
            setIsStreaming(true);
            socket.send(queuedPayload);
          }
        }
      };

      socket.onmessage = (event: MessageEvent) => {
        if (!isMountedRef.current) return;
        const incomingText: string = event.data;

        if (incomingText.startsWith("Connected to Voice Agent")) {
          return;
        }

        if (incomingText === "[END_OF_STREAM]") {
          if (streamTimeoutRef.current) {
            clearTimeout(streamTimeoutRef.current);
            streamTimeoutRef.current = null;
          }
          setIsStreaming(false);
          return;
        }

        setCurrentStream((prev) => prev + incomingText);
        setIsStreaming(true);

        if (streamTimeoutRef.current) {
          clearTimeout(streamTimeoutRef.current);
        }
        streamTimeoutRef.current = setTimeout(() => {
          if (isMountedRef.current) {
            setIsStreaming(false);
          }
        }, 1500);
      };

      socket.onclose = (event: CloseEvent) => {
        if (!isMountedRef.current) return;
        console.warn("WebSocket closed:", event.code, event.reason);
        setIsConnected(false);
        setIsStreaming(false);

        // Auto-reconnect after 1.5s
        if (!reconnectTimerRef.current) {
          reconnectTimerRef.current = setTimeout(() => {
            if (isMountedRef.current) {
              connect();
            }
          }, 1500);
        }
      };

      socket.onerror = (err) => {
        if (!isMountedRef.current) return;
        console.warn("WebSocket error observed:", err);
        setIsConnected(false);
        setIsStreaming(false);
      };
    } catch (err) {
      console.warn("Failed to instantiate WebSocket:", err);
    }
  }, []);

  const disconnect = useCallback(() => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    if (streamTimeoutRef.current) {
      clearTimeout(streamTimeoutRef.current);
      streamTimeoutRef.current = null;
    }
    if (socketRef.current) {
      socketRef.current.onopen = null;
      socketRef.current.onmessage = null;
      socketRef.current.onclose = null;
      socketRef.current.onerror = null;
      
      if (socketRef.current.readyState === WebSocket.OPEN) {
        socketRef.current.close();
      }
      socketRef.current = null;
    }
  }, []);

  // Send message with queue fallback
  const sendMessage = useCallback((prompt: string, history?: HistoryMessage[], options?: SendOptions) => {
    const payload = JSON.stringify({
      prompt,
      history: history ? history.map(h => ({ role: h.role, content: h.content })) : [],
      model: options?.model,
      system_prompt: options?.systemPrompt
    });

    const activeSocket = socketRef.current;
    
    if (activeSocket && activeSocket.readyState === WebSocket.OPEN) {
      setCurrentStream("");
      setIsStreaming(true);
      setMessages((prev) => [...prev, `User: ${prompt}`]);
      activeSocket.send(payload);
    } else {
      console.log("WebSocket not yet open. Queueing payload for immediate send upon connection.");
      if (!pendingPayloadsRef.current.includes(payload)) {
        pendingPayloadsRef.current.push(payload);
      }
      connect();
    }
  }, [connect]);

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
