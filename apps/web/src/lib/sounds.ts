// Sound effects using Web Audio API
const audioContext = typeof window !== 'undefined' ? new (window.AudioContext || (window as any).webkitAudioContext)() : null;

function playTone(frequency: number, duration: number, type: OscillatorType = 'sine', volume: number = 0.3) {
  if (!audioContext) return;
  
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  
  oscillator.frequency.value = frequency;
  oscillator.type = type;
  
  gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
  
  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + duration);
}

export const sounds = {
  // Success sound - ascending notes
  success: () => {
    playTone(523.25, 0.1); // C5
    setTimeout(() => playTone(659.25, 0.1), 100); // E5
    setTimeout(() => playTone(783.99, 0.15), 200); // G5
  },
  
  // Error sound - descending buzz
  error: () => {
    playTone(200, 0.15, 'sawtooth', 0.2);
    setTimeout(() => playTone(150, 0.2, 'sawtooth', 0.15), 100);
  },
  
  // Click sound - short blip
  click: () => {
    playTone(800, 0.05, 'sine', 0.2);
  },
  
  // Countdown beep
  countdown: () => {
    playTone(440, 0.1, 'sine', 0.3);
  },
  
  // Go sound (after countdown)
  go: () => {
    playTone(880, 0.15, 'sine', 0.4);
  },
  
  // Sequence button sounds (4 different tones)
  sequenceButton: (index: number) => {
    const frequencies = [261.63, 329.63, 392.00, 523.25]; // C4, E4, G4, C5
    playTone(frequencies[index], 0.2, 'sine', 0.4);
  },
  
  // Level up
  levelUp: () => {
    playTone(523.25, 0.1);
    setTimeout(() => playTone(659.25, 0.1), 80);
    setTimeout(() => playTone(783.99, 0.1), 160);
    setTimeout(() => playTone(1046.50, 0.2), 240);
  },
  
  // New record
  newRecord: () => {
    const notes = [523.25, 659.25, 783.99, 1046.50, 783.99, 1046.50];
    notes.forEach((freq, i) => {
      setTimeout(() => playTone(freq, 0.15, 'sine', 0.3), i * 100);
    });
  },
  
  // Typing correct
  typeCorrect: () => {
    playTone(600, 0.03, 'sine', 0.1);
  },
  
  // Typing error
  typeError: () => {
    playTone(200, 0.08, 'square', 0.1);
  },
};

// Resume audio context on user interaction (required by browsers)
export function initAudio() {
  if (audioContext && audioContext.state === 'suspended') {
    audioContext.resume();
  }
}
