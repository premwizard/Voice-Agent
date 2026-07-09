"use client";

import React, { useState } from 'react';
import { useLatencyStore } from '../stores/latencyStore';
import { useVoiceStore } from '../stores/voiceStore';
import { Activity, X, Terminal } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function LatencyDashboard() {
  const [isOpen, setIsOpen] = useState(false);
  const metrics = useLatencyStore();
  const provider = useVoiceStore((state) => state.provider);
  // Add model if available in store, currently hardcoded in backend, let's just say "google/gemini-2.5-flash"
  const model = "google/gemini-2.5-flash";

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 left-4 z-50 p-2 rounded-full glass border-white/10 text-muted-foreground hover:text-foreground transition-all shadow-lg hover:shadow-xl group"
        title="Developer Dashboard"
      >
        <Terminal size={18} className="group-hover:text-emerald-400 transition-colors" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            className="fixed bottom-16 left-4 z-50 w-80 glass-panel rounded-2xl border border-white/10 shadow-2xl overflow-hidden"
          >
            <div className="flex justify-between items-center p-3 border-b border-white/10 bg-black/20">
              <div className="flex items-center gap-2 text-sm font-semibold text-emerald-400">
                <Activity size={16} /> Latency Dashboard
              </div>
              <button onClick={() => setIsOpen(false)} className="text-muted-foreground hover:text-white transition-colors">
                <X size={16} />
              </button>
            </div>
            
            <div className="p-4 space-y-3 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Provider</span>
                <span className="text-white capitalize">{provider}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Model</span>
                <span className="text-white truncate max-w-[120px]">{model}</span>
              </div>
              <div className="h-px bg-white/10 my-2" />
              
              <MetricRow label="WebSocket Latency" value={metrics.websocketLatency} unit="ms" />
              <MetricRow label="Speech Recog Time" value={metrics.speechRecognitionTime} unit="s" />
              <MetricRow label="LLM First Token" value={metrics.llmFirstTokenTime} unit="s" />
              <MetricRow label="LLM Completion" value={metrics.llmCompletionTime} unit="s" />
              <MetricRow label="TTS Start Delay" value={metrics.ttsStartTime} unit="s" />
              <MetricRow label="Total Response" value={metrics.totalResponseTime} unit="s" />
              <MetricRow label="Round Trip Time" value={metrics.roundTripTime} unit="s" />
              
              <div className="h-px bg-white/10 my-2" />
              <div className="flex justify-between">
                <span className="text-muted-foreground">Conversations</span>
                <span className="text-white">{metrics.conversationCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Interruptions</span>
                <span className="text-white text-rose-400">{metrics.interruptionCount}</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function MetricRow({ label, value, unit }: { label: string, value: number | null, unit: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-white font-medium">
        {value !== null ? `${value.toFixed(unit === 'ms' ? 0 : 3)}${unit}` : '--'}
      </span>
    </div>
  );
}
