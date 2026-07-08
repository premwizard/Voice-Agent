import { useVoiceStore } from '../stores/voiceStore';

class WebSocketService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimeout = 2000;
  private url = 'ws://localhost:8000/ws';
  private intentionalDisconnect = false;
  private reconnectTimeoutRef: any = null;

  connect() {
    this.intentionalDisconnect = false;
    if (this.reconnectTimeoutRef) {
      clearTimeout(this.reconnectTimeoutRef);
    }
    
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    try {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        console.log('WebSocket Connected');
        useVoiceStore.getState().setIsConnected(true);
        this.reconnectAttempts = 0;
      };

      this.ws.onmessage = (event) => {
        this.handleMessage(event.data);
      };

      this.ws.onclose = () => {
        console.log('WebSocket Disconnected');
        useVoiceStore.getState().setIsConnected(false);
        if (!this.intentionalDisconnect) {
          this.attemptReconnect();
        }
      };

      this.ws.onerror = () => {
        if (!this.intentionalDisconnect) {
          console.error('WebSocket Error: Could not connect to backend server. Make sure the backend is running on port 8000.');
        }
      };
    } catch (error) {
      console.error('Failed to establish WebSocket connection:', error);
    }
  }

  private attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Reconnecting... Attempt ${this.reconnectAttempts}`);
      this.reconnectTimeoutRef = setTimeout(() => this.connect(), this.reconnectTimeout * this.reconnectAttempts);
    }
  }

  private handleMessage(data: string) {
    try {
      const message = JSON.parse(data);
      console.log('WS Received:', message.type, message);
      const store = useVoiceStore.getState();

      switch (message.type) {
        case 'CONNECTED':
          store.setConversationId(message.conversation_id);
          break;
        case 'PONG':
          // Handle ping/pong if needed
          break;
        case 'AI_STREAM':
          store.setIsThinking(false);
          store.setIsSpeaking(true);
          store.setAiPartialTranscript(store.aiPartialTranscript + message.content);
          break;
        case 'AI_SENTENCE':
          if (store.activeMode === 'voice') {
            import('./ttsService').then(({ ttsService }) => {
              ttsService.speak(message.content);
            });
          }
          if (message.metadata?.ttft) {
            console.log(`TTFT Logged on frontend: ${message.metadata.ttft}s`);
          }
          break;
        case 'AI_FINAL':
          store.setIsSpeaking(false);
          if (store.aiPartialTranscript) {
            store.addMessage({ role: 'assistant', content: store.aiPartialTranscript });
            store.setAiPartialTranscript('');
          }
          if (message.metadata?.total_time) {
            console.log(`Total Response Time: ${message.metadata.total_time}s`);
          }
          break;
        case 'ERROR':
          console.error('Server Error:', message.content);
          store.setIsThinking(false);
          store.setIsSpeaking(false);
          store.setAiPartialTranscript(''); // Clear any partial transcript just in case
          store.setSystemNotification(message.content || "An unknown error occurred.");
          break;
      }
    } catch (e) {
      console.error('Error parsing WS message:', e);
    }
  }

  sendMessage(type: string, content?: string) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const payload = {
        type,
        content,
        conversation_id: useVoiceStore.getState().conversationId,
      };
      console.log('WS Sending:', type, payload);
      this.ws.send(JSON.stringify(payload));
    } else {
      console.error('Cannot send message, WebSocket is not open');
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
