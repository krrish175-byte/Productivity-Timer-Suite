/**
 * Audio Module - Sound notifications and alerts system
 * Handles sound notifications for timer completion and absence detection using Web Audio API
 * Effects on webpage: Provides audio feedback for timer events and user presence changes
 * Used by: Pomodoro timer completion, absence detection, user interaction feedback
 * Removal impact: App would be silent, users might miss timer completions and alerts
 */

// Web Audio API context for generating synthesized sounds programmatically
// Effects: Enables creation of beeps, chimes, and alert sounds without audio files
// Removal impact: No audio generation capability, all sound functions would fail
let audioContext = null;

// Placeholder for timer completion sound (currently unused - using synthesized sounds instead)
// Effects: Reserved for future implementation of custom completion sounds
// Removal impact: No impact currently as it's not used in active code
let timerCompleteSound = null;

// Placeholder for absence alert sound (currently unused - using synthesized sounds instead)
// Effects: Reserved for future implementation of custom alert sounds
// Removal impact: No impact currently as it's not used in active code
let absenceAlertSound = null;

// setInterval ID for continuous alert repetition when timer completes
// Effects: Stores reference to repeating alert so it can be stopped when user responds
// Removal impact: Continuous alerts could not be stopped, playing indefinitely
let continuousAlertInterval = null;

/**
 * Initialize Web Audio API context for sound generation
 * Effects on webpage: Enables audio playback capability for timer notifications
 * Called by: All sound functions before playing audio
 * Removal impact: All audio functions would fail, no sounds could be generated
 */
function initAudio() {
  // Check if audio context hasn't been created yet to avoid multiple instances
  // Effects: Prevents creating duplicate audio contexts which could cause conflicts
  // Removal impact: Multiple contexts could be created, wasting resources
  if (!audioContext) {
    // Create new AudioContext with browser compatibility fallback
    // Effects: Establishes audio processing capability for sound synthesis
    // Removal impact: No audio context means no way to generate or play sounds
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
}

/**
 * Play a synthesized beep sound with specified characteristics
 * Effects on webpage: Generates audio tones for notifications and alerts
 * Used by: All other audio functions as the core sound generation method
 * Removal impact: No sounds could be generated, all audio feedback would be lost
 * @param {number} frequency - Frequency in Hz (e.g., 440 for A4 note)
 * @param {number} duration - Duration in milliseconds (e.g., 300 for short beep)
 * @param {number} volume - Volume level from 0-1 (default 0.3 for comfortable listening)
 */
function playBeep(frequency, duration, volume = 0.3) {
  // Ensure audio context is initialized before playing sound
  // Effects: Guarantees audio system is ready for sound generation
  // Removal impact: Audio operations would fail without initialized context
  initAudio();
  
  // Create oscillator node to generate the tone waveform
  // Effects: Provides the sound source for the beep at specified frequency
  // Removal impact: No sound source means no audio would be generated
  const oscillator = audioContext.createOscillator();
  
  // Create gain node to control volume and prevent audio clipping
  // Effects: Allows precise volume control and smooth fade-out
  // Removal impact: Sound would be at full volume and could cause audio pops
  const gainNode = audioContext.createGain();
  
  // Connect oscillator to gain node for volume control in audio processing chain
  // Effects: Routes sound through volume control before output
  // Removal impact: No volume control, sound would bypass gain processing
  oscillator.connect(gainNode);
  
  // Connect gain node to audio output destination (speakers/headphones)
  // Effects: Routes processed audio to user's audio output device
  // Removal impact: No audio output, sound would be generated but not heard
  gainNode.connect(audioContext.destination);
  
  // Set the frequency of the tone in Hz (determines pitch)
  // Effects: Controls the musical note/pitch of the beep sound
  // Removal impact: Frequency would default to 440Hz, losing pitch control
  oscillator.frequency.value = frequency;
  
  // Use sine wave for clean, pleasant tone without harsh harmonics
  // Effects: Creates smooth, professional-sounding notification tones
  // Removal impact: Would use default square wave, creating harsh, unpleasant sounds
  oscillator.type = 'sine';
  
  // Set initial volume level at the current audio time
  // Effects: Establishes starting volume for the beep
  // Removal impact: Volume would be at maximum, potentially too loud
  gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
  
  // Fade out volume to prevent audio clicks/pops when sound stops
  // Effects: Creates smooth ending to prevent jarring audio cutoff
  // Removal impact: Abrupt sound ending would create unpleasant audio artifacts
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration / 1000);
  
  // Start playing the tone immediately at current audio time
  // Effects: Begins audio generation and playback
  // Removal impact: Sound would be created but never played
  oscillator.start(audioContext.currentTime);
  
  // Stop the tone after specified duration to prevent infinite playback
  // Effects: Automatically ends the beep after the desired length
  // Removal impact: Sound would play indefinitely, creating continuous noise
  oscillator.stop(audioContext.currentTime + duration / 1000);
}

