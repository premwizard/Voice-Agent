// ==============================================================================
// FILE: src/hooks/useSpeech.ts
// WHAT THIS FILE IS: Auto-Sending Hands-Free Voice Speech Recognition & Synthesis Hook.
// WHY IT IS USED: Automatically detects silence (pause in speech) and immediately 
//                 transmits recorded voice text over WebSockets without clicking "Send",
//                 and automatically restarts mic listening when AI finishes speaking.
// ==============================================================================

"use client";

import { useState, useEffect, useRef, useCallback } from "react";

declare global {
  interface Window {
    SpeechRecognition?: any;
    webkitSpeechRecognition?: any;
  }
}

export function useSpeech(onSpeechEnd?: (finalText: string) => void) {
  const [isListening, setIsListening] = useState<boolean>(false);
  const [transcript, setTranscript] = useState<string>("");
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [isSupported, setIsSupported] = useState<boolean>(true);
  const [speechStatus, setSpeechStatus] = useState<string>("Click microphone to speak");
  const [audioLevel, setAudioLevel] = useState<number>(0);
  
  // Hands-free continuous auto-listen mode (Default: TRUE)
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

  // Audio Context & Analyser refs for volume sampling
  const audioCtxRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Cleanup audio analyzer resources
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
    isSpeakingRef.current = isSpeaking;
  }, [isSpeaking]);

  useEffect(() => {
    isHandsFreeRef.current = isHandsFreeContinuous;
  }, [isHandsFreeContinuous]);

  // Submit final transcript automatically
  const autoSubmitTranscript = useCallback(() => {
    const finalRecordedText = transcriptRef.current.trim();
    if (finalRecordedText && onSpeechEndRef.current) {
      console.log("Auto-submitting spoken text:", finalRecordedText);
      setSpeechStatus(`Sent: "${finalRecordedText}"`);
      onSpeechEndRef.current(finalRecordedText);
      setTranscript("");
      transcriptRef.current = "";
    }
  }, []);

  // Check browser support on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const hasSupport = !!(window.SpeechRecognition || window.webkitSpeechRecognition);
      setIsSupported(hasSupport);
      if (!hasSupport) {
        setSpeechStatus("Web Speech API not supported in this browser (Use Chrome or Edge)");
      }
    }
  }, []);

  // Function to stop microphone listening
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
    setIsListening(false);
    autoSubmitTranscript();
  }, [autoSubmitTranscript, cleanupAudioAnalyser]);

  // Function to start microphone listening
  const startListening = useCallback(() => {
    if (typeof window === "undefined") return;
    const SpeechRecognitionClass = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognitionClass) {
      setIsSupported(false);
      setSpeechStatus("Web Speech API not supported");
      return;
    }

    // Do not start mic if AI is currently speaking out loud
    if (isSpeakingRef.current) {
      console.log("AI is currently speaking, delaying mic start...");
      return;
    }

    try {
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch (e) {}
      }

      const recognition = new SpeechRecognitionClass();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onstart = () => {
        setIsListening(true);
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
                animFrameRef.current = requestAnimationFrame(sampleVolume);
              };
              sampleVolume();
            })
            .catch((err) => console.warn("Microphone sampling error:", err));
        }
      };

      recognition.onresult = (event: any) => {
        let currentTranscript = "";
        for (let i = 0; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }

        const lowerText = currentTranscript.toLowerCase().trim();
        let cleanedPrompt = currentTranscript;

        // Wake word handling ("Phoenix" or "Hey Phoenix")
        if (lowerText === "phoenix" || lowerText === "hey phoenix" || lowerText === "hi phoenix") {
          // Single name call -> Keep full prompt as "Hey Phoenix" so AI responds to its name!
          cleanedPrompt = "Hey Phoenix";
        } else if (lowerText.startsWith("phoenix") || lowerText.startsWith("hey phoenix") || lowerText.startsWith("hi phoenix")) {
          // Command prefixed with name -> strip prefix for cleaner tool parsing
          cleanedPrompt = currentTranscript.replace(/^(hey\s+|hi\s+)?phoenix[,!]?\s*/i, "");
          if (!cleanedPrompt.trim()) cleanedPrompt = "Hey Phoenix";
        }

        setTranscript(cleanedPrompt);
        if (cleanedPrompt.trim()) {
          setSpeechStatus(`Speaking: "${cleanedPrompt}"`);
        }

        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current);
        }

        // AUTO-SEND SILENCE DETECTOR: 1.0 second pause auto-transmits prompt
        if (cleanedPrompt.trim()) {
          silenceTimerRef.current = setTimeout(() => {
            console.log("Pause detected. Auto-submitting prompt...");
            stopListening();
          }, 1000);
        }
      };

      recognition.onend = () => {
        cleanupAudioAnalyser();
        setIsListening(false);
        autoSubmitTranscript();

        // AUTO-RESTART MIC: If hands-free continuous mode is active and AI is not speaking out loud
        if (isHandsFreeRef.current && !isSpeakingRef.current) {
          if (restartTimerRef.current) clearTimeout(restartTimerRef.current);
          restartTimerRef.current = setTimeout(() => {
            console.log("Auto-restarting continuous mic listening...");
            startListening();
          }, 600);
        }
      };

      recognition.onerror = (event: any) => {
        cleanupAudioAnalyser();
        setIsListening(false);
        if (event.error === "no-speech") {
          setSpeechStatus("Listening...");
          if (isHandsFreeRef.current && !isSpeakingRef.current) {
            if (restartTimerRef.current) clearTimeout(restartTimerRef.current);
            restartTimerRef.current = setTimeout(() => startListening(), 800);
          }
        } else {
          setSpeechStatus(`Speech error: ${event.error}`);
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      cleanupAudioAnalyser();
      setIsListening(false);
      setSpeechStatus("Failed to start speech recognition");
    }
  }, [autoSubmitTranscript, stopListening, cleanupAudioAnalyser]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      cleanupAudioAnalyser();
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      if (restartTimerRef.current) clearTimeout(restartTimerRef.current);
    };
  }, [cleanupAudioAnalyser]);

  // Browser speech synthesis chunk player with Auto-Listen Resume after speech
  const speakUtteranceChunk = useCallback((text: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    if (!text.trim()) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.05;
    utterance.pitch = 1.0;

    utterance.onstart = () => {
      setIsSpeaking(true);
      isSpeakingRef.current = true;
      setAudioLevel(0.6);
      // Abort mic while AI is speaking to prevent acoustic feedback loop
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch (e) {}
      }
    };

    utterance.onend = () => {
      if (!window.speechSynthesis.speaking) {
        setIsSpeaking(false);
        isSpeakingRef.current = false;
        setAudioLevel(0);

        // Resume auto-listening immediately after AI finishes speaking out loud
        if (isHandsFreeRef.current) {
          setTimeout(() => {
            console.log("AI finished speaking. Resuming hands-free listening...");
            startListening();
          }, 400);
        }
      }
    };

    utterance.onerror = () => {
      setIsSpeaking(false);
      isSpeakingRef.current = false;
      setAudioLevel(0);
      if (isHandsFreeRef.current) {
        setTimeout(() => startListening(), 400);
      }
    };

    window.speechSynthesis.speak(utterance);
  }, [startListening]);

  // Process incoming streaming AI text chunks for TTS
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

  // Reset TTS buffer
  const resetTTSBuffer = useCallback(() => {
    spokenIndexRef.current = 0;
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
    isSpeakingRef.current = false;
    setAudioLevel(0);
  }, []);

  return {
    isListening,
    transcript,
    isSpeaking,
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
    setTranscript,
  };
}
