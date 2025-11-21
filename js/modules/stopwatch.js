/**
 * Stopwatch Module
 * Implements stopwatch timing logic with high-precision timing
 */

export class Stopwatch {
  constructor(displayCallback) {
    this.displayCallback = displayCallback;
    this.startTime = null;
    this.elapsed = 0;
    this.running = false;
    this.animationId = null;
  }

  /**
   * Start the stopwatch
   * Begins incrementing time from current elapsed value
   */
  start() {
    // Prevent starting if already running
    if (this.running) {
      console.warn('Stopwatch is already running');
      return;
    }
    
    // Validate elapsed time is not corrupted
    if (isNaN(this.elapsed) || !isFinite(this.elapsed)) {
      console.error('Invalid elapsed time detected, resetting to 0');
      this.elapsed = 0;
    }
    
    this.running = true;
    this.startTime = performance.now();
    this._tick();
  }

  /**
   * Internal tick method using requestAnimationFrame
   * Updates display and schedules next frame
   */
  _tick() {
    if (!this.running) return;
    
    try {
      const currentTime = performance.now();
      const currentElapsed = this.elapsed + (currentTime - this.startTime);
      
      // Validate calculated elapsed time
      if (isNaN(currentElapsed) || !isFinite(currentElapsed)) {
        console.error('Invalid elapsed time calculated, stopping stopwatch');
        this.pause();
        return;
      }
      
      // Call display callback with current elapsed time
      if (this.displayCallback) {
        this.displayCallback(currentElapsed);
      }
      
      // Schedule next frame
      this.animationId = requestAnimationFrame(() => this._tick());
    } catch (error) {
      console.error('Error in stopwatch tick:', error);
      this.pause();
    }
  }

  /**
   * Pause the stopwatch
   * Freezes elapsed time at current value
   */
  pause() {
    // Prevent pausing if not running
    if (!this.running) {
      console.warn('Stopwatch is not running');
      return;
    }
    
    this.running = false;
    
    // Accumulate elapsed time
    const currentTime = performance.now();
    this.elapsed += (currentTime - this.startTime);
    
    // Validate accumulated elapsed time
    if (isNaN(this.elapsed) || !isFinite(this.elapsed)) {
      console.error('Invalid elapsed time after pause, resetting to 0');
      this.elapsed = 0;
    }
    
    // Cancel animation frame
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  /**
   * Reset the stopwatch
   * Returns elapsed time to zero
   */
  reset() {
    this.running = false;
    this.elapsed = 0;
    this.startTime = null;
    
    // Cancel animation frame if running
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    
    // Update display to show zero
    if (this.displayCallback) {
      this.displayCallback(0);
    }
  }

  /**
   * Get current elapsed time in milliseconds
   * @returns {number} Elapsed time in milliseconds
   */
  getElapsed() {
    try {
      if (this.running) {
        const currentTime = performance.now();
        const elapsed = this.elapsed + (currentTime - this.startTime);
        
        // Validate calculated elapsed time
        if (isNaN(elapsed) || !isFinite(elapsed)) {
          console.error('Invalid elapsed time calculated');
          return 0;
        }
        
        return elapsed;
      }
      
      // Validate stored elapsed time
      if (isNaN(this.elapsed) || !isFinite(this.elapsed)) {
        console.error('Invalid stored elapsed time');
        return 0;
      }
      
      return this.elapsed;
    } catch (error) {
      console.error('Error getting elapsed time:', error);
      return 0;
    }
  }

  /**
   * Check if stopwatch is currently running
   * @returns {boolean} True if running, false otherwise
   */
  isRunning() {
    return this.running;
  }
}
