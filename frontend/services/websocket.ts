/**
 * WebSocketService — upgraded for Phase 2 persistent memory.
 *
 * Changes:
 * - connect() accepts an optional conversationId to resume a session
 * - Passes conversation_id as query param so backend can load history
 * - Handles HISTORY_LOAD message to restore persisted messages into the store
 * - Handles CONVERSATION_SWITCH for future multi-tab support
 */

import { useVoiceStore } from '../stores/voiceStore';
import { useConversationStore } from '../stores/conversationStore';
import { useAuthStore } from '../stores/authStore';
import { useAgentStore } from '../stores/agentStore';
import type { ChatMessage } from '../stores/voiceStore';

const WS_BASE = process.env.NEXT_PUBLIC_WS_URL ?? 'ws://127.0.0.1:8000';

class WebSocketService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 2000;
  private intentionalDisconnect = false;
  private reconnectTimeoutRef: ReturnType<typeof setTimeout> | null = null;
  private pendingConversationId: string | null = null;

  connect(conversationId?: string | null) {
    this.intentionalDisconnect = false;
    this.pendingConversationId = conversationId ?? null;

    if (this.reconnectTimeoutRef) {
      clearTimeout(this.reconnectTimeoutRef);
    }

    if (
      this.ws &&
      (this.ws.readyState === WebSocket.OPEN ||
        this.ws.readyState === WebSocket.CONNECTING)
    ) {
      return;
    }

    const mode = useVoiceStore.getState().activeMode;
    const token = useAuthStore.getState().token;

    if (!token) {
      console.warn('[WS] Connection skipped: No authentication token found.');
      return;
    }

    const params = new URLSearchParams({ mode, token });
    if (conversationId) {
      params.set('conversation_id', conversationId);
    }
    const url = `${WS_BASE}/ws?${params.toString()}`;

    try {
      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        console.log('[WS] Connected');
        useVoiceStore.getState().setIsConnected(true);
        this.reconnectAttempts = 0;
      };

      this.ws.onmessage = (event) => {
        this.handleMessage(event.data);
      };

      this.ws.onclose = (event) => {
        console.log('[WS] Disconnected', event.code, event.reason);
        useVoiceStore.getState().setIsConnected(false);
        if (!this.intentionalDisconnect && event.code !== 1008) {
          this.attemptReconnect();
        }
      };

      this.ws.onerror = () => {
        if (!this.intentionalDisconnect) {
          console.warn(
            '[WS] Connection error: WebSocket failed to connect to backend on port 8000.',
          );
        }
      };
    } catch (error) {
      console.error('[WS] Failed to establish connection:', error);
    }
  }

  private attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * this.reconnectAttempts;
      console.log(`[WS] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);
      this.reconnectTimeoutRef = setTimeout(() => {
        // Resume the same conversation on reconnect
        const conversationId =
          useVoiceStore.getState().conversationId ?? this.pendingConversationId;
        this.connect(conversationId);
      }, delay);
    }
  }

  private handleMessage(data: string) {
    try {
      const message = JSON.parse(data);
      console.log('[WS] Received:', message.type, message);

      const voiceStore = useVoiceStore.getState();
      const convStore = useConversationStore.getState();

      // Lazy import for latency store to avoid circular deps
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { useLatencyStore } = require('../stores/latencyStore');
      const latencyStore = useLatencyStore.getState();

      switch (message.type) {
        case 'CONNECTED': {
          voiceStore.setConversationId(message.conversation_id);
          convStore.setActiveConversationId(message.conversation_id);
          voiceStore.setStatus('idle');
          break;
        }

        case 'HISTORY_LOAD': {
          // Backend sends persisted messages on connect
          const rawMessages: Array<{
            id: string;
            role: 'user' | 'assistant';
            content: string;
            timestamp: string;
            mode?: 'voice' | 'chat';
          }> = message.metadata?.messages ?? [];

          if (rawMessages.length > 0) {
            const chatMessages: ChatMessage[] = rawMessages.map((m) => ({
              id: m.id,
              role: m.role,
              content: m.content,
              timestamp: new Date(m.timestamp).getTime(),
              mode: m.mode ?? 'chat',
            }));
            voiceStore.setMessages(chatMessages);
            console.log(`[WS] Loaded ${chatMessages.length} persisted messages`);
          }
          break;
        }

        case 'PONG': {
          if (message.metadata?.rtt) {
            latencyStore.updateMetrics({ websocketLatency: message.metadata.rtt });
          }
          break;
        }

        case 'AGENT_STATUS': {
          const agentStore = useAgentStore.getState();
          agentStore.addStatus({
            agent_name: message.metadata?.agent_name ?? 'UnknownAgent',
            task_id: message.metadata?.task_id ?? 'unknown_task',
            status: message.content ?? 'running',
            detail: message.metadata?.detail
          });
          break;
        }

        case 'AI_STREAM': {
          voiceStore.setStatus('streaming_response');
          voiceStore.setAiPartialTranscript(
            voiceStore.aiPartialTranscript + message.content,
          );
          break;
        }

        case 'AI_SENTENCE': {
          if (voiceStore.activeMode === 'voice') {
            import('./ttsService').then(({ ttsService }) => {
              ttsService.speak(message.content);
            });
          }
          if (message.metadata?.ttft) {
            latencyStore.updateMetrics({ llmFirstTokenTime: message.metadata.ttft });
          }
          break;
        }

        case 'AI_FINAL': {
          if (voiceStore.activeMode === 'chat') {
            voiceStore.setStatus('idle');
          }
          if (voiceStore.aiPartialTranscript) {
            voiceStore.addMessage({
              role: 'assistant',
              content: voiceStore.aiPartialTranscript,
            });
            voiceStore.setAiPartialTranscript('');
          }
          if (message.metadata?.total_time) {
            latencyStore.updateMetrics({
              totalResponseTime: message.metadata.total_time,
            });
          }
          // Refresh the conversation list to pick up auto-title changes
          convStore.loadConversations();
          break;
        }

        case 'TRACE_URL': {
          const lastMsg = voiceStore.messages[voiceStore.messages.length - 1];
          if (lastMsg && lastMsg.role === 'assistant') {
            voiceStore.updateMessageTraceUrl(lastMsg.id, message.content);
          }
          break;
        }

        case 'ERROR': {
          console.error('[WS] Server Error:', message.content);
          voiceStore.setStatus('error');
          voiceStore.setAiPartialTranscript('');
          voiceStore.setSystemNotification(
            message.content ?? 'An unknown error occurred.',
          );
          break;
        }

        default:
          break;
      }
    } catch (e) {
      console.error('[WS] Error parsing message:', e);
    }
  }

  async sendMessage(type: string, content?: string, metadata?: Record<string, unknown>): Promise<boolean> {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn('[WS] Socket not open. Attempting connection before sending message...');
      const conversationId = useVoiceStore.getState().conversationId || useConversationStore.getState().activeConversationId;
      this.connect(conversationId);
      
      let waited = 0;
      while ((!this.ws || this.ws.readyState === WebSocket.CONNECTING) && waited < 3000) {
        await new Promise((res) => setTimeout(res, 100));
        waited += 100;
      }
    }

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const payload: Record<string, unknown> = {
        type,
        content,
        conversation_id: useVoiceStore.getState().conversationId,
      };
      if (metadata) {
        payload.metadata = metadata;
      }
      console.log('[WS] Sending:', type, payload);
      this.ws.send(JSON.stringify(payload));
      return true;
    } else {
      console.error('[WS] Cannot send — WebSocket connection is not open.');
      useVoiceStore.getState().setSystemNotification(
        'Unable to connect to Voice Agent backend. Please verify backend is running on port 8000.',
      );
      useVoiceStore.getState().setStatus('idle');
      return false;
    }
  }

  disconnect() {
    this.intentionalDisconnect = true;
    if (this.reconnectTimeoutRef) {
      clearTimeout(this.reconnectTimeoutRef);
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

export const wsService = new WebSocketService();
