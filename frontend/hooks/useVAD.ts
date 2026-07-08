import { useEffect, useRef, useState, useCallback } from 'react';
import { getAudioContext } from '../services/audioContext';

interface UseVADOptions {
  stream: MediaStream | null;
  minDecibels?: number;
  silenceDelay?: number;
  onSpeechStart?: () => void;
  onSpeechEnd?: () => void;
}

export function useVAD({
  stream,
  minDecibels = -50,
  silenceDelay = 1500,
  onSpeechStart,
  onSpeechEnd
}: UseVADOptions) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [volume, setVolume] = useState(-100);

  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const rafRef = useRef<number>(null);
  const silenceStartRef = useRef<number | null>(null);
  const isSpeakingRef = useRef(false); // Ref for accurate state within requestAnimationFrame

  const cleanup = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (sourceRef.current) {
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }
    analyserRef.current = null;
  }, []);

  useEffect(() => {
    if (!stream) {
      cleanup();
      if (isSpeakingRef.current) {
        setIsSpeaking(false);
        isSpeakingRef.current = false;
        onSpeechEnd?.();
      }
      return;
    }

    const audioContext = getAudioContext();
    const analyser = audioContext.createAnalyser();
    analyser.minDecibels = minDecibels;
    analyser.maxDecibels = -10;
    analyser.smoothingTimeConstant = 0.85;
    analyser.fftSize = 1024;
    
    const source = audioContext.createMediaStreamSource(stream);
    source.connect(analyser);

    analyserRef.current = analyser;
    sourceRef.current = source;
    
    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    const checkAudioLevel = () => {
      if (!analyserRef.current) return;

      analyserRef.current.getByteFrequencyData(dataArray);
      
      let sum = 0;
      let maxVol = 0;
      for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i];
        if (dataArray[i] > maxVol) {
          maxVol = dataArray[i];
        }
      }
      const average = sum / dataArray.length;
      const currentVolume = maxVol === 0 ? -100 : (maxVol / 255) * 100 - 100; // rough mapping to pseudo decibels

      setVolume(currentVolume);

      // Use maxVol for speech detection instead of average across all bins
      // 20 out of 255 is a very low threshold to catch even quiet speech
      const hasSpeech = maxVol > 20;

      if (hasSpeech) {
        silenceStartRef.current = null;
        if (!isSpeakingRef.current) {
          isSpeakingRef.current = true;
          setIsSpeaking(true);
          console.log("useVAD: Speech started detected");
          onSpeechStart?.();
        }
      } else {
        if (isSpeakingRef.current) {
          if (silenceStartRef.current === null) {
            silenceStartRef.current = Date.now();
          } else if (Date.now() - silenceStartRef.current > silenceDelay) {
            isSpeakingRef.current = false;
            setIsSpeaking(false);
            console.log("useVAD: Speech ended due to silence delay");
            onSpeechEnd?.();
          }
        }
      }

      rafRef.current = requestAnimationFrame(checkAudioLevel);
    };

    checkAudioLevel();

    return cleanup;
  }, [stream, minDecibels, silenceDelay, onSpeechStart, onSpeechEnd, cleanup]);

  return { isSpeaking, volume };
}
