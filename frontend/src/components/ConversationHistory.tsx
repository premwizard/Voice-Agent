// ==============================================================================
// FILE: src/components/ConversationHistory.tsx
// WHAT THIS FILE IS: Interactive Chat Feed & Multi-turn Conversation History Timeline.
// WHY IT IS USED: Displays structured message history, role avatars, voice replay buttons, 
//                 copy buttons, and typing indicators with sleek glassmorphic design.
// ==============================================================================

"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, User, Volume2, Copy, Check, Sparkles, Cpu } from "lucide-react";

export interface MessageItem {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  executionTime?: number;
  toolUsed?: string;
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
    <div className="w-full space-y-4 max-h-[400px] overflow-y-auto pr-1">
      <AnimatePresence mode="popLayout">
        {messages.length === 0 && (!isStreaming || !currentStream) && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="glass-panel rounded-2xl p-8 text-center border border-[#D9CFC7]"
          >
            <div className="w-12 h-12 rounded-2xl bg-[#C9B59C]/20 border border-[#C9B59C]/40 text-[#4A3E35] flex items-center justify-center mx-auto mb-3 glow-gold">
              <Sparkles className="w-6 h-6 animate-pulse text-[#C9B59C]" />
            </div>
            <h3 className="text-base font-bold text-[#2D2825] mb-1 tracking-tight">
              Phoenix AI Core Ready
            </h3>
            <p className="text-xs text-[#6C625A] max-w-sm mx-auto leading-relaxed font-medium">
              Say &quot;Phoenix&quot; or press the microphone to interact via natural voice or text commands.
            </p>
          </motion.div>
        )}

        {/* Render Past Messages */}
        {messages.map((msg, index) => {
          const isUser = msg.role === "user";
          return (
            <motion.div
              key={msg.id || index}
              initial={{ opacity: 0, y: 15, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className={`flex gap-3 ${
                isUser ? "justify-end" : "justify-start"
              }`}
            >
              {!isUser && (
                <div className="w-8 h-8 rounded-xl bg-[#C9B59C] flex items-center justify-center text-white shrink-0 shadow-md mt-1 border border-[#b5a085]">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-[85%] rounded-2xl p-4 text-sm leading-relaxed transition-all shadow-md ${
                  isUser
                    ? "bg-gradient-to-r from-[#C9B59C] to-[#b5a085] text-white rounded-tr-xs border border-[#b5a085] glow-gold"
                    : "glass-panel text-[#2D2825] rounded-tl-xs border border-[#D9CFC7]"
                }`}
              >
                <div className="flex items-center justify-between gap-4 mb-2 text-[10px] opacity-85 border-b border-[#D9CFC7]/60 pb-1.5 font-medium">
                  <span className="font-bold tracking-wider uppercase flex items-center gap-1.5">
                    {isUser ? (
                      "You"
                    ) : (
                      <>
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                        Phoenix Assistant
                      </>
                    )}
                  </span>
                  <div className="flex items-center gap-2 font-mono text-[10px]">
                    {msg.executionTime && (
                      <span className="px-1.5 py-0.5 rounded bg-[#C9B59C]/20 text-[#4A3E35] border border-[#C9B59C]/30 flex items-center gap-1 font-bold">
                        <Cpu className="w-2.5 h-2.5" />
                        {msg.executionTime}ms
                      </span>
                    )}
                    <span className="text-[#6C625A]">{msg.timestamp}</span>
                  </div>
                </div>

                <p className="whitespace-pre-wrap font-medium">{msg.content}</p>

                {/* Message Actions */}
                <div className="mt-2 pt-2 border-t border-[#D9CFC7]/60 flex items-center justify-between text-xs">
                  <div className="text-[10px] font-mono text-[#6C625A]">
                    {msg.toolUsed && (
                      <span className="bg-[#EFE9E3] border border-[#D9CFC7] px-2 py-0.5 rounded-md font-bold text-[#4A3E35]">
                        🛠️ Tool: {msg.toolUsed}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleCopy(msg.id, msg.content)}
                      className="p-1 px-2 rounded-lg bg-[#EFE9E3]/80 hover:bg-[#F9F8F6] text-[#6C625A] hover:text-[#2D2825] transition flex items-center gap-1 text-[11px] border border-[#D9CFC7]"
                      title="Copy text"
                    >
                      {copiedId === msg.id ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-700" />
                          <span className="text-emerald-700 font-bold">Copied</span>
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
                        className="p-1 px-2 rounded-lg bg-[#C9B59C]/20 hover:bg-[#C9B59C]/30 text-[#4A3E35] hover:text-[#2D2825] transition flex items-center gap-1 text-[11px] border border-[#C9B59C]/40 font-semibold"
                        title="Replay Voice"
                      >
                        <Volume2 className="w-3 h-3" />
                        <span>Replay</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {isUser && (
                <div className="w-8 h-8 rounded-xl bg-[#EFE9E3] border border-[#D9CFC7] flex items-center justify-center text-[#4A3E35] shrink-0 mt-1 shadow-sm">
                  <User className="w-4 h-4" />
                </div>
              )}
            </motion.div>
          );
        })}

        {/* Real-time Streaming Message Card */}
        {isStreaming && currentStream && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex gap-3 justify-start"
          >
            <div className="w-8 h-8 rounded-xl bg-[#C9B59C] flex items-center justify-center text-white shrink-0 shadow-md mt-1 border border-[#b5a085]">
              <Bot className="w-4 h-4 animate-spin" />
            </div>
            <div className="max-w-[85%] glass-panel rounded-2xl rounded-tl-xs p-4 text-sm text-[#2D2825] border border-[#C9B59C] shadow-lg">
              <div className="flex items-center justify-between gap-4 mb-2 text-[10px] text-[#4A3E35] border-b border-[#D9CFC7] pb-1.5 font-bold">
                <span className="font-bold tracking-wider uppercase flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#C9B59C] animate-ping"></span>
                  Phoenix Live Stream
                </span>
                <span className="font-mono text-[#847970]">Streaming...</span>
              </div>
              <p className="whitespace-pre-wrap font-medium">{currentStream}</p>
              <div className="flex items-center gap-2 mt-2 pt-2 border-t border-[#D9CFC7] text-xs text-[#6C625A]">
                <span className="w-2 h-2 rounded-full bg-[#C9B59C] animate-pulse"></span>
                <span className="text-[11px] font-mono italic font-semibold">Streaming speech synthesis...</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}


