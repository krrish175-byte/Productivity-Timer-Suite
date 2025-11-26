/**
 * Distraction Detection Module
 * Monitors for distractions using microphone (voice activity) and keyboard inactivity
 */

import { playNotification } from './audio.js';

// Microphone detection state
let audioContext = null;
let analyser = null;
let microphone = null;
let microphoneStream = null;
let voiceDetectionInterval = null;
let noiseThreshold = 50; // Adjustable noise threshold (0-100)
let voiceActivityDetected = false;

// Keyboard detection state
let lastKeyboardActivity = Date.now();
let keyboardInactivityInterval = null;
let keyboardInactivityThreshold = 5 * 60 * 1000; // 5 minutes in milliseconds

// Callbacks
let onDistractionCallback = null;
let onInactivityCallback = null;

// Detection modes
let microphoneEnabled = false;
let keyboardEnabled = false;

// Statistics
let distractionCount = 0;
let inactivityCount = 0;

/**
 * Initialize distraction detection
 * @param {Object} options - Configuration options
 * @param {Function} options.onDistraction - Called when distraction detected
 * @param {Function} options.onInactivity - Called when keyboard inactivity detected
 * @param {boolean} options.enableMicrophone - Enable microphone detection
 * @param {boolean} options.enableKeyboard - Enable keyboard detection
 * @param {number} options.noiseThreshold - Noise threshold (0-100)
 * @param {number} options.inactivityMinutes - Minutes of inactivity before alert
 */
export async function initDistractionDetection(options = {}) {
  onDistractionCallback = options.onDistraction || null;
  onInactivityCallback = options.onInactivity || null;
  microphoneEnabled = options.enableMicrophone || false;
  keyboardEnabled = options.enableKeyboard || false;
  noiseThreshold = options.noiseThreshold || 50;
  keyboardInactivityThreshold = (options.inactivityMinutes || 5) * 60 * 1000;
  
  console.log('Distraction detection initialized:', {
    microphone: microphoneEnabled,
    keyboard: keyboardEnabled,
    noiseThreshold,
    inactivityMinutes: options.inactivityMinutes || 5
  });
}

/**
 * Start microphone-based distraction detection
 */
export async function startMicrophoneDetection() {
  if (!microphoneEnabled) {
    console.log('Microphone detection is disabled');
    return;
  }
  
  try {
    // Request microphone access
    microphoneStream = await navigator.mediaDevices.getUserMedia({ 
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      } 
    });
    
    // Create audio context
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    analyser = audioContext.createAnalyser();
    microphone = audioContext.createMediaStreamSource(microphoneStream);
    
    // Configure analyser
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.8;
    microphone.connect(analyser);
    
    // Start monitoring
    voiceDetectionInterval = setInterval(checkVoiceActivity, 100); // Check every 100ms
    
    console.log('Microphone detection started');
  } catch (error) {
    console.error('Microphone access error:', error);
    if (error.name === 'NotAllowedError') {
      throw new Error('Microphone access denied. Please grant microphone permissions.');
    } else {
      throw new Error(`Microphone error: ${error.message}`);
    }
  }
}

/**
 * Stop microphone-based distraction detection
 */
export function stopMicrophoneDetection() {
  if (voiceDetectionInterval) {
    clearInterval(voiceDetectionInterval);
    voiceDetectionInterval = null;
  }
  
  if (microphone) {
    microphone.disconnect();
    microphone = null;
  }
  
  if (analyser) {
    analyser = null;
  }
  
  if (audioContext) {
    audioContext.close();
    audioContext = null;
  }
  
  if (microphoneStream) {
    microphoneStream.getTracks().forEach(track => track.stop());
    microphoneStream = null;
  }
  
  voiceActivityDetected = false;
  console.log('Microphone detection stopped');
}

/**
 * Check for voice activity
 */
function checkVoiceActivity() {
  if (!analyser) return;
  
  const bufferLength = analyser.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);
  analyser.getByteFrequencyData(dataArray);
  
  // Calculate average volume
  let sum = 0;
  for (let i = 0; i < bufferLength; i++) {
    sum += dataArray[i];
  }
  const average = sum / bufferLength;
  
  // Normalize to 0-100 scale
  const normalizedVolume = (average / 255) * 100;
  
  // Check if volume exceeds threshold
  if (normalizedVolume > noiseThreshold) {
    if (!voiceActivityDetected) {
      voiceActivityDetected = true;
      handleDistraction('voice', normalizedVolume);
    }
  } else {
    // Reset after 2 seconds of quiet
    if (voiceActivityDetected) {
      setTimeout(() => {
        voiceActivityDetected = false;
      }, 2000);
    }
  }
}

/**
 * Start keyboard inactivity detection
 */
