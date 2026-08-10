// ==============================================================================
// FILE: src/app/page.tsx
// WHAT THIS FILE IS: Next.js Real-Time Voice Agent & Phase 2 System Dashboard.
// WHY IT IS USED: Combines REST fast-path command execution (<50ms), SSE streaming,
//                 WebSocket event listeners, Speech-to-Text (STT) with barge-in interruption,
//                 streaming TTS, canvas visualizer, system telemetry, and controls.
// ==============================================================================

"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { fetchServerHealth, HealthStatus } from "@/services/apiService";
import { commsManager, CommandResult } from "@/services/communicationManager";
import { useSpeech } from "@/hooks/useSpeech";
import AudioVisualizer from "@/components/AudioVisualizer";
import CanvasAudioOrb from "@/components/CanvasAudioOrb";
import ConversationHistory, { MessageItem } from "@/components/ConversationHistory";
import QuickPrompts from "@/components/QuickPrompts";
import { TelemetryWidget } from "@/components/TelemetryWidget";
import { ComputerControlPanel } from "@/components/ComputerControlPanel";
import { LandingPage } from "@/components/LandingPage";

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
  Repeat,
  Zap,
  Bot,
  Home,
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
    prompt: "Your name is Phoenix. You are a real-time, highly intelligent AI personal assistant inspired by Jarvis with system control capabilities."
  },
  {
    id: "concise",
    name: "⚡ Quick & Crisp",
    prompt: "Your name is Phoenix, a rapid Jarvis-style voice assistant. Answer in 1-2 ultra-short sentences max."
  },
];

type ActiveTab = "studio" | "telemetry" | "control";

