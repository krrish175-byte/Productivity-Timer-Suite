/**
 * Pomodoro Module
 * Implements Pomodoro Technique with 25-minute work sessions and 5-minute breaks
 */

export class Pomodoro {
  constructor(displayCallback, modeCallback) {
    this.displayCallback = displayCallback;
    this.modeCallback = modeCallback;
    this.mode = 'work'; // 'work' or 'break'
    this.remaining = 25 * 60 * 1000; // 25 minutes in milliseconds
    this.running = false;
    this.intervalId = null;
    this.lastTickTime = null;
  }

  /**
   * Start the Pomodoro timer
   * Begins countdown from current remaining time
   */
  start() {
    // Prevent starting if already running
    if (this.running) {
      console.warn('Pomodoro timer is already running');
      return;
    }
    
    // Validate remaining time is not corrupted
    if (isNaN(this.remaining) || !isFinite(this.remaining) || this.remaining < 0) {
      console.error('Invalid remaining time detected, resetting to work mode');
      this.remaining = 25 * 60 * 1000;
      this.mode = 'work';
    }
    
    this.running = true;
    this.lastTickTime = Date.now();
    
    // Start interval with 100ms precision
    this.intervalId = setInterval(() => this._tick(), 100);
    
    // Initial display update
    if (this.displayCallback) {
      this.displayCallback(this.remaining);
    }
  }

  /**
   * Internal tick method
   * Updates remaining time and handles transitions
   */
  _tick() {
    if (!this.running) return;
    
    try {
      const currentTime = Date.now();
      const elapsed = currentTime - this.lastTickTime;
      this.lastTickTime = currentTime;
      
      this.remaining -= elapsed;
      
      // Validate remaining time
      if (isNaN(this.remaining) || !isFinite(this.remaining)) {
        console.error('Invalid remaining time calculated, stopping timer');
        this.pause();
        return;
      }
      
      // Check if timer completed
      if (this.remaining <= 0) {
        this._handleCompletion();
        return;
      }
      
      // Update display
      if (this.displayCallback) {
        this.displayCallback(this.remaining);
      }
    } catch (error) {
      console.error('Error in pomodoro tick:', error);
      this.pause();
    }
  }

  /**
   * Handle timer completion and auto-transition
   */
  _handleCompletion() {
    // Transition modes
    if (this.mode === 'work') {
      this.mode = 'break';
      this.remaining = 5 * 60 * 1000; // 5 minutes
    } else {
      this.mode = 'work';
      this.remaining = 25 * 60 * 1000; // 25 minutes
    }
    
    // Notify mode change
    if (this.modeCallback) {
      this.modeCallback(this.mode);
    }
    
    // Update display with new remaining time
    if (this.displayCallback) {
      this.displayCallback(this.remaining);
    }
    
    // Reset tick time for next session
    this.lastTickTime = Date.now();
  }

  /**
   * Pause the Pomodoro timer
   * Freezes remaining time at current value
   */
  pause() {
    // Prevent pausing if not running
    if (!this.running) {
      console.warn('Pomodoro timer is not running');
      return;
    }
    
    this.running = false;
    
    // Validate remaining time
    if (isNaN(this.remaining) || !isFinite(this.remaining) || this.remaining < 0) {
      console.error('Invalid remaining time after pause, resetting to work mode');
      this.remaining = 25 * 60 * 1000;
      this.mode = 'work';
    }
    
    // Clear interval
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  /**
   * Reset the Pomodoro timer
   * Returns to initial 25-minute work session state
   */
  reset() {
    this.running = false;
    this.mode = 'work';
    this.remaining = 25 * 60 * 1000; // 25 minutes
    
    // Clear interval if running
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    
    // Notify mode change
    if (this.modeCallback) {
      this.modeCallback(this.mode);
    }
    
    // Update display to show initial time
    if (this.displayCallback) {
      this.displayCallback(this.remaining);
    }
  }

  /**
   * Get current remaining time in milliseconds
   * @returns {number} Remaining time in milliseconds
   */
  getRemaining() {
    try {
      // Validate remaining time
      if (isNaN(this.remaining) || !isFinite(this.remaining)) {
        console.error('Invalid remaining time');
        return 25 * 60 * 1000; // Return default work duration
      }
      
      return Math.max(0, this.remaining); // Ensure non-negative
    } catch (error) {
      console.error('Error getting remaining time:', error);
      return 25 * 60 * 1000; // Return default work duration
    }
  }

  /**
   * Get current mode
   * @returns {string} Current mode ('work' or 'break')
   */
  getMode() {
    return this.mode;
  }

  /**
   * Check if Pomodoro timer is currently running
   * @returns {boolean} True if running, false otherwise
   */
  isRunning() {
    return this.running;
  }
}
