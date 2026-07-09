import { create } from 'zustand';

export interface AgentStatus {
  agent_name: string;
  task_id: string;
  status: string; // 'pending', 'running', 'completed', 'failed', 'retrying'
  detail?: string;
  timestamp: number;
}

interface AgentStore {
  activeStatuses: AgentStatus[];
  showMonitor: boolean;
  
  addStatus: (status: Omit<AgentStatus, 'timestamp'>) => void;
  clearStatuses: () => void;
  toggleMonitor: () => void;
}

export const useAgentStore = create<AgentStore>((set) => ({
  activeStatuses: [],
  showMonitor: false, // Hidden by default, toggled in dev mode
  
  addStatus: (status) => set((state) => {
    // Keep last 50 statuses
    const newStatuses = [
      { ...status, timestamp: Date.now() },
      ...state.activeStatuses
    ].slice(0, 50);
    
    return { activeStatuses: newStatuses };
  }),
  
  clearStatuses: () => set({ activeStatuses: [] }),
  
  toggleMonitor: () => set((state) => ({ showMonitor: !state.showMonitor }))
}));
