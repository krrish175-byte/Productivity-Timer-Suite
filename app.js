/**
 * Main Application Coordinator
 * Initializes all modules and manages application state
 */

import { initDB, getSessions, deleteSession } from './db.js';
import { switchTab } from './router.js';
import { formatTime, formatDate } from './utils.js';
import * as stopwatch from './modules/stopwatch.js';
import * as pomodoro from './modules/pomodoro.js';
import * as camera from './camera.js';
import { stopContinuousAlert } from './audio.js';
import * as distraction from './distraction.js';

// Application state
let currentTab = 'stopwatch';

/**
 * Initialize the application
 */
async function init() {
  try {
    // Initialize database
    await initDB();
    console.log('Application database initialized');

    // Set up navigation event listeners
    setupNavigation();

    // Initialize stopwatch module
    const stopwatchContainer = document.getElementById('stopwatch-container');
    stopwatch.init(stopwatchContainer);

    // Initialize Pomodoro module with camera callbacks
    const pomodoroContainer = document.getElementById('pomodoro-container');
    const cameraCallbacks = {
      onStart: handleCameraStart,
      onStop: handleCameraStop
    };
    pomodoro.init(pomodoroContainer, cameraCallbacks);

    // Set up Pomodoro settings
    setupPomodoroSettings();
    
    // Initialize distraction detection
    await initDistractionDetection();

    // Set default tab to Stopwatch
    switchTab('stopwatch');
    currentTab = 'stopwatch';

    // Add cleanup on page unload
    window.addEventListener('beforeunload', cleanup);

    console.log('Application initialized successfully');
  } catch (error) {
    console.error('Error initializing application:', error);
    alert('Failed to initialize application. Please refresh the page.');
  }
}

/**
 * Set up navigation event listeners
 */
function setupNavigation() {
  const navTabs = document.querySelectorAll('.nav-tab');
  
  navTabs.forEach(tab => {
    tab.addEventListener('click', (event) => {
      const tabName = event.target.dataset.tab;
      handleTabSwitch(tabName);
    });
  });
}

/**
 * Initialize distraction detection
 */
async function initDistractionDetection() {
  await distraction.initDistractionDetection({
    onDistraction: handleDistraction,
    onInactivity: handleInactivity,
    enableMicrophone: false, // Default off
    enableKeyboard: true, // Default on
    noiseThreshold: 50,
    inactivityMinutes: 5
  });
}

/**
 * Handle distraction detection
 */
function handleDistraction(data) {
  const distractionMessage = document.getElementById('distraction-message');
  
  if (distractionMessage) {
    distractionMessage.style.display = 'flex';
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
      distractionMessage.style.display = 'none';
    }, 5000);
  }
  
  console.log('Distraction detected:', data);
}

/**
 * Handle inactivity detection
 */
function handleInactivity(data) {
  const inactivityMessage = document.getElementById('inactivity-message');
  
  if (inactivityMessage) {
    inactivityMessage.style.display = 'flex';
    
    // Auto-hide after 10 seconds
    setTimeout(() => {
      inactivityMessage.style.display = 'none';
    }, 10000);
  }
  
  console.log('Inactivity detected:', data);
}

/**
 * Set up Pomodoro settings panel
 */
