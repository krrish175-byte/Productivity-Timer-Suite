/**
 * Utility functions for formatting time and date values
 * This module provides essential formatting functions used throughout the timer application
 * Effects: Ensures consistent time/date display across all UI components
 * Removal impact: Would break all time displays, making timers unreadable
 */

/**
 * Converts milliseconds to human-readable time format (HH:MM:SS or MM:SS)
 * Effects on webpage: Updates all timer displays (stopwatch, pomodoro) with formatted time
 * Used by: Stopwatch display, Pomodoro display, History table duration column
 * Removal impact: Timer displays would show raw milliseconds, making them unreadable
 * @param {number} milliseconds - Time duration in milliseconds (e.g., 90000 for 1:30)
 * @returns {string} Formatted time string in "HH:MM:SS" or "MM:SS" format
 */
export function formatTime(milliseconds) {
  // Convert milliseconds to total seconds by dividing by 1000 and rounding down
  // Effects: Removes fractional seconds for cleaner display
  // Removal impact: Would cause TypeError when trying to calculate time components
  const totalSeconds = Math.floor(milliseconds / 1000);
  
  // Calculate hours by dividing total seconds by 3600 (60*60) and rounding down
  // Effects: Determines if we need to show hours in the display format
  // Removal impact: Hours would not be calculated, causing incorrect time display for long sessions
  const hours = Math.floor(totalSeconds / 3600);
  
  // Calculate minutes from remaining seconds after hours are removed
  // Effects: Shows accurate minutes in timer displays
  // Removal impact: Minutes would be incorrect for sessions longer than 1 hour
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  
  // Calculate remaining seconds after hours and minutes are removed
  // Effects: Shows precise seconds countdown in all timers
  // Removal impact: Seconds would be incorrect, showing total seconds instead of remainder
  const seconds = totalSeconds % 60;

  // Helper function to pad single digits with leading zero (e.g., "5" becomes "05")
  // Effects: Ensures consistent two-digit format for professional timer appearance
  // Removal impact: Single-digit numbers would display without leading zeros, looking unprofessional
  const pad = (num) => String(num).padStart(2, '0');

  // Check if duration is an hour or longer to determine display format
  // Effects: Automatically switches between MM:SS and HH:MM:SS formats based on duration
  // Removal impact: Would always show MM:SS format, truncating hours for long sessions
  if (hours > 0) {
    // Return format with hours: "HH:MM:SS" for sessions 1 hour or longer
    // Effects: Shows full time including hours for long work sessions
    // Removal impact: Hours would be lost, showing only minutes and seconds
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  } else {
    // Return format without hours: "MM:SS" for sessions under 1 hour
    // Effects: Shows clean, compact format for typical timer sessions
    // Removal impact: Would show "00:MM:SS" format even for short sessions
    return `${pad(minutes)}:${pad(seconds)}`;
  }
}

/**
 * Converts Date object to human-readable date string for history display
 * Effects on webpage: Formats timestamps in the history table for session records
 * Used by: History table date column, session record display
 * Removal impact: History would show raw Date objects, making timestamps unreadable
 * @param {Date} dateObj - Date object to format (JavaScript Date instance)
 * @returns {string} Formatted date string in "YYYY-MM-DD HH:MM" format
 */
export function formatDate(dateObj) {
  // Get 4-digit year from date object (e.g., 2024)
  // Effects: Provides year component for complete date display
  // Removal impact: Date would be incomplete without year information
  const year = dateObj.getFullYear();
  
  // Get month (0-11) and add 1 to make it 1-12, then pad with zero
  // Effects: Converts JavaScript's 0-based months to human-readable 1-12 format
  // Removal impact: Months would be off by 1 (January would show as 0)
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  
  // Get day of month (1-31) and pad with zero if needed
  // Effects: Shows day with consistent two-digit format
  // Removal impact: Single-digit days would display without leading zero
  const day = String(dateObj.getDate()).padStart(2, '0');
  
  // Get hours (0-23) and pad with zero if needed for 24-hour format
  // Effects: Shows time of day when session was completed
  // Removal impact: Time component would be missing from history records
  const hours = String(dateObj.getHours()).padStart(2, '0');
  
  // Get minutes (0-59) and pad with zero if needed
  // Effects: Provides minute precision for session timestamps
  // Removal impact: Would lose minute precision in history timestamps
  const minutes = String(dateObj.getMinutes()).padStart(2, '0');

  // Combine all parts into ISO-like format: "YYYY-MM-DD HH:MM"
  // Effects: Creates sortable, readable date format for history table
  // Removal impact: Would return undefined, breaking all date displays in history
  return `${year}-${month}-${day} ${hours}:${minutes}`;
}
