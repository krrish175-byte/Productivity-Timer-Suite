/**
 * Stopwatch Module - High-precision timing with smooth display updates
 * Implements stopwatch functionality with start, pause, reset, and save operations
 * Uses requestAnimationFrame for smooth 60fps updates and high precision timing
 * Effects on webpage: Provides accurate time tracking for any duration activities
 * Used by: Main app for flexible timing needs, different from structured Pomodoro sessions
 * Removal impact: No flexible timing capability, users limited to fixed Pomodoro intervals
 */

// Import function to format milliseconds into readable time strings for display
// Effects: Enables proper time formatting in stopwatch display
// Removal impact: Stopwatch would show raw milliseconds, making it unreadable
import { formatTime } from '../utils.js';

// Import function to save completed timing sessions to database for history tracking
// Effects: Enables persistence of stopwatch sessions for activity tracking
// Removal impact: No session history, users couldn't track timed activities
import { addSession } from '../db.js';

// Import audio function for success feedback when saving sessions
// Effects: Provides positive audio confirmation when sessions are saved
// Removal impact: No audio feedback for save operations, less satisfying UX
import { playSuccess } from '../audio.js';

// Internal state object for stopwatch timing and control
// Effects: Maintains precise timing state for accurate stopwatch functionality
// Removal impact: No state tracking, stopwatch couldn't function or maintain accuracy
let state = {
  isRunning: false,           // Whether stopwatch is currently running
  startTime: 0,               // DOMHighResTimeStamp when timer started/resumed for precision
  elapsedTime: 0,             // Accumulated time in milliseconds across pause/resume cycles
  animationFrameId: null      // requestAnimationFrame ID for cleanup and smooth updates
};

// DOM element references for UI manipulation and display updates
// Effects: Provides access to UI elements for real-time updates and interactions
// Removal impact: No UI control, stopwatch display and controls would be broken
let container = null;        // Main container element for stopwatch UI structure
let displayElement = null;   // Element showing the current elapsed time to user
let startButton = null;      // Button to start/resume stopwatch timing
let pauseButton = null;      // Button to pause stopwatch while preserving elapsed time
let resetButton = null;      // Button to reset stopwatch to zero
let saveButton = null;       // Button to save current elapsed time to database

/**
 * Initialize the stopwatch module
 * Sets up UI and event listeners
 * @param {HTMLElement} containerElement - The container to render the stopwatch in
 */
export function init(containerElement) {
  container = containerElement;
  
  // Create UI structure
  container.innerHTML = `
    <div class="stopwatch">
      <div class="timer-display" id="stopwatch-display">00:00:00</div>
      <div class="timer-controls">
        <button id="stopwatch-start" class="btn btn-primary">Start</button>
        <button id="stopwatch-pause" class="btn btn-secondary" disabled>Pause</button>
        <button id="stopwatch-reset" class="btn btn-secondary">Reset</button>
        <button id="stopwatch-save" class="btn btn-success">Save</button>
      </div>
    </div>
  `;

  // Get references to DOM elements
  displayElement = container.querySelector('#stopwatch-display');
  startButton = container.querySelector('#stopwatch-start');
  pauseButton = container.querySelector('#stopwatch-pause');
  resetButton = container.querySelector('#stopwatch-reset');
  saveButton = container.querySelector('#stopwatch-save');

  // Attach event listeners
  startButton.addEventListener('click', start);
  pauseButton.addEventListener('click', pause);
  resetButton.addEventListener('click', reset);
  saveButton.addEventListener('click', save);

  console.log('Stopwatch module initialized');
}

/**
 * Start or resume the stopwatch
 * Uses requestAnimationFrame for smooth updates
 */
export function start() {
  if (state.isRunning) {
    return; // Already running
  }

  state.isRunning = true;
  state.startTime = performance.now();

  // Update button states
  startButton.disabled = true;
  pauseButton.disabled = false;

  // Start the animation loop
  updateDisplay();

  console.log('Stopwatch started');
}

/**
 * Pause the stopwatch
 * Preserves elapsed time
 */
export function pause() {
  if (!state.isRunning) {
    return; // Already paused
  }

  state.isRunning = false;

  // Calculate and accumulate elapsed time
  const now = performance.now();
  state.elapsedTime += (now - state.startTime);

  // Cancel animation frame
  if (state.animationFrameId !== null) {
    cancelAnimationFrame(state.animationFrameId);
    state.animationFrameId = null;
  }

  // Update button states
  startButton.disabled = false;
  pauseButton.disabled = true;

  console.log('Stopwatch paused at:', state.elapsedTime, 'ms');
}

/**
 * Reset the stopwatch to zero
 */
export function reset() {
  // Stop if running
  if (state.isRunning) {
    state.isRunning = false;
    if (state.animationFrameId !== null) {
      cancelAnimationFrame(state.animationFrameId);
      state.animationFrameId = null;
    }
  }

  // Reset state
  state.elapsedTime = 0;
  state.startTime = 0;

  // Update display
  displayElement.textContent = '00:00:00';

  // Update button states
  startButton.disabled = false;
  pauseButton.disabled = true;

  console.log('Stopwatch reset');
}

/**
 * Save the current elapsed time to the database
 * Stores session with type "Stopwatch"
 */
export async function save() {
  try {
    // Calculate current elapsed time
    let currentElapsed = state.elapsedTime;
    if (state.isRunning) {
      const now = performance.now();
      currentElapsed += (now - state.startTime);
    }

    if (currentElapsed === 0) {
      console.log('No time to save');
      return;
    }

    // Save to database
    const sessionId = await addSession('Stopwatch', currentElapsed, new Date());
    console.log('Stopwatch session saved with ID:', sessionId);

    // Play success sound
    playSuccess();

    // Optionally provide user feedback
    saveButton.textContent = 'Saved!';
    setTimeout(() => {
      saveButton.textContent = 'Save';
    }, 1500);

  } catch (error) {
    console.error('Error saving stopwatch session:', error);
    saveButton.textContent = 'Error';
    setTimeout(() => {
      saveButton.textContent = 'Save';
    }, 1500);
  }
}

/**
 * Update the display using requestAnimationFrame
 * Provides smooth 60fps updates
 */
function updateDisplay() {
  if (!state.isRunning) {
    return;
  }

  // Calculate current elapsed time
  const now = performance.now();
  const currentElapsed = state.elapsedTime + (now - state.startTime);

  // Update display
  displayElement.textContent = formatTime(currentElapsed);

  // Schedule next update
  state.animationFrameId = requestAnimationFrame(updateDisplay);
}
