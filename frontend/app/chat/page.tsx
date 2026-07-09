"use client";

import React, { useEffect } from 'react';
import VoiceAgent from '@/components/VoiceAgent';
import ChatInterface from '@/components/ChatInterface';
import { useVoiceStore } from '@/stores/voiceStore';
import { wsService } from '@/services/websocket';
import { motion, AnimatePresence } from 'framer-motion';

export default function ChatPage() {
  const store = useVoiceStore();

  useEffect(() => {
    wsService.connect();
    return () => {
      wsService.disconnect();
    };
  }, []);

  return (
    <div className="w-full h-full max-w-6xl mx-auto flex flex-col lg:flex-row gap-6 relative">
      <AnimatePresence mode="wait">
        {store.activeMode === 'voice' ? (
          <motion.div 
            key="voice-mode"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="flex-1 w-full h-full flex flex-col"
          >
            <VoiceAgent />
          </motion.div>
        ) : (
          <motion.div 
            key="chat-mode"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex-1 w-full h-full flex flex-col"
          >
            <ChatInterface />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
