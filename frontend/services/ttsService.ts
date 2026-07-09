import { useVoiceStore } from '../stores/voiceStore';

class TTSService {
  private queue: string[] = [];
  private isPlaying: boolean = false;
  private synth: SpeechSynthesis;
  private voice: SpeechSynthesisVoice | null = null;
  
  constructor() {
    this.synth = window.speechSynthesis;
    // Try to load voices
    if (this.synth.onvoiceschanged !== undefined) {
      this.synth.onvoiceschanged = this.loadVoices.bind(this);
    }
    this.loadVoices();
  }

  private loadVoices() {
    const voices = this.synth.getVoices();
    // Try to find a good English voice
    this.voice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Premium'))) || voices[0] || null;
  }

  public speak(text: string) {
    if (!text.trim()) return;
    // Remove markdown formatting like asterisks that sound unnatural
    const cleanText = text.replace(/[*_~`#]/g, '').trim();
    if (!cleanText) return;
    this.queue.push(cleanText);
    this.processQueue();
  }

  private processQueue() {
    if (this.isPlaying || this.queue.length === 0) return;

    this.isPlaying = true;
    useVoiceStore.getState().setIsSpeaking(true);

    const text = this.queue.shift()!;
    const utterance = new SpeechSynthesisUtterance(text);
    
    if (this.voice) {
      utterance.voice = this.voice;
    }

    utterance.onend = () => {
      this.isPlaying = false;
      
      if (this.queue.length > 0) {
        this.processQueue();
      } else {
        useVoiceStore.getState().setIsSpeaking(false);
      }
    };

    utterance.onerror = (e) => {
      console.error('TTS Error:', e);
      this.isPlaying = false;
      this.processQueue();
    };

    this.synth.speak(utterance);
  }

  public stop() {
    this.queue = [];
    this.synth.cancel();
    this.isPlaying = false;
    useVoiceStore.getState().setIsSpeaking(false);
  }
}

export const ttsService = new TTSService();
