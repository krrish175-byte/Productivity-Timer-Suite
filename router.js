/**
 * Router Module - Navigation and tab switching logic for single-page application
 * Manages visibility of different app sections and navigation state
 * Effects on webpage: Controls which timer interface is visible to user
 * Used by: Main app navigation, tab click handlers, initial app setup
 * Removal impact: No navigation between timers, users stuck on one interface
 */

/**
 * Switches between different sections of the timer application
 * Effects on webpage: Hides current section, shows target section, updates navigation state
 * Called by: Navigation tab clicks, app initialization, programmatic navigation
 * Removal impact: No way to switch between stopwatch, pomodoro, and history views
 * @param {string} tabName - The name of the tab to switch to ('stopwatch', 'pomodoro', or 'history')
 */
export function switchTab(tabName) {
  // Array of valid tab names that can be switched to - defines available app sections
  // Effects: Validates navigation targets to prevent errors from invalid tab names
  // Removal impact: No validation, could attempt to show non-existent sections
  const validTabs = ['stopwatch', 'pomodoro', 'history'];
  
  // Check if the requested tab name is in the valid list for security and error prevention
  // Effects: Prevents navigation to undefined sections that could break the UI
  // Removal impact: Invalid tab names could cause errors or show empty content
  if (!validTabs.includes(tabName)) {
    // Log warning if invalid tab name is provided for debugging
    // Effects: Helps developers identify navigation errors during development
    // Removal impact: Silent failures, harder to debug navigation issues
    console.warn(`Invalid tab name: "${tabName}". Valid tabs are: ${validTabs.join(', ')}`);
    // Exit function early if tab name is invalid to prevent UI corruption
    // Effects: Maintains current UI state instead of breaking navigation
    // Removal impact: Function would continue with invalid tab, causing errors
    return;
  }

  // Get all section elements that contain timer content (stopwatch, pomodoro, history)
  // Effects: Finds all app sections so they can be hidden before showing target
  // Removal impact: Previous sections would remain visible, creating UI overlap
  const sections = document.querySelectorAll('.timer-section');
  
  // Get all navigation tab button elements for state management
  // Effects: Finds all navigation buttons so their active state can be updated
  // Removal impact: Navigation buttons wouldn't update, showing wrong active state
  const navTabs = document.querySelectorAll('.nav-tab');

  // Loop through all sections and remove active class to hide them
  // Effects: Hides all timer interfaces to prepare for showing the target section
  // Removal impact: Multiple sections could be visible simultaneously, breaking layout
  sections.forEach(section => {
    section.classList.remove('active');
  });

  // Loop through all navigation tabs and remove active class to reset state
  // Effects: Removes highlighting from all navigation buttons
  // Removal impact: Multiple tabs could appear active, confusing user about current view
  navTabs.forEach(tab => {
    tab.classList.remove('active');
  });

  // Find the specific section element for the requested tab using ID convention
  // Effects: Locates the target section that should be made visible
  // Removal impact: No target section found, navigation would fail silently
  const targetSection = document.getElementById(`section-${tabName}`);
  
  // Check if the target section exists in the DOM before attempting to show it
  // Effects: Prevents errors when trying to manipulate non-existent elements
  // Removal impact: Could cause errors trying to add class to null element
  if (targetSection) {
    // Add active class to make the target section visible to user
    // Effects: Shows the requested timer interface (stopwatch, pomodoro, or history)
    // Removal impact: Target section would remain hidden, navigation appears broken
    targetSection.classList.add('active');
  } else {
    // Log error if section element is not found for debugging
    // Effects: Helps developers identify missing HTML elements or ID mismatches
    // Removal impact: Silent failures, harder to debug missing sections
    console.error(`Section not found: section-${tabName}`);
    // Exit function early if section doesn't exist to prevent further errors
    // Effects: Maintains current UI state instead of partial navigation
    // Removal impact: Function would continue, potentially causing more errors
    return;
  }

  // Find the navigation tab button for the requested tab using data attribute
  // Effects: Locates the navigation button that should be highlighted as active
  // Removal impact: Navigation button state wouldn't update, confusing UI
  const targetTab = document.querySelector(`[data-tab="${tabName}"]`);
  
  // Check if the target tab button exists in the DOM before updating it
  // Effects: Prevents errors when trying to manipulate non-existent navigation elements
  // Removal impact: Could cause errors trying to add class to null element
  if (targetTab) {
    // Add active class to highlight the selected tab button
    // Effects: Shows user which section is currently active through visual highlighting
    // Removal impact: No visual indication of current section, poor user experience
    targetTab.classList.add('active');
  } else {
    // Log error if navigation tab is not found for debugging
    // Effects: Helps developers identify missing navigation elements or attribute mismatches
    // Removal impact: Silent failures, harder to debug navigation button issues
    console.error(`Navigation tab not found for: ${tabName}`);
  }
}
