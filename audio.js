/**
 * Audio Module
 * Handles sound notifications for timer completion and absence detection
 */

// Web Audio API context for generating synthesized sounds
let audioContext = null;
// Placeholder for timer completion sound (currently unused)
let timerCompleteSound = null;
// Placeholder for absence alert sound (currently unused)
let absenceAlertSound = null;
// setInterval ID for continuous alert repetition
let continuousAlertInterval = null;

/**
 * Initialize audio context
 * Creates Web Audio API context if it doesn't exist
 */
function initAudio() {
  // Check if audio context hasn't been created yet
  if (!audioContext) {
    // Create new AudioContext with browser compatibility
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
  // Ensure audio context is initialized before playing sound
  initAudio();
  
  // Create oscillator node to generate the tone
  const oscillator = audioContext.createOscillator();
  // Create gain node to control volume
  const gainNode = audioContext.createGain();
  
  // Connect oscillator to gain node for volume control
  oscillator.connect(gainNode);
  // Connect gain node to audio output destination
  gainNode.connect(audioContext.destination);
  
  // Set the frequency of the tone in Hz
  oscillator.frequency.value = frequency;
  // Use sine wave for clean, pleasant tone
  oscillator.type = 'sine';
  
  // Set initial volume level
  gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
  // Fade out volume to prevent audio clicks/pops
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration / 1000);
  
  // Start playing the tone immediately
  oscillator.start(audioContext.currentTime);
  // Stop the tone after specified duration
  oscillator.stop(audioContext.currentTime + duration / 1000);
}

/**
 * Play a pleasant chime sound for timer completion
 * Plays ascending musical notes (C5, E5, G5)
 */
export function playTimerComplete() {
  // Ensure audio context is ready
  initAudio();
  
  // Array of frequencies for pleasant ascending chime (C5, E5, G5 notes)
  const notes = [523.25, 659.25, 783.99];
  // Play each note with a delay to create melody
  notes.forEach((freq, index) => {
    // Delay each note by 150ms to create sequence
    setTimeout(() => {
      // Play each note for 300ms at moderate volume
      playBeep(freq, 300, 0.2);
    }, index * 150);
  });
  
  // Log to console for debugging
  console.log('Timer complete sound played');
}

/**
 * Play continuous alert sound for timer completion
 * Plays every 2 seconds until stopped
 */
export function playContinuousAlert() {
  // Ensure audio context is ready
  initAudio();
  
  // Play the chime sound immediately
  playTimerComplete();
  
  // Set up interval to repeat chime every 2 seconds
  continuousAlertInterval = setInterval(() => {
    // Play the same chime sound repeatedly
    playTimerComplete();
  }, 2000);
  
  // Log to console for debugging
  console.log('Continuous alert started');
}

/**
 * Stop continuous alert sound
 * Clears the repeating interval
 */
export function stopContinuousAlert() {
  // Check if continuous alert is currently running
  if (continuousAlertInterval) {
    // Stop the repeating interval
    clearInterval(continuousAlertInterval);
    // Reset interval ID to null
    continuousAlertInterval = null;
    // Log to console for debugging
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

