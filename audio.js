/**
 * Audio Module
 * Handles sound notifications for timer completion and absence detection
 */

// Audio context for generating sounds
let audioContext = null;
let timerCompleteSound = null;
let absenceAlertSound = null;
let continuousAlertInterval = null;

/**
 * Initialize audio context
 */
function initAudio() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
}

/**
 * Play a beep sound with specified frequency and duration
 * @param {number} frequency - Frequency in Hz
 * @param {number} duration - Duration in milliseconds
 * @param {number} volume - Volume (0-1)
 */
function playBeep(frequency, duration, volume = 0.3) {
  initAudio();
  
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  
  oscillator.frequency.value = frequency;
  oscillator.type = 'sine';
  
  gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration / 1000);
  
  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + duration / 1000);
}

/**
 * Play a pleasant chime sound for timer completion
 */
export function playTimerComplete() {
  initAudio();
  
  // Play a pleasant ascending chime
  const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
  notes.forEach((freq, index) => {
    setTimeout(() => {
      playBeep(freq, 300, 0.2);
    }, index * 150);
  });
  
  console.log('Timer complete sound played');
}

/**
 * Play continuous alert sound for timer completion
 * Plays every 2 seconds until stopped
 */
export function playContinuousAlert() {
  initAudio();
  
  // Play immediately
  playTimerComplete();
  
  // Then play every 2 seconds
  continuousAlertInterval = setInterval(() => {
    playTimerComplete();
  }, 2000);
  
  console.log('Continuous alert started');
}

/**
 * Stop continuous alert sound
 */
export function stopContinuousAlert() {
  if (continuousAlertInterval) {
    clearInterval(continuousAlertInterval);
    continuousAlertInterval = null;
    console.log('Continuous alert stopped');
  }
}

/**
 * Play alert sound for absence detection
 */
export function playAbsenceAlert() {
  initAudio();
  
  // Play a warning sound (descending tones)
  const notes = [880, 740, 659.25]; // A5, F#5, E5
  notes.forEach((freq, index) => {
    setTimeout(() => {
      playBeep(freq, 200, 0.25);
    }, index * 100);
  });
  
  console.log('Absence alert sound played');
}

/**
 * Play a subtle notification sound
 */
export function playNotification() {
  initAudio();
  playBeep(800, 100, 0.15);
}

/**
 * Play success sound
 */
export function playSuccess() {
  initAudio();
  
  // Play ascending notes
  const notes = [523.25, 659.25]; // C5, E5
  notes.forEach((freq, index) => {
    setTimeout(() => {
      playBeep(freq, 150, 0.2);
    }, index * 100);
  });
}

