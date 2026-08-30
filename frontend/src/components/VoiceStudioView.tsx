// ==============================================================================
// FILE: src/components/VoiceStudioView.tsx
// WHAT THIS FILE IS: Voice Studio Interactive View Component.
// WHY IT IS USED: Renders Canvas 3D Orb, state status indicator, audio equalizer,
//                 conversation timeline, quick prompts, mic input, and send form.
// ==============================================================================

"use client";

import { Activity, AlertCircle, Mic, Send, Sparkles, Square, Trash2 } from "lucide-react";
import AudioVisualizer from "@/components/AudioVisualizer";
import CanvasAudioOrb from "@/components/CanvasAudioOrb";
import ConversationHistory, { MessageItem } from "@/components/ConversationHistory";
import QuickPrompts from "@/components/QuickPrompts";

interface VoiceStudioViewProps {
  isListening: boolean;
  isSpeaking: boolean;
  isStreaming: boolean;
  voiceState: string;
  audioLevel: number;
  speechStatus: string;
  isSupported: boolean;
  messages: MessageItem[];
  currentStream: string;
  inputPrompt: string;
  setInputPrompt: (val: string) => void;
  onStartListening: () => void;
  onStopListening: () => void;
  onResetTTSBuffer: () => void;
  onSubmitPrompt: (e: React.FormEvent) => void;
  onSelectPrompt: (promptText: string) => void;
  onClearHistory: () => void;
  onReplayAudio: (text: string) => void;
}

