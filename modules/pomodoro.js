/**
 * Pomodoro Module - Productivity timer with work/break cycles and presence monitoring
 * Implements Pomodoro technique with camera integration for productivity tracking
 * Uses setInterval with drift correction for accurate countdown timing
 * Effects on webpage: Provides structured work sessions with automatic break transitions
 * Used by: Main app for productivity timing, integrates with camera for presence detection
 * Removal impact: No structured productivity timing, users lose Pomodoro technique benefits
 */

// Import function to format milliseconds into readable time strings for display
// Effects: Enables proper time formatting in pomodoro timer display
// Removal impact: Timer would show raw milliseconds, making it unreadable
import { formatTime } from '../utils.js';

// Import function to save completed work sessions to database for history tracking
// Effects: Enables persistence of completed pomodoro sessions for productivity tracking
// Removal impact: No session history, users couldn't track their productivity over time
import { addSession } from '../db.js';

// Import audio functions for timer completion notifications and absence alerts
// Effects: Provides audio feedback for timer events and presence monitoring
// Removal impact: Silent timer, users might miss completions and absence warnings
import { playContinuousAlert, stopContinuousAlert, playAbsenceAlert } from '../audio.js';

// Default work duration: 25 minutes converted to milliseconds (standard Pomodoro length)
// Effects: Sets standard Pomodoro work session length, can be customized by user
// Removal impact: No default work duration, timer initialization would fail
let WORK_DURATION = 25 * 60 * 1000;

// Default break duration: 5 minutes converted to milliseconds (standard Pomodoro break)
// Effects: Sets standard Pomodoro break length, can be customized by user
// Removal impact: No default break duration, break transitions would fail
let BREAK_DURATION = 5 * 60 * 1000;

// Object to track the current state of the pomodoro timer system
// Effects: Maintains all timer state for accurate countdown and mode management
// Removal impact: No state tracking, timer couldn't function or maintain accuracy
let state = {
  isRunning: false,                    // Whether timer is currently counting down
  mode: 'work',                        // Current mode: 'work' or 'break' for UI display
  remainingTime: WORK_DURATION,        // Milliseconds left in current session for countdown
  intervalId: null,                    // ID of setInterval for proper cleanup and control
  lastTickTime: 0,                     // Timestamp of last tick for drift correction accuracy
  workSessionStartTime: 0              // When current work session started (for database duration)
};

// Variables to hold references to DOM elements for UI manipulation
// Effects: Provides access to UI elements for updates and event handling
// Removal impact: No UI control, timer display and interactions would be broken
let container = null;        // Main container element for pomodoro UI structure
let displayElement = null;   // Element showing the countdown time to user
let modeElement = null;      // Element showing "Work Time" or "Break Time" status
let startButton = null;      // Button to start/resume timer functionality
let pauseButton = null;      // Button to pause timer during sessions
let resetButton = null;      // Button to reset timer to initial work state
let warningElement = null;   // Element showing absence warning message during monitoring

// Object containing callback functions for camera control integration
// Effects: Enables communication between pomodoro timer and camera system
// Removal impact: No camera integration, presence monitoring would be disconnected
let cameraCallbacks = {
  onStart: null,  // Function to call when camera monitoring should start
  onStop: null    // Function to call when camera monitoring should stop
};

/**
 * Set custom durations for work and break periods
 * @param {number} workMinutes - Work duration in minutes
 * @param {number} breakMinutes - Break duration in minutes
 */
export function setDurations(workMinutes, breakMinutes) {
  // Convert work minutes to milliseconds and store globally
  WORK_DURATION = workMinutes * 60 * 1000;
  // Convert break minutes to milliseconds and store globally
  BREAK_DURATION = breakMinutes * 60 * 1000;
  
  // Check if we need to update current session with new work duration
  if (state.mode === 'work' && state.remainingTime === (25 * 60 * 1000)) {
    // Update remaining time to new work duration
    state.remainingTime = WORK_DURATION;
    // Refresh the display to show new time
    updateDisplay();
  }
  
  // Log the duration changes to console for debugging
  console.log(`Durations updated: Work=${workMinutes}min, Break=${breakMinutes}min`);
}

