// ==============================================================================
// FILE: src/hooks/useSpeech.ts
// WHAT THIS FILE IS: Auto-Sending Hands-Free Voice Speech Recognition & Synthesis Hook.
// WHY IT IS USED: Includes Speech Tail Normalization (fixing "50% age" -> "50%"),
//                 Barge-In Interruption (immediately stopping TTS when user speaks),
//                 Request Deduplication, and an explicit Assistant State Machine.
// ==============================================================================

"use client";

import { useState, useEffect, useRef, useCallback } from "react";

declare global {
  interface Window {
    SpeechRecognition?: any;
    webkitSpeechRecognition?: any;
  }
}

export type VoiceState = "IDLE" | "LISTENING" | "THINKING" | "EXECUTING" | "SPEAKING" | "INTERRUPTED" | "ERROR";

export function normalizeSpeechTranscript(raw: string): string {
  if (!raw) return "";
  let cleaned = raw.trim();
  // Fix Speech-To-Text tail noise artifacts
  cleaned = cleaned.replace(/%\s*age\b/gi, "%");
  cleaned = cleaned.replace(/percent\s*age\b/gi, "percent");
  cleaned = cleaned.replace(/volume\s*to\s*(\d+)\s*%?\s*age\b/gi, "volume to $1%");
  return cleaned;
}

