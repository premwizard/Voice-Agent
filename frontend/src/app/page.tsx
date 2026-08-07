// ==============================================================================
// FILE: src/app/page.tsx
// WHAT THIS FILE IS: Next.js Real-Time Voice Agent & Phase 2 System Dashboard.
// WHY IT IS USED: Combines REST health checks, WebSockets streaming, Speech-to-Text (STT), 
//                 real-time streaming Text-to-Speech (TTS), Canvas Visualizer, 
//                 System Telemetry, and Computer Control into a full Studio interface.
// ==============================================================================

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { fetchServerHealth, HealthStatus } from "@/services/apiService";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useSpeech } from "@/hooks/useSpeech";
import AudioVisualizer from "@/components/AudioVisualizer";
import CanvasAudioOrb from "@/components/CanvasAudioOrb";
import ConversationHistory, { MessageItem } from "@/components/ConversationHistory";
import QuickPrompts from "@/components/QuickPrompts";
import { TelemetryWidget } from "@/components/TelemetryWidget";
import { ComputerControlPanel } from "@/components/ComputerControlPanel";

import {
  Mic,
  Square,
  Send,
  Radio,
  Wifi,
  Sparkles,
  Volume2,
  VolumeX,
  Cpu,
  Trash2,
  Activity,
  AlertCircle,
  Monitor,
  SlidersHorizontal,
  MessageSquare,
  Repeat
} from "lucide-react";

const AI_MODELS = [
  { id: "meta-llama/llama-3.3-70b-instruct", name: "Llama 3.3 70B" },
  { id: "deepseek/deepseek-chat", name: "DeepSeek V3" },
  { id: "anthropic/claude-3.5-haiku", name: "Claude 3.5 Haiku" },
  { id: "openai/gpt-4o-mini", name: "GPT-4o Mini" },
];

const PERSONALITIES = [
  { 
    id: "default", 
    name: "🎙️ Natural", 
    prompt: "Your name is Phoenix. You are a real-time, highly intelligent AI personal assistant inspired by Jarvis with system control capabilities. When the user addresses you by name ('Phoenix' or 'Hey Phoenix'), respond attentively and warmly as the assistant (e.g. 'Yes! I am here. How can I assist you?'). Do NOT answer about the city of Phoenix, Arizona unless specifically asked about Arizona or geography." 
  },
  { 
    id: "concise", 
    name: "⚡ Quick & Crisp", 
    prompt: "Your name is Phoenix, a rapid Jarvis-style voice assistant. Answer in 1-2 ultra-short sentences max. If called by name ('Phoenix'), acknowledge immediately and concisely." 
  },
  { 
    id: "developer", 
    name: "🧑‍💻 Tech Expert", 
    prompt: "Your name is Phoenix, an expert software engineer voice assistant with workstation tools. Provide precise, technical answers." 
  },
  { 
    id: "friendly", 
    name: "🎭 Warm Companion", 
    prompt: "Your name is Phoenix, a warm, friendly voice companion. Greet and respond cheerfully when addressed." 
  },
];

type ActiveTab = "studio" | "telemetry" | "control";

