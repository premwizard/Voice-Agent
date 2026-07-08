import { useVoiceStore } from '../stores/voiceStore';

class TextToSpeechService {
  private synth: SpeechSynthesis | null = null;
  private voice: SpeechSynthesisVoice | null = null;
  private isSpeaking = false;

  constructor() {
    this.init();
  }

  private init() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
      
      // Load voices
      const loadVoices = () => {
        const voices = this.synth?.getVoices() || [];
        // Try to find a good English voice
        this.voice = voices.find(v => v.lang.startsWith('en-') && v.name.includes('Google')) 
                  || voices.find(v => v.lang.startsWith('en-')) 
                  || voices[0];
      };

      if (this.synth.onvoiceschanged !== undefined) {
        this.synth.onvoiceschanged = loadVoices;
      }
      loadVoices();
    }
  }

  speak(text: string) {
    if (!this.synth) return;

    // Optional: Stop currently speaking text before starting new one
    // this.stop();

    const utterance = new SpeechSynthesisUtterance(text);
    if (this.voice) {
      utterance.voice = this.voice;
    }
    
    // Configure voice properties
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    utterance.onstart = () => {
      this.isSpeaking = true;
    };

    utterance.onend = () => {
      this.isSpeaking = false;
    };

    utterance.onerror = (e) => {
      console.error('Speech synthesis error', e);
      this.isSpeaking = false;
    };

    this.synth.speak(utterance);
  }

  stop() {
    if (this.synth) {
      this.synth.cancel();
      this.isSpeaking = false;
    }
  }
}

export const ttsService = new TextToSpeechService();
