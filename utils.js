/**
 * Utility functions for formatting time and date values
 */

/**
 * Converts milliseconds to human-readable time format
 * @param {number} milliseconds - Time duration in milliseconds
 * @returns {string} Formatted time string in "HH:MM:SS" or "MM:SS" format
 */
export function formatTime(milliseconds) {
  // Convert milliseconds to total seconds by dividing by 1000 and rounding down
  const totalSeconds = Math.floor(milliseconds / 1000);
  // Calculate hours by dividing total seconds by 3600 (60*60) and rounding down
  const hours = Math.floor(totalSeconds / 3600);
  // Calculate minutes from remaining seconds after hours are removed
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  // Calculate remaining seconds after hours and minutes are removed
  const seconds = totalSeconds % 60;

  // Helper function to pad single digits with leading zero
  const pad = (num) => String(num).padStart(2, '0');

  // Check if duration is an hour or longer
  if (hours > 0) {
    // Return format with hours: "HH:MM:SS"
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  } else {
    // Return format without hours: "MM:SS"
    return `${pad(minutes)}:${pad(seconds)}`;
  }
}

/**
 * Converts Date object to human-readable date string
 * @param {Date} dateObj - Date object to format
 * @returns {string} Formatted date string in "YYYY-MM-DD HH:MM" format
 */
export function formatDate(dateObj) {
  // Get 4-digit year from date object
  const year = dateObj.getFullYear();
  // Get month (0-11) and add 1 to make it 1-12, then pad with zero
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  // Get day of month (1-31) and pad with zero if needed
  const day = String(dateObj.getDate()).padStart(2, '0');
  // Get hours (0-23) and pad with zero if needed
  const hours = String(dateObj.getHours()).padStart(2, '0');
  // Get minutes (0-59) and pad with zero if needed
  const minutes = String(dateObj.getMinutes()).padStart(2, '0');

  // Combine all parts into ISO-like format: "YYYY-MM-DD HH:MM"
  return `${year}-${month}-${day} ${hours}:${minutes}`;
}
