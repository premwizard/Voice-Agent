// ==============================================================================
// FILE: src/components/ConversationHistory.tsx
// WHAT THIS FILE IS: Interactive Chat Feed & Multi-turn Conversation History Timeline.
// WHY IT IS USED: Displays structured message history, role avatars, voice replay buttons, 
//                 copy buttons, and typing indicators with sleek glassmorphic design.
// ==============================================================================

"use client";

import { useState } from "react";
import { Bot, User, Volume2, Copy, Check, Sparkles } from "lucide-react";

export interface MessageItem {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

interface ConversationHistoryProps {
  messages: MessageItem[];
  currentStream?: string;
  isStreaming?: boolean;
  onReplay?: (text: string) => void;
}

export default function ConversationHistory({
  messages,
  currentStream,
  isStreaming,
  onReplay,
}: ConversationHistoryProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="w-full space-y-4 max-h-[380px] overflow-y-auto pr-1">
      {messages.length === 0 && (!isStreaming || !currentStream) && (
        <div className="glass-panel rounded-2xl p-8 text-center border border-slate-800/80">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto mb-3">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
          <h3 className="text-sm font-semibold text-slate-200 mb-1">
            Voice Agent Ready
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Click the microphone button or pick a prompt below to start talking with AI in real time.
          </p>
        </div>
      )}

      {/* Render Past Messages */}
      {messages.map((msg) => {
        const isUser = msg.role === "user";
        return (
          <div
            key={msg.id}
            className={`flex gap-3 transition-all ${
              isUser ? "justify-end" : "justify-start"
            }`}
          >
            {!isUser && (
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shrink-0 shadow-md shadow-indigo-500/20 mt-1">
                <Bot className="w-4 h-4" />
              </div>
            )}

            <div
              className={`max-w-[85%] rounded-2xl p-4 text-sm leading-relaxed transition-all shadow-lg ${
                isUser
                  ? "bg-gradient-to-r from-indigo-600/90 to-purple-600/90 text-white rounded-tr-xs border border-indigo-400/30"
                  : "glass-panel text-slate-100 rounded-tl-xs border border-slate-700/60"
              }`}
            >
              <div className="flex items-center justify-between gap-4 mb-1.5 opacity-80 text-[10px]">
                <span className="font-semibold tracking-wider uppercase">
                  {isUser ? "You" : "Voice AI"}
                </span>
                <span className="font-mono">{msg.timestamp}</span>
              </div>

              <p className="whitespace-pre-wrap">{msg.content}</p>

              {/* Message Actions */}
              <div className="mt-2 pt-2 border-t border-white/10 flex items-center justify-end gap-2 text-xs">
                <button
                  onClick={() => handleCopy(msg.id, msg.content)}
                  className="p-1 rounded hover:bg-white/10 text-slate-300 hover:text-white transition flex items-center gap-1 text-[11px]"
                  title="Copy text"
                >
                  {copiedId === msg.id ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span className="text-emerald-400">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy</span>
                    </>
                  )}
                </button>

                {!isUser && onReplay && (
                  <button
                    onClick={() => onReplay(msg.content)}
                    className="p-1 rounded hover:bg-white/10 text-indigo-300 hover:text-indigo-200 transition flex items-center gap-1 text-[11px]"
                    title="Replay Voice"
                  >
                    <Volume2 className="w-3 h-3" />
                    <span>Replay</span>
                  </button>
                )}
              </div>
            </div>

            {isUser && (
              <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 shrink-0 mt-1">
                <User className="w-4 h-4" />
              </div>
            )}
          </div>
        );
      })}

      {/* Real-time Streaming Message Card */}
      {isStreaming && currentStream && (
        <div className="flex gap-3 justify-start animate-fadeIn">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shrink-0 shadow-md shadow-indigo-500/20 mt-1">
            <Bot className="w-4 h-4 animate-spin-slow" />
          </div>
          <div className="max-w-[85%] glass-panel rounded-2xl rounded-tl-xs p-4 text-sm text-slate-100 border border-indigo-500/40 shadow-xl shadow-indigo-500/10">
            <div className="flex items-center justify-between gap-4 mb-1.5 text-[10px] text-indigo-300">
              <span className="font-semibold tracking-wider uppercase flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-ping"></span>
                Streaming AI Voice
              </span>
              <span className="font-mono">Live</span>
            </div>
            <p className="whitespace-pre-wrap">{currentStream}</p>
            {isStreaming && (
              <div className="flex items-center gap-1.5 mt-2 text-xs text-indigo-400">
                <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse"></span>
                <span className="text-[11px] font-mono italic">Generating speech...</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