/**
 * Initialize the Pomodoro module
 * Sets up UI and event listeners
 * @param {HTMLElement} containerElement - The container to render the Pomodoro timer in
 * @param {Object} callbacks - Camera control callbacks { onStart, onStop }
 */
export function init(containerElement, callbacks) {
  container = containerElement;
  cameraCallbacks = callbacks || { onStart: null, onStop: null };
  
  // Create UI structure
  container.innerHTML = `
    <div class="pomodoro">
      <div class="timer-mode" id="pomodoro-mode">Work Time</div>
      <div class="timer-display" id="pomodoro-display">25:00</div>
      <div class="timer-controls">
        <button id="pomodoro-start" class="btn btn-primary">Start</button>
        <button id="pomodoro-pause" class="btn btn-secondary" disabled>Pause</button>
        <button id="pomodoro-reset" class="btn btn-secondary">Reset</button>
      </div>
    </div>
  `;

  // Get references to DOM elements
  displayElement = container.querySelector('#pomodoro-display');
  modeElement = container.querySelector('#pomodoro-mode');
  startButton = container.querySelector('#pomodoro-start');
  pauseButton = container.querySelector('#pomodoro-pause');
  resetButton = container.querySelector('#pomodoro-reset');
  warningElement = document.querySelector('#warning-message');

  // Attach event listeners
  startButton.addEventListener('click', start);
  pauseButton.addEventListener('click', pause);
  resetButton.addEventListener('click', reset);

  console.log('Pomodoro module initialized');
}

/**
 * Start or resume the Pomodoro timer
 * Triggers camera start via callback
 */
export function start() {
  if (state.isRunning) {
    return; // Already running
  }

  // Stop any continuous alert when starting
  stopContinuousAlert();
  
  // Hide warning message if visible
  if (warningElement) {
    warningElement.style.display = 'none';
  }

  state.isRunning = true;
  state.lastTickTime = Date.now();

  // Update button states
  startButton.disabled = true;
  pauseButton.disabled = false;

  // Track work session start time for database
  if (state.mode === 'work' && state.remainingTime === WORK_DURATION) {
    state.workSessionStartTime = Date.now();
  }

  // Start camera if in work mode and callback is provided
  // This will restart monitoring even if it was stopped due to absence
  if (state.mode === 'work' && cameraCallbacks.onStart) {
    try {
      cameraCallbacks.onStart();
      console.log('Camera started via callback');
    } catch (error) {
      console.error('Error starting camera:', error);
    }
  }

  // Start the countdown interval
  state.intervalId = setInterval(tick, 100); // Check every 100ms for accuracy

  console.log('Pomodoro started in', state.mode, 'mode');
}

/**
 * Pause the Pomodoro timer
 * Preserves remaining time
 */
export function pause() {
  if (!state.isRunning) {
    return; // Already paused
  }

  state.isRunning = false;

  // Clear interval
  if (state.intervalId !== null) {
    clearInterval(state.intervalId);
    state.intervalId = null;
  }

  // Update button states
  startButton.disabled = false;
  pauseButton.disabled = true;

  console.log('Pomodoro paused at:', state.remainingTime, 'ms remaining');
}

/**
 * Reset the Pomodoro timer to initial state
 * Returns to 25-minute work mode and triggers camera stop via callback
 */
