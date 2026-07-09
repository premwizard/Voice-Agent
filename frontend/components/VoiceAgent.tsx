"use client";

import React, { useEffect, useCallback } from 'react';
import { useVoiceStore } from '../stores/voiceStore';
import { wsService } from '../services/websocket';
import { Mic, Settings2, Wifi, WifiOff } from 'lucide-react';
import LiveTranscript from './LiveTranscript';
import ListeningIndicator from './ListeningIndicator';
import { useMicrophone } from '../hooks/useMicrophone';
import { useVAD } from '../hooks/useVAD';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { getAudioContext } from '../services/audioContext';

export default function VoiceAgent() {
  const isRecording = useVoiceStore((state) => state.isRecording);
  const isConnected = useVoiceStore((state) => state.isConnected);
  const setIsRecording = useVoiceStore((state) => state.setIsRecording);
  const setIsDetectingSpeech = useVoiceStore((state) => state.setIsDetectingSpeech);
  const addMessage = useVoiceStore((state) => state.addMessage);
  const setIsThinking = useVoiceStore((state) => state.setIsThinking);

  const { stream, startMicrophone, stopMicrophone } = useMicrophone();
  const { startRecognition, stopRecognition, flushTranscript } = useSpeechRecognition();

  const handleSpeechStart = useCallback(() => {
    setIsDetectingSpeech(true);
  }, [setIsDetectingSpeech]);

  const handleSpeechEnd = useCallback(() => {
    setIsDetectingSpeech(false);
    // When speech ends due to silence, flush the current transcript and send it!
    const finalSentence = flushTranscript();
    console.log("VoiceAgent: Speech ended, finalSentence:", finalSentence);
    if (finalSentence.trim()) {
      addMessage({ role: 'user', content: finalSentence.trim() });
      setIsThinking(true);
      console.log("VoiceAgent: Sending USER_FINAL to WS:", finalSentence.trim());
      wsService.sendMessage('USER_FINAL', finalSentence.trim());
    } else {
      console.log("VoiceAgent: No final sentence to send.");
    }
  }, [setIsDetectingSpeech, flushTranscript, addMessage, setIsThinking]);

  const { volume } = useVAD({
    stream,
    silenceDelay: 1500, // 1.5 seconds of silence = end of speech
    onSpeechStart: handleSpeechStart,
  });

  const userPartialTranscript = useVoiceStore((state) => state.userPartialTranscript);
  const speechTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (userPartialTranscript) {
      if (speechTimeoutRef.current) clearTimeout(speechTimeoutRef.current);
      speechTimeoutRef.current = setTimeout(() => {
        handleSpeechEnd();
      }, 1500); // 1.5 seconds of no new words = speech ended
    }
    return () => {
      if (speechTimeoutRef.current) clearTimeout(speechTimeoutRef.current);
    };
  }, [userPartialTranscript, handleSpeechEnd]);

  useEffect(() => {
    return () => {
      stopMicrophone();
      stopRecognition();
    };
  }, [stopMicrophone, stopRecognition]);

  // Sync isRecording with actual state
  useEffect(() => {
    if (isRecording) {
      startMicrophone().then(() => {
        startRecognition();
      });
    } else {
      stopMicrophone();
      stopRecognition();
      setIsDetectingSpeech(false);
    }
  }, [isRecording, startMicrophone, stopMicrophone, startRecognition, stopRecognition, setIsDetectingSpeech]);

  const toggleRecording = () => {
    if (!isRecording) {
      const ctx = getAudioContext();
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
    }
    setIsRecording(!isRecording);
  };

  return (
    <div className="flex flex-col h-full glass-panel rounded-3xl overflow-hidden relative">
      {/* Header */}
      <div className="flex justify-between items-center px-6 py-4 glass border-b border-white/5 shrink-0 z-10">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Mic size={20} className="text-white" />
          </div>
          <div>
            <h2 className="font-bold text-lg tracking-tight">Voice Assistant</h2>
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground mt-0.5">
              {isConnected ? (
                <><span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Connected to Gemini</>
              ) : (
                <><span className="w-2 h-2 rounded-full bg-destructive"></span> Disconnected</>
              )}
            </div>
          </div>
        </div>
        <button className="text-muted-foreground hover:text-foreground transition-colors p-2 hover:bg-white/5 rounded-xl">
          <Settings2 size={20} />
        </button>
      </div>

      <LiveTranscript />

      <div className="relative z-10 shrink-0">
        <ListeningIndicator onToggle={toggleRecording} volume={volume} />
      </div>
    </div>
  );
}
