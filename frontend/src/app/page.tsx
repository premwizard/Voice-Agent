// ==============================================================================
// FILE: src/app/page.tsx
// WHAT THIS FILE IS: Next.js Real-Time Voice Agent & System Dashboard Entrypoint.
// WHY IT IS USED: Orchestrates StudioHeader, StudioNavigation, VoiceStudioView, 
//                 TelemetryWidget, ComputerControlPanel, and LandingPage components.
// ==============================================================================

"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { fetchServerHealth, HealthStatus } from "@/services/apiService";
import { commsManager, CommandResult } from "@/services/communicationManager";
import { useSpeech } from "@/hooks/useSpeech";
import { MessageItem } from "@/components/ConversationHistory";
import { TelemetryWidget } from "@/components/TelemetryWidget";
import { ComputerControlPanel } from "@/components/ComputerControlPanel";
import { LandingPage } from "@/components/LandingPage";
import { StudioHeader } from "@/components/StudioHeader";
import { StudioNavigation } from "@/components/StudioNavigation";
import { VoiceStudioView } from "@/components/VoiceStudioView";
import { ActiveTab } from "@/config/constants";

export default function HomeDashboard() {
  const [viewMode, setViewMode] = useState<"landing" | "studio">("landing");
  const [activeTab, setActiveTab] = useState<ActiveTab>("studio");
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [inputPrompt, setInputPrompt] = useState<string>("");
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [selectedModel, setSelectedModel] = useState<string>("meta-llama/llama-3.3-70b-instruct");

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
      <StudioHeader
        onReturnHome={() => setViewMode("landing")}
        lastLatency={lastLatency}
        isHandsFreeContinuous={isHandsFreeContinuous}
        onToggleHandsFree={() => {
          const nextState = !isHandsFreeContinuous;
          setIsHandsFreeContinuous(nextState);
          if (nextState && !isListening) startListening();
        }}
        isMuted={isMuted}
        onToggleMute={() => setIsMuted(!isMuted)}
        wsActive={wsActive}
      />

      {/* Navigation Tabs & Model Selector */}
      <StudioNavigation
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab)}
        selectedModel={selectedModel}
        onModelChange={(model) => setSelectedModel(model)}
      />

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
              className="w-full"
            >
              <VoiceStudioView
                isListening={isListening}
                isSpeaking={isSpeaking}
                isStreaming={isStreaming}
                voiceState={voiceState}
                audioLevel={audioLevel}
                speechStatus={speechStatus}
                isSupported={isSupported}
                messages={messages}
                currentStream={currentStream}
                inputPrompt={inputPrompt}
                setInputPrompt={setInputPrompt}
                onStartListening={startListening}
                onStopListening={stopListening}
                onResetTTSBuffer={resetTTSBuffer}
                onSubmitPrompt={handleSubmit}
                onSelectPrompt={handleSelectPrompt}
                onClearHistory={handleClearHistory}
                onReplayAudio={(text) => speakUtteranceChunk(text)}
              />
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
