import { create } from 'zustand';

interface LatencyMetrics {
  speechRecognitionTime: number | null;
  llmFirstTokenTime: number | null;
  llmCompletionTime: number | null;
  ttsStartTime: number | null;
  totalResponseTime: number | null;
  roundTripTime: number | null;
  websocketLatency: number | null;
  sessionDuration: number;
  conversationCount: number;
  interruptionCount: number;
}

interface LatencyState extends LatencyMetrics {
  updateMetrics: (metrics: Partial<LatencyMetrics>) => void;
  incrementConversations: () => void;
  incrementInterruptions: () => void;
}

export const useLatencyStore = create<LatencyState>((set) => ({
  speechRecognitionTime: null,
  llmFirstTokenTime: null,
  llmCompletionTime: null,
  ttsStartTime: null,
  totalResponseTime: null,
  roundTripTime: null,
  websocketLatency: null,
  sessionDuration: 0,
  conversationCount: 0,
  interruptionCount: 0,
  
  updateMetrics: (metrics) => set((state) => ({ ...state, ...metrics })),
  incrementConversations: () => set((state) => ({ conversationCount: state.conversationCount + 1 })),
  incrementInterruptions: () => set((state) => ({ interruptionCount: state.interruptionCount + 1 })),
}));
