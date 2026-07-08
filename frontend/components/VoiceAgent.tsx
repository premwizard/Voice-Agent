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
    onSpeechEnd: handleSpeechEnd
  });

  useEffect(() => {
    wsService.connect();
    return () => {
      wsService.disconnect();
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
    <div className="flex flex-col h-full bg-background rounded-2xl border border-white/10 overflow-hidden shadow-2xl relative">
      {/* Header */}
      {/* Header */}
      <div className="flex justify-between items-center px-6 py-4 glass border-b border-white/5 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
            <Mic size={16} className="text-primary-foreground" />
          </div>
          <div>
            <h2 className="font-semibold text-lg">Voice Agent</h2>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {isConnected ? (
                <><Wifi size={12} className="text-green-500" /> Connected</>
              ) : (
                <><WifiOff size={12} className="text-destructive" /> Disconnected</>
              )}
            </div>
          </div>
        </div>
        <button className="text-muted-foreground hover:text-primary transition-colors">
          <Settings2 size={18} />
        </button>
      </div>

      <LiveTranscript />

      <ListeningIndicator onToggle={toggleRecording} volume={volume} />
    </div>
  );
}