export function reset() {
  // Stop if running
  if (state.isRunning) {
    state.isRunning = false;
    if (state.intervalId !== null) {
      clearInterval(state.intervalId);
      state.intervalId = null;
    }
  }

  // Reset state to initial work mode
  state.mode = 'work';
  state.remainingTime = WORK_DURATION;
  state.workSessionStartTime = 0;

  // Update display
  updateDisplay();
  modeElement.textContent = 'Work Time';

  // Update button states
  startButton.disabled = false;
  pauseButton.disabled = true;

  // Hide warning message if visible
  if (warningElement) {
    warningElement.style.display = 'none';
  }

  // Stop camera via callback
  if (cameraCallbacks.onStop) {
    try {
      cameraCallbacks.onStop();
      console.log('Camera stopped via callback');
    } catch (error) {
      console.error('Error stopping camera:', error);
    }
  }

  console.log('Pomodoro reset to work mode');
}

/**
 * Handle presence lost event from camera
 * Automatically pauses timer, stops monitoring, and shows warning message
 */
export function handlePresenceLost() {
  console.log('Presence lost - pausing timer and stopping monitoring');
  
  // Pause the timer
  pause();

  // Stop camera monitoring via callback
  if (cameraCallbacks.onStop) {
    try {
      cameraCallbacks.onStop();
      console.log('Camera monitoring stopped due to absence');
    } catch (error) {
      console.error('Error stopping camera:', error);
    }
  }

  // Play absence alert sound
  playAbsenceAlert();

  // Show warning message
  if (warningElement) {
    warningElement.style.display = 'flex';
  }
}

/**
 * Handle presence restored event from camera
 * Hides warning message (timer stays paused, requires manual resume)
 * Note: This won't be called since monitoring stops on absence
 */
export function handlePresenceRestored() {
  console.log('Presence restored - hiding warning');
  
  // Hide warning message
  if (warningElement) {
    warningElement.style.display = 'none';
  }

  // Timer stays paused - user must manually resume
}

/**
 * Countdown tick function with drift correction
 * Called by setInterval
 */
function tick() {
  if (!state.isRunning) {
    return;
  }

  // Calculate elapsed time since last tick (drift correction)
  const now = Date.now();
  const elapsed = now - state.lastTickTime;
  state.lastTickTime = now;

  // Decrease remaining time
  state.remainingTime -= elapsed;

  // Check if timer reached zero
  if (state.remainingTime <= 0) {
    handleTimerComplete();
    return;
  }

  // Update display
  updateDisplay();
}

/**
 * Handle timer completion
 * Transitions between work and break modes, saves completed work sessions
 */
async function handleTimerComplete() {
  console.log('Timer completed in', state.mode, 'mode');

  // Stop the timer
  state.isRunning = false;
  if (state.intervalId !== null) {
    clearInterval(state.intervalId);
    state.intervalId = null;
  }

  // Play continuous alert sound
  playContinuousAlert();

  if (state.mode === 'work') {
    // Save completed work session to database
    try {
      const workDuration = WORK_DURATION;
      await addSession('Pomodoro', workDuration, new Date());
      console.log('Pomodoro work session saved');
    } catch (error) {
      console.error('Error saving Pomodoro session:', error);
    }

    // Transition to break mode
    state.mode = 'break';
    state.remainingTime = BREAK_DURATION;
    modeElement.textContent = 'Break Time';
    
    // Stop camera when transitioning to break
    if (cameraCallbacks.onStop) {
      try {
        cameraCallbacks.onStop();
        console.log('Camera stopped for break');
      } catch (error) {
        console.error('Error stopping camera:', error);
      }
    }

    // Auto-start break timer
    state.isRunning = true;
    state.lastTickTime = Date.now();
    state.intervalId = setInterval(tick, 100);
    
    // Update button states
    startButton.disabled = true;
    pauseButton.disabled = false;

  } else {
    // Break completed - return to work mode
    state.mode = 'work';
    state.remainingTime = WORK_DURATION;
    modeElement.textContent = 'Work Time';
    
    // Update button states
    startButton.disabled = false;
    pauseButton.disabled = true;
  }

  // Update display
  updateDisplay();
}

/**
 * Update the display with current remaining time
 */
function updateDisplay() {
  displayElement.textContent = formatTime(Math.max(0, state.remainingTime));
}

