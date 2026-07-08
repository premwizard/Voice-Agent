"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useVoiceStore } from '../stores/voiceStore';
import { wsService } from '../services/websocket';
import MarkdownMessage from './MarkdownMessage';
import { Send, Copy, RotateCcw, Trash2, Edit2, Check, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ChatInterface() {
  const store = useVoiceStore();
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [store.messages, store.aiPartialTranscript]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    store.addMessage({ role: 'user', content: input.trim() });
    store.setIsThinking(true);
    wsService.sendMessage('USER_FINAL', input.trim());
    setInput('');
  };

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
  };

  const handleRegenerate = () => {
    // Find last user message
    const lastUserMsg = [...store.messages].reverse().find(m => m.role === 'user');
    if (lastUserMsg) {
      store.setIsThinking(true);
      wsService.sendMessage('USER_FINAL', lastUserMsg.content);
    }
  };

  const startEdit = (id: string, content: string) => {
    setEditingId(id);
    setEditContent(content);
  };

  const saveEdit = (id: string) => {
    store.updateMessage(id, editContent);
    setEditingId(null);
    // Optionally trigger a new response here if it's the last message
    // store.setIsThinking(true);
    // wsService.sendMessage('USER_FINAL', editContent);
  };

  return (
    <div className="flex flex-col h-full glass-panel rounded-3xl overflow-hidden shadow-2xl relative">
      <div className="flex justify-between items-center px-6 py-4 glass border-b border-white/5 z-10 shrink-0">
        <h2 className="font-bold text-lg tracking-tight">Text Mode</h2>
        <button 
          onClick={store.clearMessages}
          className="text-muted-foreground hover:text-destructive transition-colors text-sm flex items-center gap-2 px-3 py-1.5 rounded-full hover:bg-destructive/10"
        >
          <Trash2 size={16} /> Clear
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar relative z-10">
        {store.messages.length === 0 && !store.isThinking && !store.aiPartialTranscript && (
          <div className="h-full flex flex-col items-center justify-center text-center opacity-50">
            <MessageSquare size={48} className="mb-4" />
            <h3 className="text-xl font-medium mb-2">Start a conversation</h3>
            <p className="text-sm max-w-sm">Ask me anything or switch to Voice Mode to talk naturally.</p>
          </div>
        )}

        {store.messages.map((msg) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div className={`group relative max-w-[85%] rounded-3xl px-6 py-4 shadow-sm ${
              msg.role === 'user' 
                ? 'bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-tr-sm shadow-indigo-500/20' 
                : 'glass rounded-tl-sm'
            }`}>
              
              {editingId === msg.id ? (
                <div className="flex flex-col gap-3 w-full min-w-[250px] md:min-w-[400px]">
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="w-full bg-black/20 text-white rounded-xl p-3 text-sm outline-none resize-none min-h-[80px] focus:ring-2 focus:ring-white/30"
                    autoFocus
                  />
                  <div className="flex justify-end gap-2">
                    <button onClick={() => setEditingId(null)} className="text-xs opacity-70 hover:opacity-100 font-medium px-3 py-1.5 rounded-lg hover:bg-white/10 transition-colors">Cancel</button>
                    <button onClick={() => saveEdit(msg.id)} className="text-xs bg-white text-indigo-900 font-semibold px-4 py-1.5 rounded-lg hover:bg-white/90 transition-colors shadow-lg">Save</button>
                  </div>
                </div>
              ) : (
                msg.role === 'assistant' ? (
                  <MarkdownMessage content={msg.content} />
                ) : (
                  <p className="leading-relaxed whitespace-pre-wrap text-[15px]">{msg.content}</p>
                )
              )}

              {/* Action Buttons */}
              {msg.role === 'assistant' && !editingId && (
                <div className="absolute -bottom-10 left-0 opacity-0 group-hover:opacity-100 transition-all duration-300 flex gap-1 bg-surface/80 backdrop-blur-md rounded-xl p-1 border border-white/10 shadow-xl">
                  <button onClick={() => handleCopy(msg.content)} className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-white/10 rounded-lg transition-colors" title="Copy">
                    <Copy size={14} />
                  </button>
                  <button onClick={handleRegenerate} className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-white/10 rounded-lg transition-colors" title="Regenerate">
                    <RotateCcw size={14} />
                  </button>
                </div>
              )}
              {msg.role === 'user' && !editingId && (
                <div className="absolute -bottom-10 right-0 opacity-0 group-hover:opacity-100 transition-all duration-300 flex gap-1 bg-surface/80 backdrop-blur-md rounded-xl p-1 border border-white/10 shadow-xl">
                  <button onClick={() => startEdit(msg.id, msg.content)} className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-white/10 rounded-lg transition-colors" title="Edit">
                    <Edit2 size={14} />
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        ))}

        <AnimatePresence>
          {(store.aiPartialTranscript || store.isThinking) && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex flex-col items-start"
            >
              <div className="max-w-[85%] rounded-3xl px-6 py-4 glass rounded-tl-sm relative overflow-hidden">
                {/* Subtle streaming glow */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-indigo-500/5 to-transparent animate-shimmer" />
                
                <div className="relative z-10">
                  {store.isThinking && !store.aiPartialTranscript ? (
                    <div className="flex items-center gap-1.5 h-6">
                      <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                      <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                      <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></span>
                    </div>
                  ) : (
                    <MarkdownMessage content={store.aiPartialTranscript} />
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {store.systemNotification && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex justify-center w-full my-6"
            >
              <div className="bg-destructive/10 backdrop-blur-md border border-destructive/30 text-destructive px-5 py-3.5 rounded-2xl text-sm flex items-center gap-3 w-full max-w-md shadow-lg justify-between">
                <span className="font-medium">{store.systemNotification}</span>
                <button 
                  onClick={() => store.setSystemNotification(null)}
                  className="hover:bg-destructive/20 p-1.5 rounded-full transition-colors shrink-0"
                  title="Dismiss"
                >
                  ✕
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div ref={messagesEndRef} className="h-4" />
      </div>

      <div className="p-4 sm:p-6 glass border-t border-white/5 z-10 shrink-0">
        <form onSubmit={handleSubmit} className="flex gap-3 relative max-w-4xl mx-auto">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message here..."
            className="flex-1 bg-white/5 hover:bg-white/10 focus:bg-white/10 border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-indigo-500/50 transition-all shadow-inner text-[15px]"
          />
          <button 
            type="submit"
            disabled={!input.trim() || store.isThinking}
            className="bg-gradient-to-br from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 disabled:opacity-50 disabled:grayscale text-white w-14 h-14 rounded-2xl flex items-center justify-center transition-all shadow-lg hover:shadow-indigo-500/25 shrink-0"
          >
            <Send size={20} />
          </button>
        </form>
        <div className="text-center mt-3 text-xs text-muted-foreground opacity-60">
          AI can make mistakes. Verify important information.
        </div>
      </div>
    </div>
  );
}
