/**
 * Main Application Coordinator
 * Initializes all modules and manages application state
 */

// Import database functions for session storage and retrieval
import { initDB, getSessions, deleteSession } from './db.js';
// Import navigation function for tab switching
import { switchTab } from './router.js';
// Import utility functions for formatting time and date displays
import { formatTime, formatDate } from './utils.js';
// Import all functions from the stopwatch timer module
import * as stopwatch from './modules/stopwatch.js';
// Import all functions from the pomodoro timer module
import * as pomodoro from './modules/pomodoro.js';
// Import all functions from the camera detection module
import * as camera from './camera.js';
// Import function to stop continuous alert sounds
import { stopContinuousAlert } from './audio.js';

// Global variable to track which tab is currently active
let currentTab = 'stopwatch';

/**
 * Initialize the application
 * Sets up all modules, event listeners, and default state
 */
async function init() {
  try {
    // Initialize the IndexedDB database for storing timer sessions
    await initDB();
    // Log successful database initialization to console
    console.log('Application database initialized');

    // Set up click event listeners for navigation tabs
    setupNavigation();

    // Get the DOM element that will contain the stopwatch UI
    const stopwatchContainer = document.getElementById('stopwatch-container');
    // Initialize the stopwatch module with its container element
    stopwatch.init(stopwatchContainer);

    // Get the DOM element that will contain the pomodoro timer UI
    const pomodoroContainer = document.getElementById('pomodoro-container');
    // Create callback functions for camera start/stop events
    const cameraCallbacks = {
      onStart: handleCameraStart, // Function to call when camera should start
      onStop: handleCameraStop   // Function to call when camera should stop
    };
    // Initialize the pomodoro module with its container and camera callbacks
    pomodoro.init(pomodoroContainer, cameraCallbacks);

    // Set up the settings panel for pomodoro timer configuration
    setupPomodoroSettings();

    // Switch to the stopwatch tab as the default view
    switchTab('stopwatch');
    // Update the global variable to track current tab
    currentTab = 'stopwatch';

    // Add event listener to clean up resources when page is closed
    window.addEventListener('beforeunload', cleanup);

    // Log successful application initialization to console
    console.log('Application initialized successfully');
  } catch (error) {
    // Log any initialization errors to console
    console.error('Error initializing application:', error);
    // Show user-friendly error message if initialization fails
    alert('Failed to initialize application. Please refresh the page.');
  }
}

/**
 * Set up navigation event listeners
 * Adds click handlers to all navigation tab buttons
 */
function setupNavigation() {
  // Get all elements with the 'nav-tab' class (navigation buttons)
  const navTabs = document.querySelectorAll('.nav-tab');
  
  // Loop through each navigation tab button
  navTabs.forEach(tab => {
    // Add click event listener to each tab button
    tab.addEventListener('click', (event) => {
      // Get the tab name from the data-tab attribute
      const tabName = event.target.dataset.tab;
      // Call function to handle switching to the selected tab
      handleTabSwitch(tabName);
    });
  });
}

/**
 * Set up Pomodoro settings panel
 * Configures event listeners for settings dropdown and form controls
 */
function setupPomodoroSettings() {
  // Get the gear icon button that toggles the settings dropdown
  const settingsToggle = document.getElementById('settings-toggle');
  // Get the dropdown panel that contains all settings
  const settingsDropdown = document.getElementById('settings-dropdown');
  // Get the button that saves/applies the settings
  const saveSettingsBtn = document.getElementById('save-settings');
  // Get the input field for work duration in minutes
  const workDurationInput = document.getElementById('work-duration');
  // Get the input field for break duration in minutes
  const breakDurationInput = document.getElementById('break-duration');
  // Get the checkbox toggle for face tracking visualization
  const faceTrackingToggle = document.getElementById('face-tracking-toggle');
  
  // Add click handler to toggle settings dropdown visibility
  settingsToggle.addEventListener('click', () => {
    // Check if dropdown is currently visible
    const isVisible = settingsDropdown.style.display === 'block';
    // Toggle visibility: hide if visible, show if hidden
    settingsDropdown.style.display = isVisible ? 'none' : 'block';
  });
  
  // Add click handler to close dropdown when clicking outside
  document.addEventListener('click', (event) => {
    // Check if click was outside the settings panel
    if (!event.target.closest('.settings-panel')) {
      // Hide the dropdown if click was outside
      settingsDropdown.style.display = 'none';
    }
  });
  
  // Add change handler for face tracking toggle checkbox
  faceTrackingToggle.addEventListener('change', (event) => {
    // Enable or disable face tracking based on checkbox state
    camera.setFaceTracking(event.target.checked);
  });
  
  // Add click handler for save settings button
  saveSettingsBtn.addEventListener('click', () => {
    // Parse work duration input as integer (base 10)
    const workMinutes = parseInt(workDurationInput.value, 10);
    // Parse break duration input as integer (base 10)
    const breakMinutes = parseInt(breakDurationInput.value, 10);
    
    // Validate that durations are within acceptable ranges
    if (workMinutes >= 1 && workMinutes <= 60 && breakMinutes >= 1 && breakMinutes <= 30) {
      // Apply the new durations to the pomodoro timer
      pomodoro.setDurations(workMinutes, breakMinutes);
      // Hide the settings dropdown after successful save
      settingsDropdown.style.display = 'none';
      
      // Change button text to show success feedback
      saveSettingsBtn.textContent = 'Applied!';
      // Reset button text back to original after 1.5 seconds
      setTimeout(() => {
        saveSettingsBtn.textContent = 'Apply Settings';
      }, 1500);
    } else {
      // Show error message if durations are invalid
      alert('Please enter valid durations:\nWork: 1-60 minutes\nBreak: 1-30 minutes');
    }
  });
}

