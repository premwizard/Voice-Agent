"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useVoiceStore } from '../stores/voiceStore';
import { wsService } from '../services/websocket';
import MarkdownMessage from './MarkdownMessage';
import { Send, Copy, RotateCcw, Trash2, Edit2, Check } from 'lucide-react';
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
    <div className="flex flex-col h-full bg-background rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
      <div className="flex justify-between items-center px-6 py-4 glass border-b border-white/5">
        <h2 className="font-semibold text-lg">Chat Mode</h2>
        <button 
          onClick={store.clearMessages}
          className="text-muted-foreground hover:text-destructive transition-colors text-sm flex items-center gap-2"
        >
          <Trash2 size={16} /> Clear
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
        {store.messages.map((msg) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div className="flex items-center gap-2 mb-1 text-xs text-muted-foreground px-1">
              <span>{msg.role === 'user' ? 'You' : 'AI'}</span>
            </div>
            
            <div className={`group relative max-w-[85%] rounded-2xl px-6 py-4 ${
              msg.role === 'user' 
                ? 'bg-primary text-primary-foreground rounded-br-none' 
                : 'glass rounded-bl-none'
            }`}>
              
              {editingId === msg.id ? (
                <div className="flex flex-col gap-2 w-full min-w-[250px]">
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="w-full bg-black/20 text-white rounded p-2 text-sm outline-none resize-y min-h-[60px]"
                    autoFocus
                  />
                  <div className="flex justify-end gap-2">
                    <button onClick={() => setEditingId(null)} className="text-xs opacity-70 hover:opacity-100">Cancel</button>
                    <button onClick={() => saveEdit(msg.id)} className="text-xs bg-primary/50 px-2 py-1 rounded hover:bg-primary">Save</button>
                  </div>
                </div>
              ) : (
                msg.role === 'assistant' ? (
                  <MarkdownMessage content={msg.content} />
                ) : (
                  <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                )
              )}

              {/* Action Buttons */}
              {msg.role === 'assistant' && !editingId && (
                <div className="absolute -bottom-6 left-0 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                  <button onClick={() => handleCopy(msg.content)} className="p-1 hover:text-primary rounded" title="Copy">
                    <Copy size={14} />
                  </button>
                  <button onClick={handleRegenerate} className="p-1 hover:text-primary rounded" title="Regenerate">
                    <RotateCcw size={14} />
                  </button>
                </div>
              )}
              {msg.role === 'user' && !editingId && (
                <div className="absolute -bottom-6 right-0 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                  <button onClick={() => startEdit(msg.id, msg.content)} className="p-1 hover:text-primary rounded" title="Edit">
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
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-start"
            >
              <div className="flex items-center gap-2 mb-1 text-xs text-muted-foreground px-1">
                <span>AI</span>
              </div>
              <div className="max-w-[85%] rounded-2xl px-6 py-4 glass rounded-bl-none">
                {store.isThinking && !store.aiPartialTranscript ? (
                  <div className="flex items-center gap-1 h-6">
                    <span className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                    <span className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                    <span className="w-2 h-2 bg-primary rounded-full animate-bounce"></span>
                  </div>
                ) : (
                  <MarkdownMessage content={store.aiPartialTranscript} />
                )}
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
              className="flex justify-center w-full my-4"
            >
              <div className="bg-destructive/10 border border-destructive/30 text-destructive px-4 py-3 rounded-lg text-sm flex items-center gap-3 w-full max-w-md justify-between">
                <span>{store.systemNotification}</span>
                <button 
                  onClick={() => store.setSystemNotification(null)}
                  className="hover:bg-destructive/20 p-1 rounded-full transition-colors"
                  title="Dismiss"
                >
                  ✕
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 glass border-t border-white/5">
        <form onSubmit={handleSubmit} className="flex gap-2 relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 bg-white/5 border border-white/10 rounded-full px-6 py-3 outline-none focus:border-primary/50 transition-colors"
          />
          <button 
            type="submit"
            disabled={!input.trim() || store.isThinking}
            className="bg-primary hover:bg-primary/90 disabled:opacity-50 text-primary-foreground w-12 h-12 rounded-full flex items-center justify-center transition-colors shrink-0"
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}
