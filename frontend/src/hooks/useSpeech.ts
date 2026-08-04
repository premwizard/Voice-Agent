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
    setIsListening(false);
    autoSubmitTranscript();
  }, [autoSubmitTranscript]);

  // Function to start microphone listening with auto-silence detection
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
      };

      recognition.onresult = (event: any) => {
        let currentTranscript = "";
        for (let i = 0; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        setTranscript(currentTranscript);
        setSpeechStatus(`Speaking: "${currentTranscript}"`);

        // Reset silence timer on every new spoken word
        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current);
        }

        // AUTO-SEND TRIGGER: If user pauses for 1.2 seconds after speaking, automatically send prompt
        if (currentTranscript.trim()) {
          silenceTimerRef.current = setTimeout(() => {
            console.log("Pause in speech detected. Auto-sending prompt over WebSocket...");
            stopListening();
          }, 1200);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
        autoSubmitTranscript();
      };

      recognition.onerror = (event: any) => {
        setIsListening(false);
        if (event.error === "no-speech") {
          setSpeechStatus("No speech heard. Click mic to speak again.");
        } else if (event.error === "not-allowed" || event.error === "permission-denied") {
          setSpeechStatus("⚠️ Microphone blocked! Allow Mic in browser address bar.");
        } else {
          setSpeechStatus(`Notice: ${event.error}`);
        }
      };

      recognitionRef.current = recognition;
      setTranscript("");
      transcriptRef.current = "";
      recognition.start();
    } catch (err) {
      console.warn("Failed to start speech recognition:", err);
      setIsListening(false);
      setSpeechStatus("Could not start microphone.");
    }
  }, [autoSubmitTranscript, stopListening]);

  // Function to queue and speak a single sentence chunk immediately
  const speakUtteranceChunk = useCallback((textChunk: string) => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      const cleanChunk = textChunk.replace(/[*_#`~]/g, "").trim();
      if (!cleanChunk) return;

      const utterance = new SpeechSynthesisUtterance(cleanChunk);
      utterance.rate = 1.05;
      utterance.pitch = 1.0;

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => {
        if (!window.speechSynthesis.speaking) {
          setIsSpeaking(false);
        }
      };
      utterance.onerror = () => setIsSpeaking(false);

      window.speechSynthesis.speak(utterance);
    }
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
  }, []);

  return {
    isListening,
    transcript,
    isSpeaking,
    isSupported,
    speechStatus,
    startListening,
    stopListening,
    speakUtteranceChunk,
    processStreamingTTS,
    resetTTSBuffer,
    setTranscript,
  };
}