export function startKeyboardDetection() {
  if (!keyboardEnabled) {
    console.log('Keyboard detection is disabled');
    return;
  }
  
  // Reset last activity time
  lastKeyboardActivity = Date.now();
  
  // Listen for keyboard events
  document.addEventListener('keydown', handleKeyboardActivity);
  document.addEventListener('keypress', handleKeyboardActivity);
  
  // Also listen for mouse clicks as activity
  document.addEventListener('click', handleKeyboardActivity);
  document.addEventListener('mousedown', handleKeyboardActivity);
  
  // Check for inactivity every 30 seconds
  keyboardInactivityInterval = setInterval(checkKeyboardInactivity, 30000);
  
  console.log('Keyboard inactivity detection started');
}

/**
 * Stop keyboard inactivity detection
 */
export function stopKeyboardDetection() {
  if (keyboardInactivityInterval) {
    clearInterval(keyboardInactivityInterval);
    keyboardInactivityInterval = null;
  }
  
  document.removeEventListener('keydown', handleKeyboardActivity);
  document.removeEventListener('keypress', handleKeyboardActivity);
  document.removeEventListener('click', handleKeyboardActivity);
  document.removeEventListener('mousedown', handleKeyboardActivity);
  
  console.log('Keyboard inactivity detection stopped');
}

/**
 * Handle keyboard/mouse activity
 */
function handleKeyboardActivity() {
  lastKeyboardActivity = Date.now();
}

/**
 * Check for keyboard inactivity
 */
function checkKeyboardInactivity() {
  const now = Date.now();
  const inactiveTime = now - lastKeyboardActivity;
  
  if (inactiveTime >= keyboardInactivityThreshold) {
    handleInactivity(inactiveTime);
    // Reset to avoid repeated alerts
    lastKeyboardActivity = now;
  }
}

/**
 * Handle distraction detection
 * @param {string} type - Type of distraction ('voice')
 * @param {number} level - Intensity level
 */
function handleDistraction(type, level) {
  distractionCount++;
  
  console.log(`Distraction detected: ${type}, level: ${level.toFixed(1)}`);
  
  // Play notification sound
  playNotification();
  
  // Call callback if provided
  if (onDistractionCallback) {
    onDistractionCallback({
      type,
      level,
      timestamp: Date.now(),
      count: distractionCount
    });
  }
}

/**
 * Handle inactivity detection
 * @param {number} inactiveTime - Time inactive in milliseconds
 */
function handleInactivity(inactiveTime) {
  inactivityCount++;
  
  const minutes = Math.floor(inactiveTime / 60000);
  console.log(`Inactivity detected: ${minutes} minutes`);
  
  // Play notification sound
  playNotification();
  
  // Call callback if provided
  if (onInactivityCallback) {
    onInactivityCallback({
      inactiveTime,
      minutes,
      timestamp: Date.now(),
      count: inactivityCount
    });
  }
}

/**
 * Update noise threshold
 * @param {number} threshold - New threshold (0-100)
 */
export function setNoiseThreshold(threshold) {
  noiseThreshold = Math.max(0, Math.min(100, threshold));
  console.log(`Noise threshold updated: ${noiseThreshold}`);
}

/**
 * Update inactivity threshold
 * @param {number} minutes - Minutes of inactivity
 */
export function setInactivityThreshold(minutes) {
  keyboardInactivityThreshold = minutes * 60 * 1000;
  console.log(`Inactivity threshold updated: ${minutes} minutes`);
}

/**
 * Enable/disable microphone detection
 * @param {boolean} enabled - Whether to enable
 */
export function setMicrophoneEnabled(enabled) {
  microphoneEnabled = enabled;
  
  if (!enabled) {
    stopMicrophoneDetection();
  }
  
  console.log(`Microphone detection ${enabled ? 'enabled' : 'disabled'}`);
}

/**
 * Enable/disable keyboard detection
 * @param {boolean} enabled - Whether to enable
 */
export function setKeyboardEnabled(enabled) {
  keyboardEnabled = enabled;
  
  if (!enabled) {
    stopKeyboardDetection();
  }
  
  console.log(`Keyboard detection ${enabled ? 'enabled' : 'disabled'}`);
}

/**
 * Get current audio level (for UI display)
 * @returns {number} Current audio level (0-100)
 */
export function getCurrentAudioLevel() {
  if (!analyser) return 0;
  
  const bufferLength = analyser.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);
  analyser.getByteFrequencyData(dataArray);
  
  let sum = 0;
  for (let i = 0; i < bufferLength; i++) {
    sum += dataArray[i];
  }
  const average = sum / bufferLength;
  
  return (average / 255) * 100;
}

/**
 * Get statistics
 * @returns {Object} Detection statistics
 */
export function getStatistics() {
  return {
    distractionCount,
    inactivityCount,
    lastKeyboardActivity,
    microphoneEnabled,
    keyboardEnabled
  };
}

/**
 * Reset statistics
 */
export function resetStatistics() {
  distractionCount = 0;
  inactivityCount = 0;
  console.log('Statistics reset');
}

/**
 * Stop all detection
 */
export function stopAllDetection() {
  stopMicrophoneDetection();
  stopKeyboardDetection();
  console.log('All distraction detection stopped');
}

