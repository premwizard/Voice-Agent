"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useVoiceStore } from '../stores/voiceStore';
import { useConversationStore } from '../stores/conversationStore';
import { wsService } from '../services/websocket';
import MarkdownMessage from './MarkdownMessage';
import { Send, Copy, RotateCcw, Trash2, Edit2, Check, MessageSquare, ThumbsUp, ThumbsDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import TextareaAutosize from 'react-textarea-autosize';
import { EmptyState } from './ui/EmptyState';
import { FileUploadZone } from './ui/FileUploadZone';
import { MediaGallery } from './MediaGallery';
import { VisionStatus } from './VisionStatus';
import { ImagePreview } from './ImagePreview';
import AgentMonitor from './agent/AgentMonitor';

export default function ChatInterface() {
  const store = useVoiceStore();
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  const [uploadedMedia, setUploadedMedia] = useState<any[]>([]);
  const [previewMediaId, setPreviewMediaId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [visionStatusMsg, setVisionStatusMsg] = useState<string>('');

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [store.messages, store.aiPartialTranscript]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if ((!input.trim() && uploadedMedia.length === 0) || store.status === 'thinking' || store.status === 'streaming_response') return;

    const currentInput = input.trim();
    store.addMessage({ role: 'user', content: currentInput || "(Sent media)" });
    store.setStatus('thinking');
    setVisionStatusMsg('');
    wsService.sendMessage('USER_FINAL', currentInput, { media_ids: uploadedMedia.map(m => m.id) });
    setInput('');
    setUploadedMedia([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
  };

  const handleRegenerate = () => {
    // Find last user message
    const lastUserMsg = [...store.messages].reverse().find(m => m.role === 'user');
    if (lastUserMsg) {
      store.setStatus('thinking');
      wsService.sendMessage('USER_FINAL', lastUserMsg.content);
    }
  };

  const startEdit = (id: string, content: string) => {
    setEditingId(id);
    setEditContent(content);
  };

  const saveEdit = (id: string) => {
    // Remove subsequent messages locally
    const messageIndex = store.messages.findIndex(m => m.id === id);
    if (messageIndex !== -1) {
      const messagesToDelete = store.messages.slice(messageIndex + 1);
      messagesToDelete.forEach(m => store.deleteMessage(m.id));
    }

    store.updateMessage(id, editContent);
    setEditingId(null);
    // Trigger a new response
    store.setStatus('thinking');
    wsService.sendMessage('USER_EDIT', editContent, { message_id: id });
  };

  const handleUpload = async (files: File[]) => {
    const activeId = useConversationStore.getState().activeConversationId;
    if (!activeId) return;

    setIsUploading(true);
    for (const file of files) {
      const formData = new FormData();
      formData.append("file", file);
      
      try {
        // Assume API runs on port 8000. In production this would use config
        const response = await fetch(`http://localhost:8000/api/conversations/${activeId}/upload`, {
          method: "POST",
          body: formData,
        });
        if (response.ok) {
          const data = await response.json();
          setUploadedMedia((prev) => [...prev, data]);
        }
      } catch (err) {
        console.error("Upload failed", err);
      }
    }
    setIsUploading(false);
  };

  // Listen for STATUS messages from WS
  useEffect(() => {
    const handleWsMessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'STATUS') {
          setVisionStatusMsg(data.content);
        } else if (data.type === 'AI_FINAL' || data.type === 'AI_STREAM') {
          setVisionStatusMsg('');
        }
      } catch (e) {}
    };
    
    // Check if websocket has addEventListener, otherwise we skip this part.
    // The wsService would ideally emit events we can hook into. 
    // Assuming wsService doesn't have a direct event emitter for STATUS, 
    // we would handle it in the store, but for now we'll rely on global store updates if available.
  }, []);

  return (
    <div className="flex flex-col h-full glass-panel rounded-3xl overflow-hidden shadow-2xl relative">
      <div className="flex justify-between items-center px-6 py-4 glass border-b border-white/5 z-10 shrink-0">
        <h2 className="font-bold text-lg tracking-tight">Text Mode</h2>
        <button 
          onClick={() => {
            const activeId = useConversationStore.getState().activeConversationId;
            if (activeId) {
              useConversationStore.getState().deleteConversation(activeId);
            }
            store.clearMessages();
            // Start a new session internally
            store.setAiPartialTranscript('');
            store.setConversationId(null);
            wsService.disconnect();
            useConversationStore.getState().setActiveConversationId(null);
            setTimeout(() => {
              wsService.connect(null);
            }, 100);
          }}
          className="text-muted-foreground hover:text-destructive transition-colors text-sm flex items-center gap-2 px-3 py-1.5 rounded-full hover:bg-destructive/10"
          title="Delete Conversation"
        >
          <Trash2 size={16} /> Delete
        </button>
      </div>

      <FileUploadZone onUpload={handleUpload}>
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar relative z-10 h-full">
          {store.messages.length === 0 && store.status !== 'thinking' && !store.aiPartialTranscript && (
          <EmptyState 
            title="Start a conversation"
            description="Ask me anything, or switch to Voice Mode to talk naturally with the AI."
          />
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
                <div className="absolute -bottom-10 left-0 opacity-0 group-hover:opacity-100 transition-all duration-300 flex gap-1 bg-surface/80 backdrop-blur-md rounded-xl p-1 border border-white/10 shadow-xl z-20">
                  <button onClick={() => handleCopy(msg.content)} className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-white/10 rounded-lg transition-colors" title="Copy">
                    <Copy size={14} />
                  </button>
                  <button onClick={handleRegenerate} className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-white/10 rounded-lg transition-colors" title="Regenerate">
                    <RotateCcw size={14} />
                  </button>
                  <div className="w-px h-4 bg-white/10 my-auto mx-1"></div>
                  <button onClick={() => {}} className="p-1.5 text-muted-foreground hover:text-emerald-400 hover:bg-emerald-400/10 rounded-lg transition-colors" title="Like">
                    <ThumbsUp size={14} />
                  </button>
                  <button onClick={() => {}} className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors" title="Dislike">
                    <ThumbsDown size={14} />
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
          {(store.aiPartialTranscript || store.status === 'thinking') && (
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
                  {store.status === 'thinking' && !store.aiPartialTranscript ? (
                    <div className="flex items-center gap-1.5 h-6">
                      <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                      <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                      <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></span>
                    </div>
                  ) : (
                    <div className="streaming-content">
                      <MarkdownMessage content={store.aiPartialTranscript + ' ▍'} />
                    </div>
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
      </FileUploadZone>

      <div className="p-4 sm:p-6 glass border-t border-white/5 z-10 shrink-0">
        <div className="w-full max-w-4xl mx-auto mb-2 flex flex-col justify-start">
           <VisionStatus status={visionStatusMsg} />
           <MediaGallery 
              items={uploadedMedia} 
              onRemove={(id) => setUploadedMedia(prev => prev.filter(m => m.id !== id))} 
              onPreview={setPreviewMediaId} 
           />
           {isUploading && <span className="text-sm text-muted-foreground ml-2 my-auto">Uploading...</span>}
        </div>
        <div className="flex flex-col relative max-w-4xl mx-auto">
          <form onSubmit={handleSubmit} className="flex gap-3 items-end bg-white/5 hover:bg-white/10 focus-within:bg-white/10 border border-white/10 rounded-2xl p-2 transition-all shadow-inner focus-within:border-indigo-500/50">
            <TextareaAutosize
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message here... (Shift+Enter for new line)"
              minRows={1}
              maxRows={6}
              className="flex-1 bg-transparent px-4 py-3 outline-none text-[15px] resize-none overflow-hidden custom-scrollbar leading-relaxed"
            />
            <button 
              type="submit"
              disabled={!input.trim() || store.status === 'thinking' || store.status === 'streaming_response'}
              className="bg-gradient-to-br from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 disabled:opacity-50 disabled:grayscale text-white w-12 h-12 rounded-xl flex items-center justify-center transition-all shadow-lg hover:shadow-indigo-500/25 shrink-0 mb-1 mr-1"
            >
              <Send size={18} className={input.trim() ? "translate-x-0.5 -translate-y-0.5" : ""} />
            </button>
          </form>
          <div className="flex justify-between items-center mt-2 px-2 text-xs text-muted-foreground opacity-60">
            <span>{input.length} characters</span>
            <span>AI can make mistakes. Verify important information.</span>
          </div>
        </div>
      </div>
      
      {previewMediaId && (
        <ImagePreview url="" onClose={() => setPreviewMediaId(null)} />
      )}
      <AgentMonitor />
    </div>
  );
}