export default function Home() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("studio");
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [inputPrompt, setInputPrompt] = useState<string>("");
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [selectedModel, setSelectedModel] = useState<string>("meta-llama/llama-3.3-70b-instruct");
  const [selectedPersonality, setSelectedPersonality] = useState<string>("default");

  const { isConnected, currentStream, isStreaming, sendMessage } = useWebSocket();
  const prevStreamRef = useRef<string>("");
  const currentSysPrompt = PERSONALITIES.find((p) => p.id === selectedPersonality)?.prompt;

  const handleSpeechEnd = useCallback(
    (finalText: string) => {
      if (finalText) {
        const userMsg: MessageItem = {
          id: Date.now().toString(),
          role: "user",
          content: finalText,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };

        setMessages((prev) => {
          sendMessage(finalText, prev, { model: selectedModel, systemPrompt: currentSysPrompt });
          return [...prev, userMsg];
        });
        setInputPrompt("");
      }
    },
    [sendMessage, selectedModel, currentSysPrompt]
  );

  const {
    isListening,
    transcript,
    isSpeaking,
    isSupported,
    speechStatus,
    audioLevel,
    isWakeWordActive,
    setIsWakeWordActive,
    isHandsFreeContinuous,
    setIsHandsFreeContinuous,
    startListening,
    stopListening,
    processStreamingTTS,
    resetTTSBuffer,
    speakUtteranceChunk,
  } = useSpeech(handleSpeechEnd);

  useEffect(() => {
    fetchServerHealth()
      .then((data) => setHealth(data))
      .catch((err) => console.error("Health check failed:", err));
  }, []);

  useEffect(() => {
    if (transcript) {
      setInputPrompt(transcript);
    }
  }, [transcript]);

  useEffect(() => {
    if (currentStream) {
      if (!isMuted) {
        processStreamingTTS(currentStream, !isStreaming);
      }
      prevStreamRef.current = currentStream;
    }
  }, [currentStream, isStreaming, processStreamingTTS, isMuted]);

  useEffect(() => {
    if (!isStreaming && prevStreamRef.current) {
      const assistantMsg: MessageItem = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: prevStreamRef.current,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => {
        if (prev.length > 0 && prev[prev.length - 1].content === prevStreamRef.current) {
          return prev;
        }
        return [...prev, assistantMsg];
      });
      prevStreamRef.current = "";
    }
  }, [isStreaming]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputPrompt.trim()) return;

    const userText = inputPrompt.trim();

    const userMsg: MessageItem = {
      id: Date.now().toString(),
      role: "user",
      content: userText,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    sendMessage(userText, messages, { model: selectedModel, systemPrompt: currentSysPrompt });
    setMessages((prev) => [...prev, userMsg]);

    resetTTSBuffer();
    setInputPrompt("");
  };

  const handleSelectPrompt = (promptText: string) => {
    setInputPrompt(promptText);
    resetTTSBuffer();
    
    const userMsg: MessageItem = {
      id: Date.now().toString(),
      role: "user",
      content: promptText,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    sendMessage(promptText, messages, { model: selectedModel, systemPrompt: currentSysPrompt });
    setMessages((prev) => [...prev, userMsg]);
    setInputPrompt("");
  };

  const handleClearHistory = () => {
    setMessages([]);
    resetTTSBuffer();
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-4 sm:p-6 md:p-8 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-950/40 via-slate-950 to-black relative overflow-hidden">
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none animate-pulse-glow" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header Bar */}
      <header className="w-full max-w-5xl mx-auto flex items-center justify-between py-3.5 px-6 rounded-2xl glass-panel border border-slate-800/80 shadow-2xl z-10">
        <div className="flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25 animate-float">
            <Radio className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-extrabold tracking-tight bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">
                Phoenix AI Assistant
              </h1>
              <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-[10px] font-semibold tracking-wider">
                v2.5 JARVIS
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Jarvis Assistant • Hands-Free Continuous Voice • OpenRouter LLM
            </p>
          </div>
        </div>

        {/* Status Indicators & Settings Controls */}
        <div className="flex items-center space-x-2.5">
          {/* Hands-Free Continuous Auto-Listen Toggle */}
          <button
            onClick={() => {
              const nextState = !isHandsFreeContinuous;
              setIsHandsFreeContinuous(nextState);
              if (nextState && !isListening) startListening();
            }}
            className={`px-3 py-1.5 rounded-xl border transition text-[11px] font-mono flex items-center gap-1.5 ${
              isHandsFreeContinuous
                ? "bg-emerald-950/60 border-emerald-500/50 text-emerald-300 shadow-emerald-950/30"
                : "bg-slate-900 border-slate-800 text-slate-400"
            }`}
            title="Hands-Free Continuous Auto-Listen (Mic stays open automatically)"
          >
            <Repeat className={`w-3.5 h-3.5 ${isHandsFreeContinuous ? "text-emerald-400 animate-spin-slow" : "text-slate-500"}`} />
            <span className="hidden sm:inline">{isHandsFreeContinuous ? "Auto-Listen ON" : "Manual Mic"}</span>
          </button>

          {/* Wake Word Phoenix Toggle */}
          <button
            onClick={() => setIsWakeWordActive(!isWakeWordActive)}
            className={`px-3 py-1.5 rounded-xl border transition text-[11px] font-mono flex items-center gap-1.5 ${
              isWakeWordActive
                ? "bg-amber-950/60 border-amber-500/50 text-amber-300 shadow-amber-950/30"
                : "bg-slate-900 border-slate-800 text-slate-400"
            }`}
            title="Wake Word Listener ('Phoenix')"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">{isWakeWordActive ? "Wake: 'Phoenix'" : "Wake Off"}</span>
          </button>

          {/* Mute Audio Button */}
          <button
            onClick={() => setIsMuted(!isMuted)}
            className={`p-2 rounded-xl border transition-all text-xs flex items-center gap-1.5 ${
              isMuted
                ? "bg-rose-950/60 border-rose-800 text-rose-400"
                : "bg-slate-900/80 border-slate-800 text-slate-300 hover:text-white"
            }`}
            title={isMuted ? "Unmute Voice Output" : "Mute Voice Output"}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            <span className="hidden md:inline">{isMuted ? "Muted" : "Audio On"}</span>
          </button>

          {/* WebSocket Badge */}
          <div className="flex items-center space-x-2 text-xs px-3.5 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800">
            <Wifi className={`w-3.5 h-3.5 ${isConnected ? "text-emerald-400 animate-pulse" : "text-amber-400"}`} />
            <span className="text-slate-200 font-mono text-[11px] font-medium hidden sm:inline">
              {isConnected ? "WS ACTIVE" : "CONNECTING..."}
            </span>
          </div>
        </div>
      </header>

      {/* Main Studio Navigation Tabs */}
      <div className="w-full max-w-5xl mx-auto flex items-center justify-between gap-2 border-b border-slate-800/80 mt-4 pb-2 z-10">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setActiveTab("studio")}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all border ${
              activeTab === "studio"
                ? "bg-indigo-600/30 border-indigo-500/80 text-indigo-200 shadow-lg shadow-indigo-600/20"
                : "bg-slate-900/40 border-slate-800 text-slate-400 hover:text-slate-200"
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>🎙️ Voice Studio</span>
          </button>

          <button
            onClick={() => setActiveTab("telemetry")}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all border ${
              activeTab === "telemetry"
                ? "bg-cyan-600/30 border-cyan-500/80 text-cyan-200 shadow-lg shadow-cyan-600/20"
                : "bg-slate-900/40 border-slate-800 text-slate-400 hover:text-slate-200"
            }`}
          >
            <Monitor className="w-4 h-4" />
            <span>⚡ System Telemetry</span>
          </button>

          <button
            onClick={() => setActiveTab("control")}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all border ${
              activeTab === "control"
                ? "bg-purple-600/30 border-purple-500/80 text-purple-200 shadow-lg shadow-purple-600/20"
                : "bg-slate-900/40 border-slate-800 text-slate-400 hover:text-slate-200"
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>💻 Computer Control</span>
          </button>
        </div>

        {/* Model Selector */}
        <div className="hidden md:flex items-center space-x-2 text-xs">
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="bg-slate-900/90 border border-slate-800 rounded-xl px-2.5 py-1 text-indigo-200 focus:outline-none focus:border-indigo-500 font-mono text-[11px]"
          >
            {AI_MODELS.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="w-full max-w-5xl mx-auto my-auto py-4 z-10 flex-1 flex flex-col justify-center">
        {activeTab === "studio" && (
          <div className="w-full max-w-4xl mx-auto space-y-6">
            {/* Canvas Sound Orb */}
            <div className="flex flex-col items-center justify-center relative">
              <CanvasAudioOrb
                isActive={isListening || isSpeaking || isStreaming}
                mode={isListening ? "user" : isSpeaking || isStreaming ? "ai" : "idle"}
                size={160}
                audioLevel={audioLevel}
              />
              
              <div className="-mt-4 z-10">
                <div
                  className={`px-5 py-2 rounded-full text-xs font-semibold tracking-wide flex items-center gap-2 border shadow-2xl backdrop-blur-xl transition-all duration-300 ${
                    isListening
                      ? "bg-rose-950/80 border-rose-700/80 text-rose-300 shadow-rose-950/50 scale-105"
                      : isSpeaking
                      ? "bg-purple-950/80 border-purple-700/80 text-purple-300 shadow-purple-950/50 scale-105"
                      : isStreaming
                      ? "bg-indigo-950/80 border-indigo-700/80 text-indigo-300 shadow-indigo-950/50 scale-105"
                      : "bg-slate-900/90 border-slate-800 text-slate-300"
                  }`}
                >
                  <Activity className={`w-4 h-4 ${isListening || isSpeaking || isStreaming ? "animate-spin-slow" : ""}`} />
                  <span>
                    {isListening
                      ? "Listening... Speak now (Hands-free active)"
                      : isSpeaking
                      ? "🔊 Phoenix speaking..."
                      : isStreaming
                      ? "⚡ Processing response..."
                      : isHandsFreeContinuous
                      ? "Hands-free active • Say 'Phoenix' to talk"
                      : "Ready! Click Mic or type below"}
                  </span>
                </div>
              </div>
            </div>

            {/* Audio Equalizer */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-2 rounded-2xl glass-panel border border-slate-800/80">
              <div className="flex items-center space-x-2 text-xs">
                <span className={`w-2 h-2 rounded-full ${isListening ? "bg-rose-500 animate-ping" : "bg-slate-600"}`}></span>
                <span className="text-slate-400 font-medium">Mic Status:</span>
                <span className={`font-mono ${isListening ? "text-rose-400 font-semibold" : "text-slate-300"}`}>
                  {speechStatus}
                </span>
              </div>

              <AudioVisualizer
                isActive={isListening || isSpeaking || isStreaming}
                mode={isListening ? "user" : "ai"}
                audioLevel={audioLevel}
              />

              {!isSupported && (
                <div className="flex items-center gap-1 text-amber-400 text-xs font-semibold">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Use Chrome / Edge for STT</span>
                </div>
              )}
            </div>

            {/* Conversation History */}
            <div className="glass-panel rounded-3xl p-5 sm:p-6 border border-slate-800/80 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 text-xs">
                <div className="flex items-center gap-2 font-mono text-slate-400">
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                  <span className="font-semibold uppercase tracking-wider text-slate-300">
                    Conversation History
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 text-[10px]">
                    {messages.length} turns
                  </span>
                </div>

                {messages.length > 0 && (
                  <button
                    onClick={handleClearHistory}
                    className="text-slate-400 hover:text-rose-400 transition flex items-center gap-1 text-[11px]"
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
                onReplay={(text) => speakUtteranceChunk(text)}
              />
            </div>

            {/* Quick Prompts */}
            <QuickPrompts
              onSelectPrompt={handleSelectPrompt}
              disabled={isListening || isStreaming}
            />

            {/* Input Form */}
            <form onSubmit={handleSubmit} className="flex gap-3 pt-2">
              <div className="relative">
                {isListening && (
                  <div className="absolute inset-0 rounded-2xl bg-rose-500/30 animate-ping pointer-events-none" />
                )}
                <button
                  type="button"
                  onClick={() => {
                    resetTTSBuffer();
                    isListening ? stopListening() : startListening();
                  }}
                  className={`p-4 rounded-2xl border transition-all duration-300 flex items-center justify-center active:scale-95 shadow-xl ${
                    isListening
                      ? "bg-gradient-to-r from-rose-600 to-red-600 border-rose-400 text-white shadow-rose-600/40 ring-4 ring-rose-500/20 scale-105"
                      : "glass-panel hover:bg-slate-800 border-slate-800 text-slate-200 hover:border-indigo-500/40"
                  }`}
                  title={isListening ? "Stop Listening" : "Start Voice Input"}
                >
                  {isListening ? (
                    <Square className="w-6 h-6 fill-white" />
                  ) : (
                    <Mic className="w-6 h-6 text-indigo-400 hover:text-indigo-300" />
                  )}
                </button>
              </div>

              <input
                type="text"
                value={inputPrompt}
                onChange={(e) => setInputPrompt(e.target.value)}
                placeholder={isListening ? "Listening... Speak now!" : "Type prompt or say 'Phoenix'..."}
                className="flex-1 px-5 py-4 glass-panel border border-slate-800 rounded-2xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition shadow-inner text-sm"
              />

              <button
                type="submit"
                disabled={!inputPrompt.trim() || isStreaming}
                className="px-6 sm:px-7 py-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold rounded-2xl border border-indigo-400/30 transition-all shadow-xl shadow-indigo-600/30 active:scale-95 flex items-center gap-2 text-sm"
              >
                <span className="hidden sm:inline">Send</span>
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}

        {activeTab === "telemetry" && (
          <div className="w-full max-w-5xl mx-auto space-y-6">
            <TelemetryWidget />
          </div>
        )}

        {activeTab === "control" && (
          <div className="w-full max-w-5xl mx-auto space-y-6">
            <ComputerControlPanel />
          </div>
        )}
      </div>

      <footer className="w-full max-w-5xl mx-auto text-center text-[11px] text-slate-500 font-mono py-2 z-10">
        Next.js App Router • FastAPI WebSockets • Phoenix AI Jarvis Voice Engine
      </footer>
    </main>
  );
}