function setupPomodoroSettings() {
  const settingsToggle = document.getElementById('settings-toggle');
  const settingsDropdown = document.getElementById('settings-dropdown');
  const saveSettingsBtn = document.getElementById('save-settings');
  const workDurationInput = document.getElementById('work-duration');
  const breakDurationInput = document.getElementById('break-duration');
  const faceTrackingToggle = document.getElementById('face-tracking-toggle');
  const microphoneToggle = document.getElementById('microphone-detection-toggle');
  const keyboardToggle = document.getElementById('keyboard-detection-toggle');
  const noiseThresholdInput = document.getElementById('noise-threshold');
  const noiseThresholdValue = document.getElementById('noise-threshold-value');
  const noiseThresholdGroup = document.getElementById('noise-threshold-group');
  const inactivityThresholdInput = document.getElementById('inactivity-threshold');
  const inactivityThresholdGroup = document.getElementById('inactivity-threshold-group');
  
  // Toggle settings dropdown
  settingsToggle.addEventListener('click', () => {
    const isVisible = settingsDropdown.style.display === 'block';
    settingsDropdown.style.display = isVisible ? 'none' : 'block';
  });
  
  // Close dropdown when clicking outside
  document.addEventListener('click', (event) => {
    if (!event.target.closest('.settings-panel')) {
      settingsDropdown.style.display = 'none';
    }
  });
  
  // Face tracking toggle
  faceTrackingToggle.addEventListener('change', (event) => {
    camera.setFaceTracking(event.target.checked);
  });
  
  // Microphone detection toggle
  microphoneToggle.addEventListener('change', async (event) => {
    const enabled = event.target.checked;
    distraction.setMicrophoneEnabled(enabled);
    noiseThresholdGroup.style.display = enabled ? 'block' : 'none';
    
    if (enabled && currentTab === 'pomodoro') {
      try {
        await distraction.startMicrophoneDetection();
      } catch (error) {
        console.error('Failed to start microphone detection:', error);
        alert(error.message);
        microphoneToggle.checked = false;
        noiseThresholdGroup.style.display = 'none';
      }
    } else {
      distraction.stopMicrophoneDetection();
    }
  });
  
  // Keyboard detection toggle
  keyboardToggle.addEventListener('change', (event) => {
    const enabled = event.target.checked;
    distraction.setKeyboardEnabled(enabled);
    inactivityThresholdGroup.style.display = enabled ? 'block' : 'none';
    
    if (enabled && currentTab === 'pomodoro') {
      distraction.startKeyboardDetection();
    } else {
      distraction.stopKeyboardDetection();
    }
  });
  
  // Noise threshold slider
  noiseThresholdInput.addEventListener('input', (event) => {
    const value = event.target.value;
    noiseThresholdValue.textContent = value;
    distraction.setNoiseThreshold(parseInt(value, 10));
  });
  
  // Inactivity threshold input
  inactivityThresholdInput.addEventListener('change', (event) => {
    const minutes = parseInt(event.target.value, 10);
    if (minutes >= 1 && minutes <= 30) {
      distraction.setInactivityThreshold(minutes);
    }
  });
  
  // Save settings
  saveSettingsBtn.addEventListener('click', () => {
    const workMinutes = parseInt(workDurationInput.value, 10);
    const breakMinutes = parseInt(breakDurationInput.value, 10);
    
    if (workMinutes >= 1 && workMinutes <= 60 && breakMinutes >= 1 && breakMinutes <= 30) {
      pomodoro.setDurations(workMinutes, breakMinutes);
      settingsDropdown.style.display = 'none';
      
      // Show success feedback
      saveSettingsBtn.textContent = 'Applied!';
      setTimeout(() => {
        saveSettingsBtn.textContent = 'Apply Settings';
      }, 1500);
    } else {
      alert('Please enter valid durations:\nWork: 1-60 minutes\nBreak: 1-30 minutes');
    }
  });
}

/**
 * Handle tab switching
 * @param {string} tabName - The name of the tab to switch to
 */
function handleTabSwitch(tabName) {
  // Stop camera and distraction detection if switching away from Pomodoro
  if (currentTab === 'pomodoro' && tabName !== 'pomodoro') {
    handleCameraStop();
    stopContinuousAlert(); // Stop any alert sounds
    distraction.stopAllDetection(); // Stop distraction detection
  }

  // Switch to the new tab
  switchTab(tabName);
  currentTab = tabName;

  // Start distraction detection if switching to Pomodoro
  if (tabName === 'pomodoro') {
    const keyboardToggle = document.getElementById('keyboard-detection-toggle');
    if (keyboardToggle && keyboardToggle.checked) {
      distraction.startKeyboardDetection();
    }
  }

  // Render history if switching to History tab
  if (tabName === 'history') {
    renderHistory();
  }
}

