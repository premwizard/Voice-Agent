export interface VADOptions {
  minDecibels?: number; // Minimum volume to be considered speech
  silenceDelay?: number; // MS of silence before speech is considered ended
}

export interface VADState {
  isSpeaking: boolean;
  volume: number;
}

export interface SpeechRecognitionOptions {
  onSpeechStart?: () => void;
  onSpeechEnd?: () => void;
  onTranscript?: (text: string, isFinal: boolean) => void;
}
