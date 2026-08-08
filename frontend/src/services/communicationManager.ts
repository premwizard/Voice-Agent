// ==============================================================================
// FILE: src/services/communicationManager.ts
// WHAT THIS FILE IS: Centralized Multi-Channel Communication Manager.
// WHY IT IS USED: Abstraction layer managing:
//                 1. REST: High-speed local commands (<50ms) & system control
//                 2. SSE: Progressive AI response text token streaming
//                 3. WebSocket: Real-time background events, notifications & auto-reconnect.
// ==============================================================================

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:8000";
const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://127.0.0.1:8000/api/v1/ws/events";

export interface CommandResult {
  route: "FAST_PATH" | "CHAT" | "COMPLEX_TASK";
  confidence: "HIGH" | "MEDIUM" | "LOW";
  executed: boolean;
  tool?: string;
  arguments?: Record<string, any>;
  result?: any;
  latency_metrics?: {
    total_latency_ms: number;
    stages: Record<string, float>;
  };
  message: string;
}

export class CommunicationManager {
  private socket: WebSocket | null = null;
  private eventListeners: Set<(eventData: any) => void> = new Set();
  private isWsConnected: boolean = false;
  private reconnectAttempts: number = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;

  constructor() {
    this.initWebSocket();
  }

  // 1. High-Speed REST Command Execution (<50ms for local actions)
  async executeCommand(
    prompt: string, 
    requestId?: string, 
    userConfirmed: boolean = false
  ): Promise<CommandResult> {
    try {
      const response = await fetch(`${BACKEND_URL}/api/v1/commands`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          request_id: requestId || `req_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          user_confirmed: userConfirmed
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP Error ${response.status}`);
      }

      return await response.json();
    } catch (err: any) {
      console.warn("REST command execution failed, falling back:", err);
      return {
        route: "CHAT",
        confidence: "LOW",
        executed: false,
        message: err.message || "Failed to execute command over REST."
      };
    }
  }

  // 2. Server-Sent Events (SSE) AI Streaming Text Response Consumer
  async streamChatResponse(
    prompt: string,
    history: { role: string; content: string }[] = [],
    model?: string,
    userConfirmed: boolean = false,
    onChunk?: (chunk: string) => void,
    onComplete?: () => void,
    onError?: (err: any) => void
  ): Promise<void> {
    try {
      const response = await fetch(`${BACKEND_URL}/api/v1/chat/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          history,
          model,
          user_confirmed: userConfirmed
        }),
      });

      if (!response.ok || !response.body) {
        throw new Error(`HTTP SSE Error ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith("data: ")) {
            const rawData = trimmed.replace(/^data:\s*/, "");
            if (rawData === "[DONE]") {
              if (onComplete) onComplete();
              return;
            }
            try {
              const parsed = JSON.parse(rawData);
              if (parsed.token && onChunk) {
                onChunk(parsed.token);
              }
              if (parsed.error && onError) {
                onError(parsed.error);
              }
            } catch (e) {
              if (onChunk) onChunk(rawData);
            }
          }
        }
      }

      if (onComplete) onComplete();
    } catch (err: any) {
      console.error("SSE stream reading failed:", err);
      if (onError) onError(err);
    }
  }

  // 3. WebSocket Real-Time Events & Notifications with Exponential Backoff
  private initWebSocket() {
    if (typeof window === "undefined") return;

    try {
      this.socket = new WebSocket(WS_URL);

      this.socket.onopen = () => {
        console.log("CommunicationManager: WebSocket connected to", WS_URL);
        this.isWsConnected = true;
        this.reconnectAttempts = 0;
        if (this.reconnectTimer) {
          clearTimeout(this.reconnectTimer);
          this.reconnectTimer = null;
        }
      };

      this.socket.onmessage = (evt) => {
        try {
          const data = JSON.parse(evt.data);
          this.eventListeners.forEach((listener) => listener(data));
        } catch (e) {
          this.eventListeners.forEach((listener) => listener(evt.data));
        }
      };

      this.socket.onclose = () => {
        this.isWsConnected = false;
        this.scheduleReconnect();
      };

      this.socket.onerror = (err) => {
        console.warn("CommunicationManager: WS Error:", err);
        this.isWsConnected = false;
      };
    } catch (e) {
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) return;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 15000);
    this.reconnectAttempts++;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.initWebSocket();
    }, delay);
  }

  public subscribeEvents(callback: (eventData: any) => void): () => void {
    this.eventListeners.add(callback);
    return () => {
      this.eventListeners.delete(callback);
    };
  }

  public isWebSocketConnected(): boolean {
    return this.isWsConnected;
  }
}

export const commsManager = new CommunicationManager();