export function VoiceStudioView({
  isListening,
  isSpeaking,
  isStreaming,
  voiceState,
  audioLevel,
  speechStatus,
  isSupported,
  messages,
  currentStream,
  inputPrompt,
  setInputPrompt,
  onStartListening,
  onStopListening,
  onResetTTSBuffer,
  onSubmitPrompt,
  onSelectPrompt,
  onClearHistory,
  onReplayAudio,
}: VoiceStudioViewProps) {
  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Canvas Sound Orb Visualizer */}
      <div className="flex flex-col items-center justify-center relative">
        <CanvasAudioOrb
          isActive={isListening || isSpeaking || isStreaming}
          mode={isListening ? "user" : isSpeaking || isStreaming ? "ai" : "idle"}
          size={160}
          audioLevel={audioLevel}
        />
        
        <div className="-mt-4 z-10">
          <div
            className={`px-5 py-2 rounded-full text-xs font-bold tracking-wide flex items-center gap-2 border shadow-lg backdrop-blur-xl transition-all duration-300 ${
              voiceState === "LISTENING"
                ? "bg-rose-100 border-rose-300 text-rose-900 scale-105"
                : voiceState === "SPEAKING"
                ? "bg-[#EFE9E3] border-[#C9B59C] text-[#2D2825] scale-105"
                : voiceState === "INTERRUPTED"
                ? "bg-amber-100 border-amber-300 text-amber-900 scale-105"
                : isStreaming
                ? "bg-[#EFE9E3] border-[#C9B59C] text-[#2D2825] scale-105"
                : "bg-[#EFE9E3]/90 border-[#D9CFC7] text-[#2D2825]"
            }`}
          >
            <Activity className={`w-4 h-4 ${isListening || isSpeaking || isStreaming ? "animate-spin" : ""}`} />
            <span>
              {voiceState === "LISTENING"
                ? "Listening... (Barge-in active)"
                : voiceState === "SPEAKING"
                ? "🔊 Phoenix speaking... (Speak to interrupt)"
                : voiceState === "INTERRUPTED"
                ? "⚡ Interrupted! Listening to new command..."
                : isStreaming
                ? "⚡ Processing response..."
                : "Ready! Click Mic or type below"}
            </span>
          </div>
        </div>
      </div>

      {/* Audio Equalizer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-2 rounded-2xl glass-panel border border-[#D9CFC7]">
        <div className="flex items-center space-x-2 text-xs">
          <span className={`w-2 h-2 rounded-full ${isListening ? "bg-rose-500 animate-ping" : "bg-[#847970]"}`}></span>
          <span className="text-[#6C625A] font-medium">Mic Status:</span>
          <span className={`font-mono ${isListening ? "text-rose-700 font-bold" : "text-[#2D2825] font-semibold"}`}>
            {speechStatus}
          </span>
        </div>

        <AudioVisualizer
          isActive={isListening || isSpeaking || isStreaming}
          mode={isListening ? "user" : "ai"}
          audioLevel={audioLevel}
        />

        {!isSupported && (
          <div className="flex items-center gap-1 text-amber-700 text-xs font-semibold">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Use Chrome / Edge for STT</span>
          </div>
        )}
      </div>

      {/* Conversation History */}
      <div className="glass-panel rounded-3xl p-5 sm:p-6 border border-[#D9CFC7] shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-[#D9CFC7] pb-3 text-xs">
          <div className="flex items-center gap-2 font-mono text-[#6C625A]">
            <Sparkles className="w-4 h-4 text-[#C9B59C]" />
            <span className="font-bold uppercase tracking-wider text-[#2D2825]">
              Conversation Timeline
            </span>
            <span className="px-2 py-0.5 rounded-full bg-[#EFE9E3] text-[#2D2825] text-[10px] font-bold border border-[#D9CFC7]">
              {messages.length} turns
            </span>
          </div>

          {messages.length > 0 && (
            <button
              onClick={onClearHistory}
              className="text-[#6C625A] hover:text-rose-700 transition flex items-center gap-1 text-[11px] font-semibold"
              title="Clear conversation log"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear History</span>
            </button>
          )}
        </div>

        <ConversationHistory
          messages={messages}
          currentStream={currentStream}
          isStreaming={isStreaming}
          onReplay={onReplayAudio}
        />
      </div>

      {/* Quick Prompts */}
      <QuickPrompts
        onSelectPrompt={onSelectPrompt}
        disabled={isListening || isStreaming}
      />

      {/* Input Form */}
      <form onSubmit={onSubmitPrompt} className="flex gap-3 pt-2">
        <div className="relative">
          {isListening && (
            <div className="absolute inset-0 rounded-2xl bg-rose-400/30 animate-ping pointer-events-none" />
          )}
          <button
            type="button"
            onClick={() => {
              onResetTTSBuffer();
              isListening ? onStopListening() : onStartListening();
            }}
            className={`p-4 rounded-2xl border transition-all duration-300 flex items-center justify-center active:scale-95 shadow-lg ${
              isListening
                ? "bg-rose-600 border-rose-500 text-white shadow-rose-600/30 scale-105"
                : "glass-panel hover:bg-[#EFE9E3] border-[#D9CFC7] text-[#2D2825]"
            }`}
            title={isListening ? "Stop Listening" : "Start Voice Input"}
          >
            {isListening ? (
              <Square className="w-6 h-6 fill-white" />
            ) : (
              <Mic className="w-6 h-6 text-[#4A3E35]" />
            )}
          </button>
        </div>

        <input
          type="text"
          value={inputPrompt}
          onChange={(e) => setInputPrompt(e.target.value)}
          placeholder={isListening ? "Listening... Speak now!" : "Type prompt or say 'Phoenix'..."}
          className="flex-1 px-5 py-4 glass-panel border border-[#D9CFC7] rounded-2xl text-[#2D2825] placeholder-[#847970] focus:outline-none focus:border-[#C9B59C] focus:ring-2 focus:ring-[#C9B59C]/30 transition shadow-inner text-sm font-medium"
        />

        <button
          type="submit"
          disabled={!inputPrompt.trim() || isStreaming}
          className="px-6 sm:px-7 py-4 bg-[#C9B59C] hover:bg-[#b5a085] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-2xl border border-[#b5a085] transition-all shadow-md active:scale-95 flex items-center gap-2 text-sm"
        >
          <span className="hidden sm:inline">Send</span>
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
