// ==============================================================================
// FILE: src/app/page.tsx
// WHAT THIS FILE IS: Next.js Real-Time Voice Agent Studio Interface.
// WHY IT IS USED: Combines REST health checks, WebSockets streaming, Speech-to-Text (STT), 
//                 real-time streaming Text-to-Speech (TTS), and Audio Visualizers into a full UI.
// ==============================================================================

"use client";

// Import useState, useEffect, useCallback hooks from React
import { useState, useEffect, useCallback } from "react";
// Import fetchServerHealth helper function and HealthStatus interface from apiService
import { fetchServerHealth, HealthStatus } from "@/services/apiService";
// Import custom useWebSocket hook for real-time WebSocket communication
import { useWebSocket } from "@/hooks/useWebSocket";
// Import custom useSpeech hook for STT and streaming TTS voice functionality
import { useSpeech } from "@/hooks/useSpeech";
// Import AudioVisualizer component for dynamic audio wave animations
import AudioVisualizer from "@/components/AudioVisualizer";

export default function Home() {
  // State storing backend REST health status
  const [health, setHealth] = useState<HealthStatus | null>(null);
  // State storing input text field prompt
  const [inputPrompt, setInputPrompt] = useState<string>("");

  // Destructure WebSocket hook states and actions
  const { isConnected, currentStream, isStreaming, sendMessage } = useWebSocket();

  // Callback to automatically send transcribed speech over WebSocket when user finishes speaking
  const handleSpeechEnd = useCallback((finalText: string) => {
    if (finalText) {
      sendMessage(finalText);
      setInputPrompt("");
    }
  }, [sendMessage]);

  // Destructure Speech STT & streaming TTS hook states and actions
  const { isListening, transcript, isSpeaking, isSupported, speechStatus, startListening, stopListening, processStreamingTTS, resetTTSBuffer, speakUtteranceChunk } = useSpeech(handleSpeechEnd);

  // Query REST health endpoint on initial mount
  useEffect(() => {
    fetchServerHealth()
      .then((data) => setHealth(data))
      .catch((err) => console.error("Health check failed:", err));
  }, []);

  // Update input text prompt automatically whenever speech recognition transcript updates live
  useEffect(() => {
    if (transcript) {
      setInputPrompt(transcript);
    }
  }, [transcript]);

  // Handle form submission to send text prompt over WebSocket to AI backend
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputPrompt.trim()) return;

    // Reset TTS buffer for new prompt turn
    resetTTSBuffer();
    // Send text prompt over active WebSocket connection
    sendMessage(inputPrompt);
    // Clear input field after sending
    setInputPrompt("");
  };

  // REAL-TIME AUDIO VOICE STREAMING: Process incoming AI stream tokens as they arrive over WebSocket
  useEffect(() => {
    if (currentStream) {
      processStreamingTTS(currentStream, !isStreaming);
    }
  }, [currentStream, isStreaming, processStreamingTTS]);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-between p-4 sm:p-8 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black">
      
      {/* Top Header Bar */}
      <header className="w-full max-w-4xl flex items-center justify-between py-4 px-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl shadow-lg">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-xl shadow-md shadow-indigo-500/20">
            🎙️
          </div>
          <div>
            <h1 className="text-lg font-extrabold tracking-tight bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">
              Voice Agent Studio
            </h1>
            <p className="text-xs text-slate-400">OpenRouter AI Real-Time Voice Streaming</p>
          </div>
        </div>

        {/* WebSocket Connection Badge */}
        <div className="flex items-center space-x-2 text-xs px-3 py-1.5 rounded-full bg-slate-950/80 border border-slate-800">
          <span className={`w-2.5 h-2.5 rounded-full ${isConnected ? "bg-emerald-400 animate-pulse shadow-sm shadow-emerald-400/50" : "bg-yellow-500 animate-pulse"}`}></span>
          <span className="text-slate-300 font-mono text-[11px]">
            {isConnected ? "WS ACTIVE" : "CONNECTING..."}
          </span>
        </div>
      </header>

      {/* Main Conversation Center Section */}
      <div className="w-full max-w-2xl my-auto space-y-6">
        
        {/* Status Indicator Pill */}
        <div className="flex justify-center">
          <div className={`px-5 py-2 rounded-full text-xs font-semibold tracking-wide flex items-center gap-2.5 border shadow-xl backdrop-blur-xl transition-all ${
            isListening
              ? "bg-rose-950/70 border-rose-800 text-rose-300 shadow-rose-950/50 animate-pulse"
              : isSpeaking
              ? "bg-purple-950/70 border-purple-800 text-purple-300 shadow-purple-950/50 animate-pulse"
              : isStreaming
              ? "bg-indigo-950/70 border-indigo-800 text-indigo-300 shadow-indigo-950/50 animate-pulse"
              : "bg-slate-900/80 border-slate-800 text-slate-300"
          }`}>
            <span className="text-base">
              {isListening ? "🎙️" : isSpeaking ? "🔊" : isStreaming ? "⚡" : "✨"}
            </span>
            <span>
              {isListening
                ? "Listening... Speak clearly into your mic!"
                : isSpeaking
                ? "🔊 AI is speaking to you in real-time..."
                : isStreaming
                ? "⚡ Streaming AI response..."
                : "Ready! Click Mic or type to chat"}
            </span>
          </div>
        </div>

        {/* Speech Recognition Live Status Diagnostic Card */}
        <div className="bg-slate-900/50 border border-slate-800/80 rounded-xl p-3 text-xs flex items-center justify-between backdrop-blur-md">
          <div className="flex items-center space-x-2.5 overflow-hidden">
            <span className={`w-2 h-2 rounded-full shrink-0 ${isListening ? "bg-rose-500 animate-ping" : "bg-slate-600"}`}></span>
            <span className="text-slate-400 font-medium shrink-0">Mic Status:</span>
            <span className={`font-mono truncate ${isListening ? "text-rose-400 font-semibold" : "text-slate-300"}`}>
              {speechStatus}
            </span>
          </div>
          {!isSupported && (
            <span className="text-amber-400 font-semibold text-[11px] shrink-0 ml-2">
              ⚠️ Use Chrome / Edge
            </span>
          )}
        </div>

        {/* Dynamic Glowing Audio Visualizer Component */}
        <div className="flex justify-center">
          <AudioVisualizer
            isActive={isListening || isSpeaking || isStreaming}
            mode={isListening ? "user" : "ai"}
          />
        </div>

        {/* AI Response Display Glassmorphic Card */}
        <div className="min-h-[180px] p-6 bg-slate-900/70 border border-slate-800/90 rounded-3xl shadow-2xl backdrop-blur-2xl flex flex-col justify-between transition-all">
          <div className="text-xs font-mono text-slate-500 mb-3 flex items-center justify-between border-b border-slate-800/60 pb-2">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
              REAL-TIME AI VOICE RESPONSE
            </span>
            {health && (
              <span className="px-2 py-0.5 rounded-md bg-purple-950/60 border border-purple-800/60 text-purple-300 text-[10px] font-semibold">
                {health.ai_provider.toUpperCase()}
              </span>
            )}
          </div>
          
          <div className="text-slate-100 text-lg leading-relaxed font-normal">
            {currentStream ? (
              <span className="animate-fadeIn">{currentStream}</span>
            ) : (
              <span className="text-slate-500 italic text-base">
                {isListening 
                  ? "Listening... Speak your prompt now."
                  : "Click the 🎙️ button to speak or type a prompt below..."}
              </span>
            )}
          </div>

          {/* Action buttons (Replay Voice) */}
          {currentStream && !isStreaming && (
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => speakUtteranceChunk(currentStream)}
                className="text-xs px-3.5 py-2 bg-slate-800/80 hover:bg-slate-700 text-slate-200 rounded-xl border border-slate-700 transition-all flex items-center gap-2 active:scale-95 shadow-md"
              >
                <span>🔊</span> Replay Voice
              </button>
            </div>
          )}
        </div>

        {/* Input & Microphone Control Bar */}
        <form onSubmit={handleSubmit} className="flex gap-3">
          {/* Microphone Toggle Button */}
          <button
            type="button"
            onClick={() => {
              resetTTSBuffer();
              isListening ? stopListening() : startListening();
            }}
            className={`p-4 rounded-2xl border transition-all duration-300 flex items-center justify-center active:scale-95 ${
              isListening
                ? "bg-rose-600 border-rose-500 text-white shadow-xl shadow-rose-600/40 ring-4 ring-rose-500/20 scale-105"
                : "bg-slate-900/90 hover:bg-slate-800 border-slate-800 text-slate-200 shadow-lg hover:border-slate-700"
            }`}
            title={isListening ? "Stop Microphone" : "Start Microphone"}
          >
            <span className="text-2xl">{isListening ? "⏹️" : "🎙️"}</span>
          </button>

          {/* Prompt Text Input Field */}
          <input
            type="text"
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            placeholder={isListening ? "Listening..." : "Type your prompt here or use mic..."}
            className="flex-1 px-5 py-4 bg-slate-900/90 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition shadow-inner"
          />

          {/* Send Button */}
          <button
            type="submit"
            disabled={!inputPrompt.trim()}
            className="px-7 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold rounded-2xl border border-indigo-500/50 transition-all shadow-xl shadow-indigo-600/30 active:scale-95 flex items-center gap-2"
          >
            <span>Send</span>
            <span>🚀</span>
          </button>
        </form>
      </div>

      {/* Footer Info */}
      <footer className="text-xs text-slate-600 font-mono py-2">
        Next.js 15 App Router • FastAPI WebSockets • OpenRouter LLM
      </footer>
    </main>
  );
}
