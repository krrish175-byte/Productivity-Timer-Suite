// router.js - Navigation and tab switching logic

/**
 * Switches between different sections of the application
 * @param {string} tabName - The name of the tab to switch to ('stopwatch', 'pomodoro', or 'history')
 */
export function switchTab(tabName) {
  // Array of valid tab names that can be switched to
  const validTabs = ['stopwatch', 'pomodoro', 'history'];
  // Check if the requested tab name is in the valid list
  if (!validTabs.includes(tabName)) {
    // Log warning if invalid tab name is provided
    console.warn(`Invalid tab name: "${tabName}". Valid tabs are: ${validTabs.join(', ')}`);
    // Exit function early if tab name is invalid
    return;
  }

  // Get all section elements that contain timer content
  const sections = document.querySelectorAll('.timer-section');
  // Get all navigation tab button elements
  const navTabs = document.querySelectorAll('.nav-tab');

  // Loop through all sections and remove active class to hide them
  sections.forEach(section => {
    section.classList.remove('active');
  });

  // Loop through all navigation tabs and remove active class
  navTabs.forEach(tab => {
    tab.classList.remove('active');
  });

  // Find the specific section element for the requested tab
  const targetSection = document.getElementById(`section-${tabName}`);
  // Check if the target section exists in the DOM
  if (targetSection) {
    // Add active class to make the target section visible
    targetSection.classList.add('active');
  } else {
    // Log error if section element is not found
    console.error(`Section not found: section-${tabName}`);
    // Exit function early if section doesn't exist
    return;
  }

  // Find the navigation tab button for the requested tab
  const targetTab = document.querySelector(`[data-tab="${tabName}"]`);
  // Check if the target tab button exists in the DOM
  if (targetTab) {
    // Add active class to highlight the selected tab
    targetTab.classList.add('active');
  } else {
    // Log error if navigation tab is not found
    console.error(`Navigation tab not found for: ${tabName}`);
  }
}
