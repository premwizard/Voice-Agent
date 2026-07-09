"use client";

import React from 'react';
import { Mic, MicOff } from 'lucide-react';
import { useVoiceStore } from '../stores/voiceStore';
import { motion, AnimatePresence } from 'framer-motion';

interface ListeningIndicatorProps {
  onToggle: () => void;
  volume?: number; 
}

const AudioWaveform = ({ isSpeaking, isDetectingSpeech, volume }: { isSpeaking: boolean, isDetectingSpeech: boolean, volume: number }) => {
  const bars = 5;
  const baseScale = isDetectingSpeech ? 1 + (Math.max(0, volume) / 100) : 1.2;
  return (
    <div className="flex items-center justify-center gap-1.5 h-12">
      {Array.from({ length: bars }).map((_, i) => (
        <motion.div
          key={i}
          className={`w-1.5 rounded-full ${isSpeaking ? 'bg-indigo-400' : 'bg-emerald-400'}`}
          animate={{
            height: isSpeaking 
              ? [12, Math.random() * 24 + 12, 12] 
              : isDetectingSpeech 
                ? 12 * baseScale * (Math.random() * 0.5 + 0.5) 
                : 4
          }}
          transition={{
            duration: isSpeaking ? 0.3 + (Math.random() * 0.2) : 0.1,
            repeat: isSpeaking ? Infinity : 0,
            ease: "easeInOut"
          }}
        />
      ))}
    </div>
  );
};

export default function ListeningIndicator({ onToggle, volume = 0 }: ListeningIndicatorProps) {
  const store = useVoiceStore();
  const status = store.status;
  const isThinking = status === 'thinking';
  const isSpeaking = status === 'speaking' || status === 'streaming_response';
  const isDetectingSpeech = status === 'speech_detected' || status === 'transcribing';

  const scale = isDetectingSpeech ? 1 + (Math.max(0, volume) / 100) * 0.5 : 1;

  let innerColor = 'bg-primary text-primary-foreground';
  let glowColor = 'rgba(255,255,255,0)';
  
  if (isSpeaking) {
    innerColor = 'bg-indigo-500 text-white';
    glowColor = 'rgba(99, 102, 241, 0.4)';
  } else if (isThinking) {
    innerColor = 'bg-purple-500 text-white';
    glowColor = 'rgba(168, 85, 247, 0.4)';
  } else if (isDetectingSpeech) {
    innerColor = 'bg-emerald-500 text-white';
    glowColor = 'rgba(16, 185, 129, 0.6)';
  } else if (store.isRecording) {
    innerColor = 'bg-rose-500 text-white';
    glowColor = 'rgba(244, 63, 94, 0.4)';
  }

  return (
    <footer className="flex flex-col items-center justify-center pb-8 pt-4 w-full">
      <div className="h-16 mb-4 flex items-center justify-center">
         <AnimatePresence mode="wait">
            {(isSpeaking || isDetectingSpeech) && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <AudioWaveform isSpeaking={isSpeaking} isDetectingSpeech={isDetectingSpeech} volume={volume} />
              </motion.div>
            )}
         </AnimatePresence>
      </div>

      <div className="relative flex items-center justify-center">
        <AnimatePresence>
          {(store.isRecording || isSpeaking || isThinking) && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ 
                opacity: 1, 
                scale: isThinking ? [1, 1.2, 1] : scale,
                rotate: isThinking ? [0, 180, 360] : 0 
              }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ 
                duration: isThinking ? 3 : 0.1, 
                repeat: isThinking ? Infinity : 0,
                ease: "linear"
              }}
              className="absolute w-32 h-32 rounded-full blur-2xl transition-colors duration-500"
              style={{ backgroundColor: glowColor }}
            />
          )}
        </AnimatePresence>
        
        {store.isRecording && !isDetectingSpeech && !isThinking && !isSpeaking && (
           <motion.div 
             animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0, 0.2] }}
             transition={{ duration: 2, repeat: Infinity }}
             className="absolute w-24 h-24 rounded-full border-2 border-rose-500"
           />
        )}
        
        <motion.button
          onClick={onToggle}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          animate={{ scale: isDetectingSpeech ? 1.05 : 1 }}
          className={`relative flex items-center justify-center w-20 h-20 rounded-full shadow-2xl z-10 transition-colors duration-300 ${innerColor}`}
        >
          {store.isRecording ? <MicOff size={28} /> : <Mic size={28} />}
        </motion.button>
      </div>
      
      <div className="mt-8 text-center text-sm font-medium tracking-wide text-muted-foreground h-6 uppercase">
        <AnimatePresence mode="wait">
          {isThinking ? (
            <motion.div key="thinking" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} className="flex items-center justify-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
              <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
              <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce"></span>
              <span className="ml-2 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-indigo-400">Processing...</span>
            </motion.div>
          ) : store.isRecording 
            ? isDetectingSpeech 
              ? <motion.span key="hearing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-emerald-400">Listening to you...</motion.span>
              : <motion.span key="listening" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-rose-400 animate-pulse">Waiting for speech...</motion.span>
            : isSpeaking 
              ? <motion.span key="speaking" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-indigo-400">Agent is speaking...</motion.span>
              : <motion.span key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>Tap microphone to start</motion.span>}
        </AnimatePresence>
      </div>
    </footer>
  );
}
