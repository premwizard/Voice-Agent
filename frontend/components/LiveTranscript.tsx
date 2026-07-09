import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { useVoiceStore } from '../stores/voiceStore';

export default function LiveTranscript() {
  const store = useVoiceStore();

  return (
    <main className="flex-1 overflow-y-auto mb-8 space-y-6 px-6 pt-6 custom-scrollbar relative z-10">
      {store.messages.length === 0 && !store.userPartialTranscript && !store.aiPartialTranscript && store.status !== 'thinking' && (
        <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
          <p className="text-sm">Start speaking to see the transcript...</p>
        </div>
      )}

      {store.messages.map((msg) => (
        <motion.div
          key={msg.id}
          initial={{ opacity: 0, y: 10, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
        >
          <div className={`max-w-[85%] rounded-3xl px-6 py-4 shadow-sm ${
            msg.role === 'user' 
              ? 'bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-br-sm shadow-indigo-500/20' 
              : 'glass rounded-bl-sm'
          }`}>
            <p className="leading-relaxed text-[15px]">{msg.content}</p>
          </div>
        </motion.div>
      ))}

      {/* Live User Transcript */}
      <AnimatePresence>
        {store.userPartialTranscript && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex justify-end"
          >
            <div className="max-w-[85%] rounded-3xl px-6 py-4 bg-gradient-to-br from-indigo-500/80 to-purple-500/80 text-white rounded-br-sm italic backdrop-blur-md shadow-indigo-500/20 shadow-lg">
              <p className="text-[15px]">{store.userPartialTranscript}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Live AI Transcript */}
      <AnimatePresence>
        {(store.aiPartialTranscript || store.status === 'thinking') && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex justify-start"
          >
            <div className="max-w-[85%] rounded-3xl px-6 py-4 glass rounded-bl-sm relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-indigo-500/5 to-transparent animate-shimmer" />
              
              <div className="relative z-10">
                {store.status === 'thinking' && !store.aiPartialTranscript ? (
                  <div className="flex items-center gap-1.5 h-6">
                    <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                    <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                    <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></span>
                  </div>
                ) : (
                  <p className="leading-relaxed text-[15px]">{store.aiPartialTranscript}</p>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* System Notification */}
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
    </main>
  );
}
