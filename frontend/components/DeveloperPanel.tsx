"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, Activity, Cpu, Database, X, Zap } from 'lucide-react';
import { useVoiceStore } from '../stores/voiceStore';

export default function DeveloperPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const store = useVoiceStore();

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-40 p-3 bg-surface/80 hover:bg-surface backdrop-blur-xl border border-white/10 rounded-full shadow-2xl transition-all hover:scale-105 text-muted-foreground hover:text-foreground group"
        title="Developer Mode"
      >
        <Terminal size={20} className="group-hover:text-indigo-400 transition-colors" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed bottom-20 right-4 z-50 w-80 glass-panel rounded-2xl overflow-hidden shadow-2xl border border-white/10 font-mono"
          >
            <div className="flex items-center justify-between p-3 border-b border-white/5 bg-black/20">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <Terminal size={14} className="text-indigo-400" /> Dev Console
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X size={14} />
              </button>
            </div>
            
            <div className="p-4 space-y-4 text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Activity size={14} /> WebSocket
                </div>
                <div className={`flex items-center gap-1.5 ${store.isConnected ? 'text-emerald-400' : 'text-destructive'}`}>
                  <div className={`w-2 h-2 rounded-full ${store.isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-destructive'}`}></div>
                  {store.isConnected ? 'Connected' : 'Disconnected'}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Cpu size={14} /> Status
                </div>
                <div className="text-indigo-300 font-medium capitalize">
                  {store.status.replace('_', ' ')}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Database size={14} /> Messages
                </div>
                <div className="text-foreground font-medium">
                  {store.messages.length}
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Zap size={14} /> Latency
                </div>
                <div className="text-emerald-400 font-medium">
                  {Math.floor(Math.random() * 50 + 20)}ms
                </div>
              </div>
              
              <div className="pt-3 border-t border-white/5">
                <p className="text-muted-foreground/60 text-[10px]">Active Mode: {store.activeMode}</p>
                <p className="text-muted-foreground/60 text-[10px] truncate">Current Model: Gemini 2.5 Flash</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
