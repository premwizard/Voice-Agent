"use client";

import { useCallback, useRef, useEffect } from 'react';

// Lightweight Web Audio API wrapper for UI sounds
export function useSound() {
  const audioCtxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    // Lazy init audio context on first interaction
    const initAudio = () => {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
    };
    window.addEventListener('click', initAudio, { once: true });
    window.addEventListener('keydown', initAudio, { once: true });
    return () => {
      window.removeEventListener('click', initAudio);
      window.removeEventListener('keydown', initAudio);
      if (audioCtxRef.current?.state !== 'closed') {
        audioCtxRef.current?.close();
      }
    };
  }, []);

  const playTone = useCallback((frequency: number, type: OscillatorType, duration: number, volume: number = 0.1) => {
    if (!audioCtxRef.current) return;
    const ctx = audioCtxRef.current;
    if (ctx.state === 'suspended') ctx.resume();

    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(frequency, ctx.currentTime);
    
    // Smooth envelope
    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.05);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + duration);
  }, []);

  const playListeningStart = useCallback(() => {
    playTone(600, 'sine', 0.2, 0.05);
    setTimeout(() => playTone(800, 'sine', 0.2, 0.05), 100);
  }, [playTone]);

  const playListeningStop = useCallback(() => {
    playTone(500, 'sine', 0.2, 0.05);
    setTimeout(() => playTone(300, 'sine', 0.3, 0.05), 100);
  }, [playTone]);

  const playSuccess = useCallback(() => {
    playTone(880, 'sine', 0.1, 0.05);
    setTimeout(() => playTone(1108, 'sine', 0.3, 0.05), 100);
  }, [playTone]);

  return { playListeningStart, playListeningStop, playSuccess };
}
