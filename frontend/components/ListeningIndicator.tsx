import React from 'react';
import { Mic, MicOff } from 'lucide-react';
import { useVoiceStore } from '../stores/voiceStore';

interface ListeningIndicatorProps {
  onToggle: () => void;
  volume?: number; // 0 to 100 roughly
}

export default function ListeningIndicator({ onToggle, volume = 0 }: ListeningIndicatorProps) {
  const store = useVoiceStore();
  
  // Calculate a scale based on volume if detecting speech
  const scale = store.isDetectingSpeech ? 1 + (Math.max(0, volume) / 100) * 0.3 : 1;

  return (
    <footer className="flex flex-col items-center justify-center pb-8 pt-4">
      <div className="relative">
        {store.isRecording && (
          <div 
            className="absolute -inset-4 bg-primary/20 rounded-full animate-pulse-ring pointer-events-none transition-transform duration-75"
            style={{ transform: `scale(${scale})` }}
          />
        )}
        
        {store.isDetectingSpeech && (
           <div 
           className="absolute -inset-2 bg-primary/40 rounded-full pointer-events-none transition-transform duration-75"
           style={{ transform: `scale(${scale})` }}
         />
        )}
        
        <button
          onClick={onToggle}
          className={`relative flex items-center justify-center w-20 h-20 rounded-full shadow-lg transition-all duration-300 hover:scale-105 active:scale-95 z-10 ${
            store.isRecording 
              ? store.isDetectingSpeech 
                ? 'bg-red-500 text-white' // Actively hearing speech
                : 'bg-destructive text-destructive-foreground' // Just recording but silent
              : 'bg-primary text-primary-foreground'
          }`}
        >
          {store.isRecording ? <MicOff size={32} /> : <Mic size={32} />}
        </button>
      </div>
      
      <div className="mt-6 text-center text-sm text-muted-foreground h-6">
        {store.isThinking ? (
          <div className="flex items-center justify-center gap-2">
            <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce [animation-delay:-0.3s]"></span>
            <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce [animation-delay:-0.15s]"></span>
            <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce"></span>
            <span className="ml-1">Thinking...</span>
          </div>
        ) : store.isRecording 
          ? store.isDetectingSpeech 
            ? 'Hearing you...' 
            : 'Listening...' 
          : store.isSpeaking 
            ? 'Speaking...' 
            : 'Tap to start conversation'}
      </div>
    </footer>
  );
}