/**
 * Handle tab switching
 * Manages cleanup and initialization when switching between tabs
 * @param {string} tabName - The name of the tab to switch to
 */
function handleTabSwitch(tabName) {
  // Check if we're leaving the pomodoro tab for another tab
  if (currentTab === 'pomodoro' && tabName !== 'pomodoro') {
    // Stop camera and presence detection when leaving pomodoro
    handleCameraStop();
    // Stop any continuous alert sounds that might be playing
    stopContinuousAlert();
  }

  // Call router function to show the selected tab and hide others
  switchTab(tabName);
  // Update global variable to track the new current tab
  currentTab = tabName;

  // Check if we're switching to the history tab
  if (tabName === 'history') {
    // Load and display the session history data
    renderHistory();
  }
}

/**
 * Render the history display
 * Retrieves all sessions from database and displays them in a table
 */
async function renderHistory() {
  // Get the DOM element that will contain the history table
  const historyContainer = document.getElementById('history-container');
  
  try {
    // Fetch all saved timer sessions from the database
    const sessions = await getSessions();

    // Check if there are no sessions saved yet
    if (sessions.length === 0) {
      // Display empty state message when no sessions exist
      historyContainer.innerHTML = `
        <div class="empty-history">
          <p>No sessions recorded yet. Complete a timer session to see it here!</p>
        </div>
      `;
      // Exit function early since there's nothing to display
      return;
    }

    // Start building HTML string for the history table
    let tableHTML = `
      <table class="history-table">
        <thead>
          <tr>
            <th>Type</th>
            <th>Duration</th>
            <th>Date</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
    `;

    // Loop through each session and create a table row
    sessions.forEach(session => {
      // Extract session type (Stopwatch or Pomodoro)
      const type = session.type;
      // Format duration from milliseconds to readable time string
      const duration = formatTime(session.duration);
      // Format date from Date object to readable date string
      const date = formatDate(new Date(session.date));
      // Get unique session ID for deletion
      const id = session.id;

      // Add HTML row for this session to the table
      tableHTML += `
        <tr data-session-id="${id}">
          <td>${type}</td>
          <td>${duration}</td>
          <td>${date}</td>
          <td>
            <button class="btn btn-delete" data-session-id="${id}">Delete</button>
          </td>
        </tr>
      `;
    });

    // Close the table body and table tags
    tableHTML += `
        </tbody>
      </table>
    `;

    // Insert the complete table HTML into the container
    historyContainer.innerHTML = tableHTML;

    // Get all delete buttons that were just created
    const deleteButtons = historyContainer.querySelectorAll('.btn-delete');
    // Add click event listener to each delete button
    deleteButtons.forEach(button => {
      button.addEventListener('click', handleDeleteSession);
    });

  } catch (error) {
    // Log error to console if database retrieval fails
    console.error('Error rendering history:', error);
    // Display error message to user if history loading fails
    historyContainer.innerHTML = `
      <div class="error-message">
        <p>Error loading history. Please try again.</p>
      </div>
    `;
  }
}

/**
 * Handle session deletion
 * Removes a session from the database and refreshes the display
 * @param {Event} event - Click event from delete button
 */
async function handleDeleteSession(event) {
  // Extract session ID from the button's data attribute and convert to integer
  const sessionId = parseInt(event.target.dataset.sessionId, 10);
  
  try {
    // Call database function to delete the session by ID
    await deleteSession(sessionId);
    // Log successful deletion to console
    console.log('Session deleted:', sessionId);

    // Refresh the history display to show updated list
    await renderHistory();
  } catch (error) {
    // Log deletion error to console
    console.error('Error deleting session:', error);
    // Show user-friendly error message if deletion fails
    alert('Failed to delete session. Please try again.');
  }
}

/**
 * Handle camera start
 * Called when Pomodoro timer starts - initializes camera and presence detection
 */
async function handleCameraStart() {
  // Get the video element that will display the camera feed
  const videoElement = document.getElementById('camera-video');
  // Get the container element for the camera preview
  const cameraPreview = document.getElementById('camera-preview');
  
  try {
    // Initialize camera with the video element (requests permissions)
    await camera.startCamera(videoElement);
    
    // Make the camera preview container visible
    cameraPreview.style.display = 'block';

    // Start monitoring for user presence with callback functions
    camera.startPresenceDetection(
      () => pomodoro.handlePresenceRestored(), // Called when user returns
      () => pomodoro.handlePresenceLost()      // Called when user leaves
    );

    // Log successful camera startup to console
    console.log('Camera and presence detection started');
  } catch (error) {
    // Log camera startup errors to console
    console.error('Error starting camera:', error);
  }
}

/**
 * Handle camera stop
 * Called when Pomodoro timer is reset or user switches tabs
 */
function handleCameraStop() {
  // Get the container element for the camera preview
  const cameraPreview = document.getElementById('camera-preview');
  
  try {
    // Stop monitoring for user presence
    camera.stopPresenceDetection();

    // Stop camera feed and release camera resources
    camera.stopCamera();

    // Hide the camera preview container
    cameraPreview.style.display = 'none';

    // Log successful camera shutdown to console
    console.log('Camera and presence detection stopped');
  } catch (error) {
    // Log camera shutdown errors to console
    console.error('Error stopping camera:', error);
  }
}

/**
 * Cleanup function
 * Called on page unload to release resources
 */
function cleanup() {
  // Log cleanup process to console
  console.log('Cleaning up application resources');
  
  // Stop camera and release resources if currently active
  handleCameraStop();
}

// Check if DOM is still loading or already loaded
if (document.readyState === 'loading') {
  // If still loading, wait for DOMContentLoaded event before initializing
  document.addEventListener('DOMContentLoaded', init);
} else {
  // If already loaded, initialize immediately
  init();
}
