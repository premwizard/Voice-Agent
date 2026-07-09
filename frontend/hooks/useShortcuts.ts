"use client";

import { useEffect } from 'react';
import { useVoiceStore } from '../stores/voiceStore';
import { useUIStore } from '../stores/uiStore';
import { useRouter } from 'next/navigation';

export function useShortcuts() {
  const voiceStore = useVoiceStore();
  const setSettingsOpen = useUIStore(state => state.setSettingsOpen);
  const router = useRouter();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + N: New Conversation
      if (e.key === 'n' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        voiceStore.clearMessages();
        voiceStore.setAiPartialTranscript('');
        router.push('/chat');
      }

      // Esc: Stop speaking / close settings
      if (e.key === 'Escape') {
        if (useUIStore.getState().isSettingsOpen) {
          setSettingsOpen(false);
          return;
        }
        if (voiceStore.status === 'speaking' || voiceStore.status === 'streaming_response') {
          // Send interrupt signal (if backend supported it)
          voiceStore.setStatus('idle');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [voiceStore, setSettingsOpen, router]);
}
