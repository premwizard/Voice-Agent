// ==============================================================================
// FILE: src/hooks/useSpeech.ts
// WHAT THIS FILE IS: Auto-Sending Hands-Free Voice Speech Recognition & Synthesis Hook.
// WHY IT IS USED: Automatically detects silence (pause in speech) and immediately 
//                 transmits recorded voice text over WebSockets without clicking "Send".
// ==============================================================================

"use client";

// Import hooks from React
import { useState, useEffect, useRef, useCallback } from "react";

declare global {
  interface Window {
    SpeechRecognition?: any;
    webkitSpeechRecognition?: any;
  }
}

export function useSpeech(onSpeechEnd?: (finalText: string) => void) {
  // State tracking whether microphone is actively listening
  const [isListening, setIsListening] = useState<boolean>(false);
  // State storing transcribed speech text from user microphone
  const [transcript, setTranscript] = useState<string>("");
  // State tracking whether browser speech synthesis is currently speaking
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  // State tracking browser Web Speech API support
  const [isSupported, setIsSupported] = useState<boolean>(true);
  // Detailed status message string for UI diagnostics
  const [speechStatus, setSpeechStatus] = useState<string>("Click microphone to speak");
  // State tracking live audio input volume level (0 to 1) for visualizers
  const [audioLevel, setAudioLevel] = useState<number>(0);
  // State tracking Wake Word detection mode ("Phoenix")
  const [isWakeWordActive, setIsWakeWordActive] = useState<boolean>(true);

  // Ref storing SpeechRecognition instance across renders
  const recognitionRef = useRef<any>(null);
  // Ref storing live transcript string
  const transcriptRef = useRef<string>("");
  // Ref tracking onSpeechEnd callback
  const onSpeechEndRef = useRef(onSpeechEnd);
  // Ref tracking position of already spoken text buffer for real-time streaming TTS
  const spokenIndexRef = useRef<number>(0);
  // Ref tracking silence timer to auto-send prompt after pause in speech
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Audio Context & Analyser refs for real microphone frequency sampling
  const audioCtxRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Helper to cleanup audio nodes and microphone stream
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

  // Helper function to submit final transcript automatically
  const autoSubmitTranscript = useCallback(() => {
    const finalRecordedText = transcriptRef.current.trim();
    if (finalRecordedText && onSpeechEndRef.current) {
      console.log("Auto-submitting spoken text without button click:", finalRecordedText);
      setSpeechStatus(`Auto-Sent: "${finalRecordedText}"`);
      onSpeechEndRef.current(finalRecordedText);
      setTranscript("");
      transcriptRef.current = "";
    }
  }, []);

  // Check browser support on initial mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const hasSupport = !!(window.SpeechRecognition || window.webkitSpeechRecognition);
      setIsSupported(hasSupport);
      if (!hasSupport) {
        setSpeechStatus("Web Speech API not supported in this browser (Use Chrome or Edge)");
      }
    }
  }, []);

  // Function to stop microphone listening and auto-send immediately
  const stopListening = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
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

  // Function to start microphone listening with Web Audio API frequency sampling
  const startListening = useCallback(() => {
    if (typeof window === "undefined") return;

    const SpeechRecognitionClass = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognitionClass) {
      setIsSupported(false);
      setSpeechStatus("Web Speech API not supported in this browser");
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

        // Start Web Audio API Analyser for real volume visualization
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
            .catch((err) => console.warn("Microphone audio level sampling error:", err));
        }
      };

      recognition.onresult = (event: any) => {
        let currentTranscript = "";
        for (let i = 0; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }

        // Wake word detection ("Phoenix" / "Hey Phoenix")
        const lowerText = currentTranscript.toLowerCase().trim();
        let cleanedPrompt = currentTranscript;
        if (lowerText.startsWith("phoenix") || lowerText.startsWith("hey phoenix")) {
          console.log("🔥 Wake Word 'Phoenix' triggered!");
          cleanedPrompt = currentTranscript.replace(/^(hey\s+)?phoenix[,!]?\s*/i, "");
        }

        setTranscript(cleanedPrompt);
        if (cleanedPrompt.trim()) {
          setSpeechStatus(`Speaking: "${cleanedPrompt}"`);
        }

        // Reset silence timer on every new spoken word
        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current);
        }

        // AUTO-SEND TRIGGER: If user pauses for 1.2 seconds after speaking, automatically send prompt
        if (cleanedPrompt.trim()) {
          silenceTimerRef.current = setTimeout(() => {
            console.log("Pause in speech detected. Auto-sending prompt over WebSocket...");
            stopListening();
          }, 1200);
        }
      };

      recognition.onend = () => {
        cleanupAudioAnalyser();
        setIsListening(false);
        autoSubmitTranscript();
      };

      recognition.onerror = (event: any) => {
        cleanupAudioAnalyser();
        setIsListening(false);
        if (event.error === "no-speech") {
          setSpeechStatus("No speech heard. Click mic to speak again.");
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
      console.error("Speech recognition start error:", err);
    }
  }, [autoSubmitTranscript, stopListening, cleanupAudioAnalyser]);

  // Clean up audio context on component unmount
  useEffect(() => {
    return () => {
      cleanupAudioAnalyser();
    };
  }, [cleanupAudioAnalyser]);

  // Browser speech synthesis chunk player
  const speakUtteranceChunk = useCallback((text: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    if (!text.trim()) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.05;
    utterance.pitch = 1.0;

    utterance.onstart = () => {
      setIsSpeaking(true);
      setAudioLevel(0.6); // Simulate vibrant voice level pulse during TTS speech
    };

    utterance.onend = () => {
      if (!window.speechSynthesis.speaking) {
        setIsSpeaking(false);
        setAudioLevel(0);
      }
    };
    utterance.onerror = () => {
      setIsSpeaking(false);
      setAudioLevel(0);
    };

    window.speechSynthesis.speak(utterance);
  }, []);

  // Function to process incoming live streaming text and speak completed sentence chunks instantly
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

  // Function to reset TTS spoken index buffer for a new conversation turn
  const resetTTSBuffer = useCallback(() => {
    spokenIndexRef.current = 0;
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
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
    startListening,
    stopListening,
    speakUtteranceChunk,
    processStreamingTTS,
    resetTTSBuffer,
    setTranscript,
  };
}
