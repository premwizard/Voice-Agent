import { useState, useEffect, useCallback, useRef } from 'react';
import { useVoiceStore } from '../stores/voiceStore';

export function useSpeechRecognition() {
  const [error, setError] = useState<string | null>(null);
  
  const recognitionRef = useRef<any>(null);
  const isStartedRef = useRef(false);
  
  // We keep track of the final text independently of what the API says to prevent flickering
  const finalTranscriptRef = useRef('');
  const interimTranscriptRef = useRef('');

  const initRecognition = useCallback(() => {
    if (typeof window === 'undefined') return false;
    
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError('Speech Recognition API not supported in this browser.');
      return false;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        console.log("useSpeechRecognition: Recognition started successfully");
        isStartedRef.current = true;
        setError(null);
      };

      recognition.onresult = (event: any) => {
        let currentInterim = '';
        let currentFinal = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            currentFinal += event.results[i][0].transcript;
          } else {
            currentInterim += event.results[i][0].transcript;
          }
        }

        if (currentFinal) {
          finalTranscriptRef.current += ' ' + currentFinal.trim();
          interimTranscriptRef.current = '';
        } else {
          interimTranscriptRef.current = currentInterim;
        }

        const newPartial = (finalTranscriptRef.current + ' ' + interimTranscriptRef.current).trim();
        console.log("useSpeechRecognition: Partial transcript updated:", newPartial);
        useVoiceStore.getState().setUserPartialTranscript(newPartial);
      };

      recognition.onerror = (event: any) => {
        console.warn('useSpeechRecognition: Error event received:', event.error);
        if (event.error === 'no-speech' || event.error === 'aborted' || event.error === 'network') {
          return;
        }
        console.error('Speech recognition error:', event.error);
        setError(event.error);
      };

      recognition.onend = () => {
        console.log("useSpeechRecognition: Recognition ended");
        isStartedRef.current = false;
        // If we are still supposed to be recording, restart
        if (useVoiceStore.getState().isRecording) {
          console.log("useSpeechRecognition: Restarting recognition because isRecording is true");
          try {
            recognition.start();
          } catch (e) {
            console.error('Failed to restart recognition:', e);
          }
        }
      };

      recognitionRef.current = recognition;
      return true;
    } catch (e: any) {
      setError(e.message || 'Failed to initialize speech recognition');
      return false;
    }
  }, []);

  const startRecognition = useCallback(() => {
    if (!recognitionRef.current) {
      if (!initRecognition()) return;
    }
    
    // Clear transcripts on fresh start
    finalTranscriptRef.current = '';
    interimTranscriptRef.current = '';
    useVoiceStore.getState().setUserPartialTranscript('');
    
    try {
      if (!isStartedRef.current) {
        isStartedRef.current = true; // Set immediately to prevent race conditions
        recognitionRef.current.start();
      }
    } catch (e) {
      isStartedRef.current = false;
      console.warn('Recognition start error:', e);
    }
  }, [initRecognition]);

  const stopRecognition = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        console.warn('Recognition stop error:', e);
      }
    }
    isStartedRef.current = false;
  }, []);

  const flushTranscript = useCallback((): string => {
    const fullText = (finalTranscriptRef.current + ' ' + interimTranscriptRef.current).trim();
    finalTranscriptRef.current = '';
    interimTranscriptRef.current = '';
    useVoiceStore.getState().setUserPartialTranscript('');
    return fullText;
  }, []);

  return {
    startRecognition,
    stopRecognition,
    flushTranscript,
    error
  };
}
