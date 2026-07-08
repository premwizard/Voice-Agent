let audioContext: AudioContext | null = null;

export const getAudioContext = (): AudioContext => {
  if (typeof window === 'undefined') {
    throw new Error('AudioContext is only available in the browser');
  }
  
  if (!audioContext) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    audioContext = new AudioContextClass();
  }
  
  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }
  
  return audioContext;
};

export const closeAudioContext = async (): Promise<void> => {
  if (audioContext) {
    await audioContext.close();
    audioContext = null;
  }
};
