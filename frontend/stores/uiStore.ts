import { create } from 'zustand';

interface UIState {
  isSettingsOpen: boolean;
  setSettingsOpen: (open: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  isSettingsOpen: false,
  setSettingsOpen: (open) => set({ isSettingsOpen: open }),
}));
