/**
 * Main application entry point
 * Coordinates all modules and initializes the application
 */

import { Stopwatch } from './modules/stopwatch.js';
import { Pomodoro } from './modules/pomodoro.js';
import { addSession, getSessions, initDB, deleteSession } from './db.js';
import { formatTime, formatDate } from './utils.js';
import { initRouter } from './router.js';

// Initialize timer instances
let stopwatch = null;
let pomodoro = null;

// Track database availability
let isDatabaseAvailable = true;

/**
 * Display a notification to the user
 * @param {string} message - The message to display
 * @param {string} type - The type of notification ('success' or 'error')
 * @param {number} duration - How long to show the notification in milliseconds (default: 3000)
 */
function showNotification(message, type = 'success', duration = 3000) {
  // Create notification element
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed;
    top: 80px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 1000;
    min-width: 300px;
    max-width: 500px;
    animation: slideDown 0.3s ease;
  `;
  
  // Add animation styles if not already present
  if (!document.getElementById('notification-styles')) {
    const style = document.createElement('style');
    style.id = 'notification-styles';
    style.textContent = `
      @keyframes slideDown {
        from {
          opacity: 0;
          transform: translateX(-50%) translateY(-20px);
        }
        to {
          opacity: 1;
          transform: translateX(-50%) translateY(0);
        }
      }
      @keyframes slideUp {
        from {
          opacity: 1;
          transform: translateX(-50%) translateY(0);
        }
        to {
          opacity: 0;
          transform: translateX(-50%) translateY(-20px);
        }
      }
    `;
    document.head.appendChild(style);
  }
  
  // Add to document
  document.body.appendChild(notification);
  
  // Remove after duration
  setTimeout(() => {
    notification.style.animation = 'slideUp 0.3s ease';
    setTimeout(() => {
      notification.remove();
    }, 300);
  }, duration);
}

/**
 * Render the history view with all saved sessions
 * Fetches sessions from database and displays them in a table
 */
async function renderHistory() {
  const historyContent = document.getElementById('history-content');
  
  if (!historyContent) {
    console.error('History content element not found');
    return;
  }
  
  // Check if database is available
  if (!isDatabaseAvailable) {
    historyContent.innerHTML = '<p class="error-message">Database is unavailable. History cannot be loaded. The application will continue to function, but sessions cannot be saved or retrieved.</p>';
    return;
  }
  
  try {
    // Fetch all sessions from database
    const sessions = await getSessions();
    
    // Check if there are any sessions
    if (!sessions || sessions.length === 0) {
      // Display empty state message
      historyContent.innerHTML = '<p class="empty-message">No sessions saved yet. Complete a timer session and save it to see it here.</p>';
      return;
    }
    
    // Create wrapper div with history-table class
    const tableWrapper = document.createElement('div');
    tableWrapper.className = 'history-table';
    
    // Create table element
    const table = document.createElement('table');
    
    // Create table header
    const thead = document.createElement('thead');
    thead.innerHTML = `
      <tr>
        <th>Type</th>
        <th>Duration</th>
        <th>Date</th>
        <th>Actions</th>
      </tr>
    `;
    table.appendChild(thead);
    
    // Create table body
    const tbody = document.createElement('tbody');
    
    // Add each session as a table row
    sessions.forEach(session => {
      const row = document.createElement('tr');
      
      // Type column
      const typeCell = document.createElement('td');
      typeCell.textContent = session.type.charAt(0).toUpperCase() + session.type.slice(1);
      row.appendChild(typeCell);
      
      // Duration column
      const durationCell = document.createElement('td');
      durationCell.textContent = formatTime(session.duration, false);
      row.appendChild(durationCell);
      
      // Date column
      const dateCell = document.createElement('td');
      // Convert date to Date object if it's stored as string
      const dateObj = session.date instanceof Date ? session.date : new Date(session.date);
      dateCell.textContent = formatDate(dateObj);
      row.appendChild(dateCell);
      
      // Actions column with delete button
      const actionsCell = document.createElement('td');
      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'btn btn-delete';
      deleteBtn.textContent = 'Delete';
      deleteBtn.dataset.sessionId = session.id;
      actionsCell.appendChild(deleteBtn);
      row.appendChild(actionsCell);
      
      tbody.appendChild(row);
    });
    
    table.appendChild(tbody);
    tableWrapper.appendChild(table);
    
    // Clear existing content and add table
    historyContent.innerHTML = '';
    historyContent.appendChild(tableWrapper);
    
  } catch (error) {
    console.error('Failed to render history:', error);
    historyContent.innerHTML = '<p class="error-message">Failed to load session history. Please try again.</p>';
    showNotification('Failed to load session history', 'error');
  }
}

/**
 * Handle deletion of a session
 * @param {number} sessionId - The ID of the session to delete
 */
async function handleDeleteSession(sessionId) {
  // Check if database is available
  if (!isDatabaseAvailable) {
    showNotification('Database is unavailable. Cannot delete session.', 'error');
    return;
  }
  
  try {
    // Delete the session from the database
    await deleteSession(sessionId);
    console.log(`Session ${sessionId} deleted successfully`);
    
    // Show success notification
    showNotification('Session deleted successfully', 'success');
    
    // Re-render the history view to reflect the deletion
    await renderHistory();
    
  } catch (error) {
    console.error('Failed to delete session:', error);
    showNotification('Failed to delete session. Please try again.', 'error');
  }
}

/**
 * Set up event listeners for history view
 * Triggers history rendering when navigating to history view
 * Uses event delegation for delete buttons
 */
function setupHistoryListeners() {
  // Find the history navigation button
  const historyNavButton = document.querySelector('.nav-button[data-view="history"]');
  
  if (historyNavButton) {
    historyNavButton.addEventListener('click', () => {
      // Render history when navigating to history view
      renderHistory();
    });
  }
  
  // Set up event delegation for delete buttons
  const historyContent = document.getElementById('history-content');
  if (historyContent) {
    historyContent.addEventListener('click', (event) => {
      // Check if the clicked element is a delete button
      if (event.target.classList.contains('btn-delete')) {
        const sessionId = parseInt(event.target.dataset.sessionId, 10);
        if (!isNaN(sessionId)) {
          handleDeleteSession(sessionId);
        }
      }
    });
  }
}

/**
 * Initialize the application
 */
async function init() {
  console.log('Productivity Timers Suite - Application loaded');
  
  // Initialize database with graceful degradation
  try {
    await initDB();
    console.log('Database initialized successfully');
    isDatabaseAvailable = true;
  } catch (error) {
    console.error('Failed to initialize database:', error);
    isDatabaseAvailable = false;
    showNotification('Database unavailable. Timers will work, but sessions cannot be saved.', 'error', 5000);
  }
  
  // Initialize stopwatch with display callback and error handling
  stopwatch = new Stopwatch((elapsed) => {
    try {
      const display = document.getElementById('stopwatch-display');
      if (display) {
        display.textContent = formatTime(elapsed);
      }
    } catch (error) {
      console.error('Error updating stopwatch display:', error);
    }
  });
  
  // Initialize pomodoro with display and mode callbacks with error handling
  pomodoro = new Pomodoro(
    // Display callback - update DOM with formatted time
    (remaining) => {
      try {
        const display = document.getElementById('pomodoro-display');
        if (display) {
          // Format remaining time without milliseconds for cleaner display
          display.textContent = formatTime(remaining, false);
        }
      } catch (error) {
        console.error('Error updating pomodoro display:', error);
      }
    },
    // Mode callback - update UI visual indication
    (mode) => {
      try {
        const modeIndicator = document.getElementById('pomodoro-mode');
        if (modeIndicator) {
          if (mode === 'work') {
            modeIndicator.textContent = 'Work Session';
            modeIndicator.className = 'mode-indicator work';
          } else {
            modeIndicator.textContent = 'Break Session';
            modeIndicator.className = 'mode-indicator break';
          }
        }
      } catch (error) {
        console.error('Error updating pomodoro mode:', error);
      }
    }
  );
  
  // Attach event listeners for stopwatch controls
  setupStopwatchListeners();
  
  // Attach event listeners for pomodoro controls
  setupPomodoroListeners();
  
  // Initialize router with default view and attach navigation listeners
  initRouter('stopwatch');
  
  // Attach event listener to history navigation to trigger rendering
  setupHistoryListeners();
}

/**
 * Set up event listeners for stopwatch buttons
 */
function setupStopwatchListeners() {
  const startBtn = document.getElementById('stopwatch-start');
  const pauseBtn = document.getElementById('stopwatch-pause');
  const resetBtn = document.getElementById('stopwatch-reset');
  const saveBtn = document.getElementById('stopwatch-save');
  
  if (startBtn) {
    startBtn.addEventListener('click', () => {
      try {
        stopwatch.start();
      } catch (error) {
        console.error('Error starting stopwatch:', error);
        showNotification('Failed to start stopwatch', 'error');
      }
    });
  }
  
  if (pauseBtn) {
    pauseBtn.addEventListener('click', () => {
      try {
        stopwatch.pause();
      } catch (error) {
        console.error('Error pausing stopwatch:', error);
        showNotification('Failed to pause stopwatch', 'error');
      }
    });
  }
  
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      try {
        stopwatch.reset();
      } catch (error) {
        console.error('Error resetting stopwatch:', error);
        showNotification('Failed to reset stopwatch', 'error');
      }
    });
  }
  
  if (saveBtn) {
    saveBtn.addEventListener('click', async () => {
      await saveStopwatchSession();
    });
  }
}

/**
 * Save the current stopwatch session to the database
 */
async function saveStopwatchSession() {
  // Check if database is available
  if (!isDatabaseAvailable) {
    showNotification('Database is unavailable. Cannot save session.', 'error');
    return;
  }
  
  try {
    const elapsed = stopwatch.getElapsed();
    
    // Validate elapsed time
    if (elapsed <= 0) {
      showNotification('No elapsed time to save. Start the stopwatch first.', 'error');
      return;
    }
    
    // Validate that elapsed time is a valid number
    if (isNaN(elapsed) || !isFinite(elapsed)) {
      console.error('Invalid elapsed time:', elapsed);
      showNotification('Invalid timer value. Please reset and try again.', 'error');
      return;
    }
    
    // Save session to database
    const sessionId = await addSession('stopwatch', elapsed, new Date());
    console.log(`Stopwatch session saved with ID: ${sessionId}`);
    
    // Show success notification
    showNotification('Stopwatch session saved successfully!', 'success');
    
  } catch (error) {
    console.error('Failed to save stopwatch session:', error);
    showNotification('Failed to save session. Please try again.', 'error');
  }
}

/**
 * Set up event listeners for pomodoro buttons
 */
function setupPomodoroListeners() {
  const startBtn = document.getElementById('pomodoro-start');
  const pauseBtn = document.getElementById('pomodoro-pause');
  const resetBtn = document.getElementById('pomodoro-reset');
  const saveBtn = document.getElementById('pomodoro-save');
  
  if (startBtn) {
    startBtn.addEventListener('click', () => {
      try {
        pomodoro.start();
      } catch (error) {
        console.error('Error starting pomodoro:', error);
        showNotification('Failed to start pomodoro timer', 'error');
      }
    });
  }
  
  if (pauseBtn) {
    pauseBtn.addEventListener('click', () => {
      try {
        pomodoro.pause();
      } catch (error) {
        console.error('Error pausing pomodoro:', error);
        showNotification('Failed to pause pomodoro timer', 'error');
      }
    });
  }
  
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      try {
        pomodoro.reset();
      } catch (error) {
        console.error('Error resetting pomodoro:', error);
        showNotification('Failed to reset pomodoro timer', 'error');
      }
    });
  }
  
  if (saveBtn) {
    saveBtn.addEventListener('click', async () => {
      await savePomodoroSession();
    });
  }
}

/**
 * Save the current pomodoro session to the database
 */
async function savePomodoroSession() {
  // Check if database is available
  if (!isDatabaseAvailable) {
    showNotification('Database is unavailable. Cannot save session.', 'error');
    return;
  }
  
  try {
    // Calculate duration based on mode and remaining time
    const mode = pomodoro.getMode();
    const remaining = pomodoro.getRemaining();
    
    // Calculate elapsed time from initial duration
    const initialDuration = mode === 'work' ? 25 * 60 * 1000 : 5 * 60 * 1000;
    const elapsed = initialDuration - remaining;
    
    // Validate elapsed time
    if (elapsed <= 0) {
      showNotification('No elapsed time to save. Start the pomodoro timer first.', 'error');
      return;
    }
    
    // Validate that elapsed time is a valid number
    if (isNaN(elapsed) || !isFinite(elapsed)) {
      console.error('Invalid elapsed time:', elapsed);
      showNotification('Invalid timer value. Please reset and try again.', 'error');
      return;
    }
    
    // Save session to database
    const sessionId = await addSession('pomodoro', elapsed, new Date());
    console.log(`Pomodoro session saved with ID: ${sessionId}`);
    
    // Show success notification
    showNotification('Pomodoro session saved successfully!', 'success');
    
  } catch (error) {
    console.error('Failed to save pomodoro session:', error);
    showNotification('Failed to save session. Please try again.', 'error');
  }
}

// Initialize application when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
