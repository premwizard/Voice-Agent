import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { useVoiceStore } from '../stores/voiceStore';

export default function LiveTranscript() {
  const store = useVoiceStore();

  return (
    <main className="flex-1 overflow-y-auto mb-8 space-y-6 px-2 custom-scrollbar">
      {store.messages.map((msg) => (
        <motion.div
          key={msg.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
        >
          <div className={`max-w-[80%] rounded-2xl px-6 py-4 ${
            msg.role === 'user' 
              ? 'bg-primary text-primary-foreground rounded-br-none' 
              : 'glass rounded-bl-none'
          }`}>
            <p className="leading-relaxed">{msg.content}</p>
          </div>
        </motion.div>
      ))}

      {/* Live User Transcript */}
      <AnimatePresence>
        {store.userPartialTranscript && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex justify-end"
          >
            <div className="max-w-[80%] rounded-2xl px-6 py-4 bg-primary/80 text-primary-foreground rounded-br-none italic">
              <p>{store.userPartialTranscript}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Live AI Transcript */}
      <AnimatePresence>
        {(store.aiPartialTranscript || store.isThinking) && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex justify-start"
          >
            <div className="max-w-[80%] rounded-2xl px-6 py-4 glass rounded-bl-none">
              {store.isThinking && !store.aiPartialTranscript ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 size={16} className="animate-spin" /> Thinking...
                </div>
              ) : (
                <p className="leading-relaxed">{store.aiPartialTranscript}</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