/**
 * Play a pleasant chime sound for timer completion notifications
 * Effects on webpage: Provides audio feedback when pomodoro or stopwatch completes
 * Called by: Pomodoro timer completion, continuous alert system
 * Removal impact: Users would miss timer completions without audio notification
 * Plays ascending musical notes (C5, E5, G5) for pleasant, non-jarring alert
 */
export function playTimerComplete() {
  // Ensure audio context is ready for sound generation
  // Effects: Guarantees audio system is initialized before playing chime
  // Removal impact: Audio operations would fail silently
  initAudio();
  
  // Array of frequencies for pleasant ascending chime (C5, E5, G5 major chord notes)
  // Effects: Creates harmonious, recognizable completion sound that's not annoying
  // Removal impact: No musical sequence, would need single beep or silence
  const notes = [523.25, 659.25, 783.99];
  
  // Play each note with a delay to create melodic sequence
  // Effects: Creates flowing musical phrase instead of harsh simultaneous tones
  // Removal impact: All notes would play at once, creating dissonant chord
  notes.forEach((freq, index) => {
    // Delay each note by 150ms to create pleasant musical timing
    // Effects: Spaces notes for clear melodic progression
    // Removal impact: Notes would overlap, creating muddy sound
    setTimeout(() => {
      // Play each note for 300ms at moderate volume to avoid being startling
      // Effects: Creates gentle, pleasant notification sound
      // Removal impact: Notes would be too short or too loud, becoming jarring
      playBeep(freq, 300, 0.2);
    }, index * 150);
  });
  
  // Log to console for debugging and monitoring audio events
  // Effects: Helps developers track when completion sounds are triggered
  // Removal impact: No debugging information for audio events
  console.log('Timer complete sound played');
}

/**
 * Play continuous repeating alert sound for timer completion
 * Effects on webpage: Ensures users notice timer completion even if away from screen
 * Called by: Pomodoro timer completion to get user attention
 * Removal impact: Users might miss timer completions if not looking at screen
 * Plays chime every 2 seconds until manually stopped by user interaction
 */
export function playContinuousAlert() {
  // Ensure audio context is ready for sound generation
  // Effects: Guarantees audio system is initialized before starting alerts
  // Removal impact: Audio operations would fail silently
  initAudio();
  
  // Play the chime sound immediately when continuous alert starts
  // Effects: Provides instant audio feedback that timer has completed
  // Removal impact: No immediate notification, user might not notice completion
  playTimerComplete();
  
  // Set up interval to repeat chime every 2 seconds for persistent notification
  // Effects: Creates repeating alert that continues until user responds
  // Removal impact: Only single chime, user might miss it if distracted
  continuousAlertInterval = setInterval(() => {
    // Play the same pleasant chime sound repeatedly at regular intervals
    // Effects: Maintains consistent, recognizable alert pattern
    // Removal impact: No repeating alerts, single notification only
    playTimerComplete();
  }, 2000);
  
  // Log to console for debugging and monitoring alert system
  // Effects: Helps developers track when continuous alerts are activated
  // Removal impact: No debugging information for alert system behavior
  console.log('Continuous alert started');
}

/**
 * Stop continuous alert sound and clear the repeating interval
 * Effects on webpage: Silences repeating timer completion alerts when user responds
 * Called by: Timer start/reset actions, tab switching, user interactions
 * Removal impact: Continuous alerts would play indefinitely, becoming annoying
 */