/**
 * Render the history display
 * Retrieves all sessions from database and displays them in a table
 */
async function renderHistory() {
  const historyContainer = document.getElementById('history-container');
  
  try {
    // Retrieve all sessions from database
    const sessions = await getSessions();

    // Handle empty history state
    if (sessions.length === 0) {
      historyContainer.innerHTML = `
        <div class="empty-history">
          <p>No sessions recorded yet. Complete a timer session to see it here!</p>
        </div>
      `;
      return;
    }

    // Create table structure
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

    // Add rows for each session
    sessions.forEach(session => {
      const type = session.type;
      const duration = formatTime(session.duration);
      const date = formatDate(new Date(session.date));
      const id = session.id;

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

    tableHTML += `
        </tbody>
      </table>
    `;

    // Update the container
    historyContainer.innerHTML = tableHTML;

    // Wire up delete buttons
    const deleteButtons = historyContainer.querySelectorAll('.btn-delete');
    deleteButtons.forEach(button => {
      button.addEventListener('click', handleDeleteSession);
    });

  } catch (error) {
    console.error('Error rendering history:', error);
    historyContainer.innerHTML = `
      <div class="error-message">
        <p>Error loading history. Please try again.</p>
      </div>
    `;
  }
}

/**
 * Handle session deletion
 * @param {Event} event - Click event from delete button
 */
async function handleDeleteSession(event) {
  const sessionId = parseInt(event.target.dataset.sessionId, 10);
  
  try {
    // Delete from database
    await deleteSession(sessionId);
    console.log('Session deleted:', sessionId);

    // Refresh the history display
    await renderHistory();
  } catch (error) {
    console.error('Error deleting session:', error);
    alert('Failed to delete session. Please try again.');
  }
}

/**
 * Handle camera start
 * Called when Pomodoro timer starts
 */
async function handleCameraStart() {
  const videoElement = document.getElementById('camera-video');
  const cameraPreview = document.getElementById('camera-preview');
  
  try {
    // Start camera
    await camera.startCamera(videoElement);
    
    // Show camera preview
    cameraPreview.style.display = 'block';

    // Start presence detection
    camera.startPresenceDetection(
      () => pomodoro.handlePresenceRestored(),
      () => pomodoro.handlePresenceLost()
    );

    console.log('Camera and presence detection started');
    
    // Start distraction detection if enabled
    const microphoneToggle = document.getElementById('microphone-detection-toggle');
    const keyboardToggle = document.getElementById('keyboard-detection-toggle');
    
    if (microphoneToggle && microphoneToggle.checked) {
      try {
        await distraction.startMicrophoneDetection();
      } catch (error) {
        console.error('Failed to start microphone detection:', error);
      }
    }
    
    if (keyboardToggle && keyboardToggle.checked) {
      distraction.startKeyboardDetection();
    }
  } catch (error) {
    console.error('Error starting camera:', error);
  }
}

/**
 * Handle camera stop
 * Called when Pomodoro timer is reset or user switches tabs
 */
function handleCameraStop() {
  const cameraPreview = document.getElementById('camera-preview');
  
  try {
    // Stop presence detection
    camera.stopPresenceDetection();

    // Stop camera
    camera.stopCamera();
    
    // Stop distraction detection
    distraction.stopAllDetection();

    // Hide camera preview
    cameraPreview.style.display = 'none';

    console.log('Camera and presence detection stopped');
  } catch (error) {
    console.error('Error stopping camera:', error);
  }
}

/**
 * Cleanup function
 * Called on page unload
 */
function cleanup() {
  console.log('Cleaning up application resources');
  
  // Stop camera if active
  handleCameraStop();
}

// Initialize application when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
