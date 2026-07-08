import { create } from 'zustand';

export type AIProvider = 'openrouter';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

interface VoiceState {
  // Mode state
  activeMode: 'voice' | 'chat';
  setActiveMode: (mode: 'voice' | 'chat') => void;

  // Connection state
  isConnected: boolean;
  setIsConnected: (status: boolean) => void;
  
  // Audio state
  isRecording: boolean;
  setIsRecording: (status: boolean) => void;
  isSpeaking: boolean;
  setIsSpeaking: (status: boolean) => void;
  isThinking: boolean;
  setIsThinking: (status: boolean) => void;
  isDetectingSpeech: boolean;
  setIsDetectingSpeech: (status: boolean) => void;
  
  // Transcripts
  userPartialTranscript: string;
  setUserPartialTranscript: (text: string) => void;
  aiPartialTranscript: string;
  setAiPartialTranscript: (text: string) => void;
  
  // History
  messages: ChatMessage[];
  addMessage: (msg: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  updateMessage: (id: string, content: string) => void;
  deleteMessage: (id: string) => void;
  clearMessages: () => void;
  
  // Settings
  provider: AIProvider;
  setProvider: (provider: AIProvider) => void;
  conversationId: string | null;
  setConversationId: (id: string | null) => void;
}

export const useVoiceStore = create<VoiceState>((set) => ({
  activeMode: 'voice',
  setActiveMode: (mode) => set({ activeMode: mode }),

  isConnected: false,
  setIsConnected: (status) => set({ isConnected: status }),
  
  isRecording: false,
  setIsRecording: (status) => set({ isRecording: status }),
  
  isSpeaking: false,
  setIsSpeaking: (status) => set({ isSpeaking: status }),
  
  isThinking: false,
  setIsThinking: (status) => set({ isThinking: status }),
  
  isDetectingSpeech: false,
  setIsDetectingSpeech: (status) => set({ isDetectingSpeech: status }),
  
  userPartialTranscript: '',
  setUserPartialTranscript: (text) => set({ userPartialTranscript: text }),
  
  aiPartialTranscript: '',
  setAiPartialTranscript: (text) => set({ aiPartialTranscript: text }),
  
  messages: [],
  addMessage: (msg) => set((state) => ({
    messages: [...state.messages, { ...msg, id: Math.random().toString(36).substring(7), timestamp: Date.now() }]
  })),
  updateMessage: (id, content) => set((state) => ({
    messages: state.messages.map(msg => msg.id === id ? { ...msg, content } : msg)
  })),
  deleteMessage: (id) => set((state) => ({
    messages: state.messages.filter(msg => msg.id !== id)
  })),
  clearMessages: () => set({ messages: [] }),
  
  provider: 'openrouter',
  setProvider: (provider) => set({ provider }),
  
  conversationId: null,
  setConversationId: (id) => set({ conversationId: id }),
}));

