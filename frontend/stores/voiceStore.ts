import { create } from 'zustand';

export type AIProvider = 'openrouter';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  mode?: 'voice' | 'chat';
}

export type ConversationState =
  | 'idle'
  | 'connecting'
  | 'listening'
  | 'speech_detected'
  | 'transcribing'
  | 'thinking'
  | 'streaming_response'
  | 'speaking'
  | 'interrupted'
  | 'error'
  | 'disconnected';

interface VoiceState {
  // Mode state
  activeMode: 'voice' | 'chat';
  setActiveMode: (mode: 'voice' | 'chat') => void;

  // Unified State Machine
  status: ConversationState;
  setStatus: (status: ConversationState) => void;

  // Connection state
  isConnected: boolean;
  setIsConnected: (status: boolean) => void;

  // Legacy boolean for component compatibility
  isRecording: boolean;
  setIsRecording: (status: boolean) => void;

  // Transcripts
  userPartialTranscript: string;
  setUserPartialTranscript: (text: string) => void;
  aiPartialTranscript: string;
  setAiPartialTranscript: (text: string) => void;

  // History
  messages: ChatMessage[];
  addMessage: (msg: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  /** Bulk-load persisted messages from DB (called on HISTORY_LOAD). */
  setMessages: (messages: ChatMessage[]) => void;
  updateMessage: (id: string, content: string) => void;
  deleteMessage: (id: string) => void;
  clearMessages: () => void;

  // Settings
  provider: AIProvider;
  setProvider: (provider: AIProvider) => void;
  conversationId: string | null;
  setConversationId: (id: string | null) => void;

  // Errors / notifications
  systemNotification: string | null;
  setSystemNotification: (notification: string | null) => void;
}

export const useVoiceStore = create<VoiceState>()((set) => ({
  activeMode: 'voice',
  setActiveMode: (mode) => set({ activeMode: mode }),

  status: 'disconnected',
  setStatus: (status) => set({ status }),

  isConnected: false,
  setIsConnected: (status) => set({ isConnected: status }),

  isRecording: false,
  setIsRecording: (status) => set({ isRecording: status }),

  userPartialTranscript: '',
  setUserPartialTranscript: (text) => set({ userPartialTranscript: text }),

  aiPartialTranscript: '',
  setAiPartialTranscript: (text) => set({ aiPartialTranscript: text }),

  messages: [],
  addMessage: (msg) =>
    set((state) => ({
      messages: [
        ...state.messages,
        {
          ...msg,
          id: crypto.randomUUID(),
          timestamp: Date.now(),
        },
      ],
    })),
  setMessages: (messages) => set({ messages }),
  updateMessage: (id, content) =>
    set((state) => ({
      messages: state.messages.map((msg) =>
        msg.id === id ? { ...msg, content } : msg,
      ),
    })),
  deleteMessage: (id) =>
    set((state) => ({
      messages: state.messages.filter((msg) => msg.id !== id),
    })),
  clearMessages: () => set({ messages: [] }),

  provider: 'openrouter',
  setProvider: (provider) => set({ provider }),

  conversationId: null,
  setConversationId: (id) => set({ conversationId: id }),

  systemNotification: null,
  setSystemNotification: (notification) => set({ systemNotification: notification }),
}));