export function stopContinuousAlert() {
  // Check if continuous alert is currently running to avoid unnecessary operations
  // Effects: Prevents errors when trying to clear non-existent intervals
  // Removal impact: Could cause errors when called multiple times
  if (continuousAlertInterval) {
    // Stop the repeating interval to end continuous alert playback
    // Effects: Immediately stops further chime repetitions
    // Removal impact: Alerts would continue playing indefinitely
    clearInterval(continuousAlertInterval);
    
    // Reset interval ID to null to indicate no active continuous alert
    // Effects: Marks alert system as inactive for future checks
    // Removal impact: System would think alert is still active when it's not
    continuousAlertInterval = null;
    
    // Log to console for debugging and monitoring alert system
    // Effects: Helps developers track when continuous alerts are deactivated
    // Removal impact: No debugging information for alert system behavior
    console.log('Continuous alert stopped');
  }
}

/**
 * Play alert sound for user absence detection during pomodoro sessions
 * Effects on webpage: Notifies user when camera detects they've left their workspace
 * Called by: Camera module when presence is lost during work session
 * Removal impact: No audio warning when user leaves, missing important productivity feedback
 */
export function playAbsenceAlert() {
  // Ensure audio context is ready for sound generation
  // Effects: Guarantees audio system is initialized before playing alert
  // Removal impact: Audio operations would fail silently
  initAudio();
  
  // Play a warning sound using descending tones to indicate something is wrong
  // Effects: Creates distinctive alert that differs from positive completion sounds
  // Removal impact: No audio distinction between positive and negative events
  const notes = [880, 740, 659.25]; // A5, F#5, E5 - descending minor progression
  
  // Play each note with shorter delays for urgent feeling
  // Effects: Creates quick, attention-grabbing alert sequence
  // Removal impact: No musical sequence to distinguish from other alerts
  notes.forEach((freq, index) => {
    setTimeout(() => {
      // Shorter duration and moderate volume for warning tone
      // Effects: Creates urgent but not jarring alert sound
      // Removal impact: Alert might be too long or too quiet to notice
      playBeep(freq, 200, 0.25);
    }, index * 100);
  });
  
  // Log to console for debugging absence detection system
  // Effects: Helps developers track when absence alerts are triggered
  // Removal impact: No debugging information for presence detection events
  console.log('Absence alert sound played');
}

/**
 * Play a subtle notification sound for minor UI interactions
 * Effects on webpage: Provides gentle audio feedback for button clicks and interactions
 * Called by: UI elements that need subtle audio confirmation
 * Removal impact: No audio feedback for user interactions, less engaging interface
 */
export function playNotification() {
  // Ensure audio context is ready for sound generation
  // Effects: Guarantees audio system is initialized before playing notification
  // Removal impact: Audio operations would fail silently
  initAudio();
  
  // Play single short beep at moderate frequency and low volume
  // Effects: Creates subtle, non-intrusive feedback for user actions
  // Removal impact: No audio confirmation of user interactions
  playBeep(800, 100, 0.15);
}

/**
 * Play success sound for positive actions like saving sessions
 * Effects on webpage: Provides positive audio feedback when user completes actions
 * Called by: Save operations, successful form submissions, achievements
 * Removal impact: No audio confirmation of successful actions, less satisfying UX
 */
export function playSuccess() {
  // Ensure audio context is ready for sound generation
  // Effects: Guarantees audio system is initialized before playing success sound
  // Removal impact: Audio operations would fail silently
  initAudio();
  
  // Play ascending notes for positive, uplifting feeling
  // Effects: Creates pleasant confirmation that action was successful
  // Removal impact: No audio distinction between success and other events
  const notes = [523.25, 659.25]; // C5, E5 - major third interval for positive sound
  
  // Play notes with quick timing for immediate feedback
  // Effects: Provides instant gratification for successful actions
  // Removal impact: No musical sequence to reinforce positive outcome
  notes.forEach((freq, index) => {
    setTimeout(() => {
      // Medium duration and volume for clear but pleasant feedback
      // Effects: Creates satisfying confirmation sound
      // Removal impact: Success feedback would be missing or unclear
      playBeep(freq, 150, 0.2);
    }, index * 100);
  });
}