export function useSpeech(onSpeechEnd?: (finalText: string, requestId: string) => void) {
  const [voiceState, setVoiceState] = useState<VoiceState>("IDLE");
  const [transcript, setTranscript] = useState<string>("");
  const [isSupported, setIsSupported] = useState<boolean>(true);
  const [speechStatus, setSpeechStatus] = useState<string>("Click microphone to speak");
  const [audioLevel, setAudioLevel] = useState<number>(0);
  
  const [isHandsFreeContinuous, setIsHandsFreeContinuous] = useState<boolean>(true);
  const [isWakeWordActive, setIsWakeWordActive] = useState<boolean>(true);

  const recognitionRef = useRef<any>(null);
  const transcriptRef = useRef<string>("");
  const onSpeechEndRef = useRef(onSpeechEnd);
  const spokenIndexRef = useRef<number>(0);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const restartTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  const isSpeakingRef = useRef<boolean>(false);
  const isHandsFreeRef = useRef<boolean>(true);
  const isSubmittingRef = useRef<boolean>(false);

  // Audio Analyser refs
  const audioCtxRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);

  const cleanupAudioAnalyser = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (audioCtxRef.current && audioCtxRef.current.state !== "closed") {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }
    setAudioLevel(0);
  }, []);

  // Sync refs
  useEffect(() => {
    transcriptRef.current = transcript;
  }, [transcript]);

  useEffect(() => {
    onSpeechEndRef.current = onSpeechEnd;
  }, [onSpeechEnd]);

  useEffect(() => {
    isHandsFreeRef.current = isHandsFreeContinuous;
  }, [isHandsFreeContinuous]);

  // Barge-in interruption handler
  const interruptTTS = useCallback(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    isSpeakingRef.current = false;
    spokenIndexRef.current = 0;
    setVoiceState("INTERRUPTED");
    setAudioLevel(0);
  }, []);

  // Submit final transcript once per speech turn with request_id deduplication
  const autoSubmitTranscript = useCallback(() => {
    const rawText = transcriptRef.current;
    const finalRecordedText = normalizeSpeechTranscript(rawText);
    
    if (finalRecordedText && onSpeechEndRef.current && !isSubmittingRef.current) {
      isSubmittingRef.current = true;
      const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
      console.log("Auto-submitting normalized spoken text:", finalRecordedText, "ReqID:", requestId);
      
      setVoiceState("THINKING");
      setSpeechStatus(`Sent: "${finalRecordedText}"`);
      onSpeechEndRef.current(finalRecordedText, requestId);
      
      setTranscript("");
      transcriptRef.current = "";
      
      setTimeout(() => {
        isSubmittingRef.current = false;
      }, 1000);
    }
  }, []);

  // Check browser support
  useEffect(() => {
    if (typeof window !== "undefined") {
      const hasSupport = !!(window.SpeechRecognition || window.webkitSpeechRecognition);
      setIsSupported(hasSupport);
      if (!hasSupport) {
        setSpeechStatus("Web Speech API not supported in this browser");
        setVoiceState("ERROR");
      }
    }
  }, []);

  // Stop microphone listening
  const stopListening = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    if (restartTimerRef.current) {
      clearTimeout(restartTimerRef.current);
      restartTimerRef.current = null;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (err) {
        console.warn("Failed to stop recognition:", err);
      }
    }
    cleanupAudioAnalyser();
    autoSubmitTranscript();
  }, [autoSubmitTranscript, cleanupAudioAnalyser]);

  // Start microphone listening
  const startListening = useCallback(() => {
    if (typeof window === "undefined") return;
    const SpeechRecognitionClass = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognitionClass) {
      setIsSupported(false);
      setSpeechStatus("Web Speech API not supported");
      setVoiceState("ERROR");
      return;
    }

    // BARGE-IN: If Phoenix is currently speaking, immediately interrupt TTS playback
    if (isSpeakingRef.current) {
      interruptTTS();
    }

    try {
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch (e) {}
      }

      isSubmittingRef.current = false;
      const recognition = new SpeechRecognitionClass();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onstart = () => {
        setVoiceState("LISTENING");
        setSpeechStatus("🎙️ Listening... Speak now!");

        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          navigator.mediaDevices.getUserMedia({ audio: true })
            .then((stream) => {
              mediaStreamRef.current = stream;
              const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
              if (!AudioCtx) return;
              const audioCtx = new AudioCtx();
              audioCtxRef.current = audioCtx;

              const analyser = audioCtx.createAnalyser();
              analyser.fftSize = 64;
              const source = audioCtx.createMediaStreamSource(stream);
              source.connect(analyser);

              const dataArray = new Uint8Array(analyser.frequencyBinCount);

              const sampleVolume = () => {
                analyser.getByteFrequencyData(dataArray);
                let sum = 0;
                for (let i = 0; i < dataArray.length; i++) {
                  sum += dataArray[i];
                }
                const avg = sum / dataArray.length;
                const normalized = Math.min(1, Math.max(0, avg / 100));
                setAudioLevel(normalized);

                // Barge-In Trigger: If audio volume > threshold while TTS is playing, interrupt
                if (normalized > 0.25 && isSpeakingRef.current) {
                  interruptTTS();
                }

                animFrameRef.current = requestAnimationFrame(sampleVolume);
              };
              sampleVolume();
            })
            .catch((err) => console.warn("Microphone sampling error:", err));
        }
      };

      recognition.onresult = (event: any) => {
        // If TTS is speaking, interrupt it instantly as soon as speech is detected
        if (isSpeakingRef.current) {
          interruptTTS();
        }

        let currentTranscript = "";
        for (let i = 0; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }

        const normalizedText = normalizeSpeechTranscript(currentTranscript);
        const lowerText = normalizedText.toLowerCase().trim();
        let cleanedPrompt = normalizedText;

        if (lowerText === "phoenix" || lowerText === "hey phoenix" || lowerText === "hi phoenix") {
          cleanedPrompt = "Hey Phoenix";
        } else if (lowerText.startsWith("phoenix") || lowerText.startsWith("hey phoenix") || lowerText.startsWith("hi phoenix")) {
          cleanedPrompt = normalizedText.replace(/^(hey\s+|hi\s+)?phoenix[,!]?\s*/i, "");
          if (!cleanedPrompt.trim()) cleanedPrompt = "Hey Phoenix";
        }

        setTranscript(cleanedPrompt);
        if (cleanedPrompt.trim()) {
          setVoiceState("LISTENING");
          setSpeechStatus(`Speaking: "${cleanedPrompt}"`);
        }

        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current);
        }

        // End-of-speech VAD silence buffer (900ms) for natural submission
        if (cleanedPrompt.trim()) {
          silenceTimerRef.current = setTimeout(() => {
            stopListening();
          }, 900);
        }
      };

      recognition.onend = () => {
        cleanupAudioAnalyser();
        autoSubmitTranscript();

        if (isHandsFreeRef.current && !isSpeakingRef.current) {
          if (restartTimerRef.current) clearTimeout(restartTimerRef.current);
          restartTimerRef.current = setTimeout(() => {
            startListening();
          }, 500);
        } else if (!isSpeakingRef.current) {
          setVoiceState("IDLE");
        }
      };

      recognition.onerror = (event: any) => {
        cleanupAudioAnalyser();
        if (event.error === "no-speech") {
          setSpeechStatus("Listening...");
          if (isHandsFreeRef.current && !isSpeakingRef.current) {
            if (restartTimerRef.current) clearTimeout(restartTimerRef.current);
            restartTimerRef.current = setTimeout(() => startListening(), 700);
          }
        } else {
          setSpeechStatus(`Speech error: ${event.error}`);
          setVoiceState("ERROR");
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      cleanupAudioAnalyser();
      setVoiceState("ERROR");
      setSpeechStatus("Failed to start speech recognition");
    }
  }, [autoSubmitTranscript, stopListening, cleanupAudioAnalyser, interruptTTS]);

  useEffect(() => {
    return () => {
      cleanupAudioAnalyser();
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      if (restartTimerRef.current) clearTimeout(restartTimerRef.current);
    };
  }, [cleanupAudioAnalyser]);

  // Speech synthesis utterance chunk player
  const speakUtteranceChunk = useCallback((text: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    if (!text.trim()) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.05;
    utterance.pitch = 1.0;

    utterance.onstart = () => {
      setVoiceState("SPEAKING");
      isSpeakingRef.current = true;
      setAudioLevel(0.6);
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch (e) {}
      }
    };

    utterance.onend = () => {
      if (!window.speechSynthesis.speaking) {
        setVoiceState("IDLE");
        isSpeakingRef.current = false;
        setAudioLevel(0);

        if (isHandsFreeRef.current) {
          setTimeout(() => {
            startListening();
          }, 350);
        }
      }
    };

    utterance.onerror = () => {
      setVoiceState("IDLE");
      isSpeakingRef.current = false;
      setAudioLevel(0);
      if (isHandsFreeRef.current) {
        setTimeout(() => startListening(), 350);
      }
    };

    window.speechSynthesis.speak(utterance);
  }, [startListening]);

  const processStreamingTTS = useCallback((fullStreamText: string, isStreamFinished: boolean) => {
    if (!fullStreamText) {
      spokenIndexRef.current = 0;
      return;
    }

    const unspokenText = fullStreamText.slice(spokenIndexRef.current);
    const sentenceEndRegex = /([^.!?\n]+[.!?\n]+)/g;
    let match;

    while ((match = sentenceEndRegex.exec(unspokenText)) !== null) {
      const sentenceChunk = match[1];
      if (sentenceChunk.trim()) {
        speakUtteranceChunk(sentenceChunk);
        spokenIndexRef.current += match.index + sentenceChunk.length;
      }
    }

    if (isStreamFinished) {
      const remainingFragment = fullStreamText.slice(spokenIndexRef.current).trim();
      if (remainingFragment) {
        speakUtteranceChunk(remainingFragment);
        spokenIndexRef.current = fullStreamText.length;
      }
    }
  }, [speakUtteranceChunk]);

  const resetTTSBuffer = useCallback(() => {
    interruptTTS();
    setVoiceState("IDLE");
  }, [interruptTTS]);

  return {
    voiceState,
    isListening: voiceState === "LISTENING",
    isSpeaking: voiceState === "SPEAKING",
    transcript,
    isSupported,
    speechStatus,
    audioLevel,
    isWakeWordActive,
    setIsWakeWordActive,
    isHandsFreeContinuous,
    setIsHandsFreeContinuous,
    startListening,
    stopListening,
    speakUtteranceChunk,
    processStreamingTTS,
    resetTTSBuffer,
    interruptTTS,
    setTranscript,
  };
}
