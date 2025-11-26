/**
 * Utility functions for formatting time and date values
 */

/**
 * Converts milliseconds to human-readable time format
 * @param {number} milliseconds - Time duration in milliseconds
 * @returns {string} Formatted time string in "HH:MM:SS" or "MM:SS" format
 */
export function formatTime(milliseconds) {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  // Pad with leading zeros
  const pad = (num) => String(num).padStart(2, '0');

  // Return HH:MM:SS if hours > 0, otherwise MM:SS
  if (hours > 0) {
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  } else {
    return `${pad(minutes)}:${pad(seconds)}`;
  }
}

/**
 * Converts Date object to human-readable date string
 * @param {Date} dateObj - Date object to format
 * @returns {string} Formatted date string in "YYYY-MM-DD HH:MM" format
 */
export function formatDate(dateObj) {
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  const hours = String(dateObj.getHours()).padStart(2, '0');
  const minutes = String(dateObj.getMinutes()).padStart(2, '0');

  return `${year}-${month}-${day} ${hours}:${minutes}`;
}
