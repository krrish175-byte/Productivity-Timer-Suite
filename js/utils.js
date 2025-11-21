/**
 * Format milliseconds to MM:SS.ms or HH:MM:SS format
 * @param {number} ms - Time in milliseconds
 * @param {boolean} includeMs - Whether to include milliseconds (default: true)
 * @returns {string} Formatted time string
 */
export function formatTime(ms, includeMs = true) {
  // Handle edge cases
  if (ms < 0) ms = 0;
  if (isNaN(ms)) ms = 0;

  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const milliseconds = Math.floor((ms % 1000) / 10); // Two digits for ms

  // Format with leading zeros
  const mm = String(minutes).padStart(2, '0');
  const ss = String(seconds).padStart(2, '0');
  const msFormatted = String(milliseconds).padStart(2, '0');

  if (hours > 0) {
    // If hours exist, show HH:MM:SS format
    const hh = String(hours).padStart(2, '0');
    return includeMs ? `${hh}:${mm}:${ss}.${msFormatted}` : `${hh}:${mm}:${ss}`;
  }

  // Default MM:SS.ms format
  return includeMs ? `${mm}:${ss}.${msFormatted}` : `${mm}:${ss}`;
}

/**
 * Format Date object to human-readable string
 * @param {Date} date - Date object to format
 * @returns {string} Formatted date string
 */
export function formatDate(date) {
  // Handle invalid dates
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    return 'Invalid Date';
  }

  // Use Intl.DateTimeFormat for consistent, readable formatting
  const options = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  };

  return new Intl.DateTimeFormat('en-US', options).format(date);
}