export default function HomeDashboard() {
  const [viewMode, setViewMode] = useState<"landing" | "studio">("landing");
  const [activeTab, setActiveTab] = useState<ActiveTab>("studio");
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [inputPrompt, setInputPrompt] = useState<string>("");
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [selectedModel, setSelectedModel] = useState<string>("meta-llama/llama-3.3-70b-instruct");
  const [selectedPersonality, setSelectedPersonality] = useState<string>("default");

  const [currentStream, setCurrentStream] = useState<string>("");
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [lastLatency, setLastLatency] = useState<number | null>(null);
  const [wsActive, setWsActive] = useState<boolean>(true);

  // Process User Request via Hybrid Communication Architecture (REST Fast Path or SSE Stream)
  const processUserPrompt = useCallback(
    async (userText: string, requestId?: string) => {
      if (!userText.trim()) return;

      const userMsg: MessageItem = {
        id: requestId || Date.now().toString(),
        role: "user",
        content: userText,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, userMsg]);
      setCurrentStream("");
      setIsStreaming(true);

      const startTime = performance.now();

      // 1. Try High-Speed REST Command Fast-Path Router (<50ms execution)
      const commandRes: CommandResult = await commsManager.executeCommand(userText, requestId);
      const elapsedMs = Math.round(performance.now() - startTime);

      if (commandRes.route === "FAST_PATH" && commandRes.executed) {
        const latencyMs = commandRes.latency_metrics?.total_latency_ms || elapsedMs;
        setLastLatency(latencyMs);
        const replyText = commandRes.message;

        setCurrentStream(replyText);
        setIsStreaming(false);

        const assistantMsg: MessageItem = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: replyText,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          executionTime: latencyMs,
          toolUsed: commandRes.action,
        };
        setMessages((prev) => [...prev, assistantMsg]);
        return;
      }

      // 2. Fall back to Server-Sent Events (SSE) streaming for AI Conversation
      let fullText = "";
      await commsManager.streamChatResponse(
        userText,
        messages.map((m) => ({ role: m.role, content: m.content })),
        selectedModel,
        false,
        (token) => {
          fullText += token;
          setCurrentStream((prev) => prev + token);
        },
        () => {
          const totalMs = Math.round(performance.now() - startTime);
          setLastLatency(totalMs);
          setIsStreaming(false);

          const assistantMsg: MessageItem = {
            id: (Date.now() + 1).toString(),
            role: "assistant",
            content: fullText,
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            executionTime: totalMs,
          };
          setMessages((prev) => [...prev, assistantMsg]);
        },
        (err) => {
          console.error("Streaming error:", err);
          setIsStreaming(false);
        }
      );
    },
    [messages, selectedModel]
  );

  const handleSpeechEnd = useCallback(
    (finalText: string, requestId: string) => {
      if (finalText) {
        processUserPrompt(finalText, requestId);
        setInputPrompt("");
      }
    },
    [processUserPrompt]
  );

  const {
    voiceState,
    isListening,
    transcript,
    isSpeaking,
    isSupported,
    speechStatus,
    audioLevel,
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

    const unsubscribe = commsManager.subscribeEvents(() => {
      setWsActive(commsManager.isWebSocketConnected());
    });

    return () => unsubscribe();
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
    }
  }, [currentStream, isStreaming, processStreamingTTS, isMuted]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputPrompt.trim()) return;

    const userText = inputPrompt.trim();
    resetTTSBuffer();
    processUserPrompt(userText);
    setInputPrompt("");
  };

  const handleSelectPrompt = (promptText: string) => {
    resetTTSBuffer();
    processUserPrompt(promptText);
    setInputPrompt("");
  };

  const handleClearHistory = () => {
    setMessages([]);
    resetTTSBuffer();
  };

  if (viewMode === "landing") {
    return <LandingPage onLaunchStudio={() => setViewMode("studio")} />;
  }

  return (
    <main className="min-h-screen bg-[#F9F8F6] text-[#2D2825] flex flex-col justify-between p-4 sm:p-6 md:p-8 relative overflow-hidden">
      {/* Dynamic Background Glow Orbs */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#C9B59C]/20 rounded-full blur-3xl pointer-events-none animate-pulse-glow" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-[#D9CFC7]/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 left-10 w-72 h-72 bg-[#EFE9E3]/40 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header Bar */}
      <motion.header
        initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-5xl mx-auto flex items-center justify-between py-3.5 px-6 rounded-2xl glass-panel border border-[#D9CFC7] shadow-xl z-10"
      >
        <div className="flex items-center space-x-3.5">
          <button
            onClick={() => setViewMode("landing")}
            className="w-10 h-10 rounded-xl bg-[#EFE9E3] hover:bg-[#F9F8F6] border border-[#D9CFC7] flex items-center justify-center text-[#2D2825] shadow-sm transition active:scale-95"
            title="Return to Landing Page"
          >
            <Home className="w-5 h-5 text-[#C9B59C]" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-extrabold tracking-tight text-[#2D2825]">
                Phoenix AI Voice Studio
              </h1>
              <span className="px-2 py-0.5 rounded-full bg-[#C9B59C]/20 border border-[#C9B59C]/40 text-[#4A3E35] text-[10px] font-bold tracking-wider uppercase">
                v2.5 Hybrid
              </span>
            </div>
            <p className="text-xs text-[#6C625A] hidden sm:block">
              Jarvis Workstation Agent • REST Fast Path + SSE Stream • Barge-in Voice
            </p>
          </div>
        </div>

        {/* Status Indicators & Settings Controls */}
        <div className="flex items-center space-x-2.5">
          {/* Latency Indicator */}
          {lastLatency !== null && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="px-2.5 py-1 rounded-xl bg-[#EFE9E3] border border-[#D9CFC7] text-[#4A3E35] text-[11px] font-mono flex items-center gap-1 shadow-sm font-bold"
            >
              <Zap className="w-3 h-3 text-[#C9B59C]" />
              <span>{lastLatency}ms</span>
            </motion.div>
          )}


          {/* Hands-Free Auto-Listen Toggle */}
          <button
            onClick={() => {
              const nextState = !isHandsFreeContinuous;
              setIsHandsFreeContinuous(nextState);
              if (nextState && !isListening) startListening();
            }}
            className={`px-3 py-1.5 rounded-xl border transition text-[11px] font-mono flex items-center gap-1.5 active:scale-95 ${
              isHandsFreeContinuous
                ? "bg-[#C9B59C]/30 border-[#C9B59C] text-[#2D2825] font-bold shadow-sm"
                : "bg-[#EFE9E3] border-[#D9CFC7] text-[#6C625A]"
            }`}
            title="Hands-Free Continuous Auto-Listen"
          >
            <Repeat className={`w-3.5 h-3.5 ${isHandsFreeContinuous ? "text-[#4A3E35] animate-spin" : "text-[#847970]"}`} />
            <span className="hidden sm:inline">{isHandsFreeContinuous ? "Auto-Listen ON" : "Manual Mic"}</span>
          </button>

          {/* Mute Audio Button */}
          <button
            onClick={() => setIsMuted(!isMuted)}
            className={`p-2 rounded-xl border transition-all text-xs flex items-center gap-1.5 active:scale-95 ${
              isMuted
                ? "bg-rose-100 border-rose-300 text-rose-800 font-bold"
                : "bg-[#EFE9E3] border-[#D9CFC7] text-[#2D2825] hover:bg-[#F9F8F6] font-semibold"
            }`}
            title={isMuted ? "Unmute Voice Output" : "Mute Voice Output"}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            <span className="hidden md:inline">{isMuted ? "Muted" : "Audio On"}</span>
          </button>

          {/* Hybrid Status Badge */}
          <div className="flex items-center space-x-2 text-xs px-3.5 py-1.5 rounded-xl bg-[#EFE9E3] border border-[#D9CFC7] shadow-sm">
            <Wifi className={`w-3.5 h-3.5 ${wsActive ? "text-emerald-700" : "text-amber-700"}`} />
            <span className="text-[#2D2825] font-mono text-[11px] font-bold hidden sm:inline">
              HYBRID ACTIVE
            </span>
          </div>
        </div>
      </motion.header>

      {/* Main Studio Navigation Tabs */}
      <div className="w-full max-w-5xl mx-auto flex items-center justify-between gap-2 border-b border-[#D9CFC7] mt-4 pb-2 z-10">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setActiveTab("studio")}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all relative ${
              activeTab === "studio"
                ? "bg-[#C9B59C] border border-[#b5a085] text-white shadow-md"
                : "bg-[#EFE9E3]/70 border border-[#D9CFC7] text-[#6C625A] hover:text-[#2D2825]"
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Voice Studio</span>
          </button>

          <button
            onClick={() => setActiveTab("telemetry")}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all relative ${
              activeTab === "telemetry"
                ? "bg-[#C9B59C] border border-[#b5a085] text-white shadow-md"
                : "bg-[#EFE9E3]/70 border border-[#D9CFC7] text-[#6C625A] hover:text-[#2D2825]"
            }`}
          >
            <Monitor className="w-4 h-4" />
            <span>System Telemetry</span>
          </button>

          <button
            onClick={() => setActiveTab("control")}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all relative ${
              activeTab === "control"
                ? "bg-[#C9B59C] border border-[#b5a085] text-white shadow-md"
                : "bg-[#EFE9E3]/70 border border-[#D9CFC7] text-[#6C625A] hover:text-[#2D2825]"
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>Computer Control</span>
          </button>
        </div>

        {/* Model Selector */}
        <div className="hidden md:flex items-center space-x-2 text-xs">
          <Bot className="w-3.5 h-3.5 text-[#4A3E35]" />
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="bg-[#EFE9E3] border border-[#D9CFC7] rounded-xl px-2.5 py-1 text-[#2D2825] focus:outline-none focus:border-[#C9B59C] font-mono text-[11px] font-semibold"
          >
            {AI_MODELS.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Content Area with Animated Tab Switching */}
      <div className="w-full max-w-5xl mx-auto my-auto py-4 z-10 flex-1 flex flex-col justify-center">
        <AnimatePresence mode="wait">
          {activeTab === "studio" && (
            <motion.div
              key="studio"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              className="w-full max-w-4xl mx-auto space-y-6"
            >
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
                      onClick={handleClearHistory}
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
                    <div className="absolute inset-0 rounded-2xl bg-rose-400/30 animate-ping pointer-events-none" />
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      resetTTSBuffer();
                      isListening ? stopListening() : startListening();
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
            </motion.div>
          )}

          {activeTab === "telemetry" && (
            <motion.div
              key="telemetry"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              className="w-full max-w-5xl mx-auto space-y-6"
            >
              <TelemetryWidget />
            </motion.div>
          )}

          {activeTab === "control" && (
            <motion.div
              key="control"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              className="w-full max-w-5xl mx-auto space-y-6"
            >
              <ComputerControlPanel />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <footer className="w-full max-w-5xl mx-auto text-center text-[11px] text-[#6C625A] font-mono py-2 z-10 font-medium">
        Next.js App Router • REST Fast Path + SSE Stream • Phoenix AI Voice Engine
      </footer>
    </main>
  );
}




